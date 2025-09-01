#!/usr/bin/env node

/**
 * Simple Outreach MCP Proxy - Based on Successful Lemlist Pattern
 * Forwards MCP requests to Railway-hosted Outreach MCP server
 */

import fetch from 'node-fetch';

// Configuration from environment variables
const SERVER_URL = process.env.RAILWAY_URL || process.env.OUTREACH_MCP_SERVER_URL;
const API_KEY = process.env.MCP_API_KEY; // Optional server auth
const OUTREACH_REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN; // User's Outreach refresh token

if (!SERVER_URL) {
  console.error(JSON.stringify({
    error: 'RAILWAY_URL or OUTREACH_MCP_SERVER_URL environment variable is required'
  }));
  process.exit(1);
}

if (!OUTREACH_REFRESH_TOKEN) {
  console.error(JSON.stringify({
    error: 'OUTREACH_REFRESH_TOKEN environment variable is required'
  }));
  process.exit(1);
}

let buffer = '';

// Handle incoming MCP requests from Claude Desktop
process.stdin.on('data', async (data) => {
  try {
    buffer += data.toString();
    const lines = buffer.split('\n');
    
    // Keep the last incomplete line in buffer
    buffer = lines.pop() || '';
    
    // Process each complete line
    for (const line of lines) {
      if (line.trim() === '') continue;
      
      try {
        const request = JSON.parse(line);
        await processRequest(request);
      } catch (parseError) {
        console.error(JSON.stringify({
          error: `Parse Error: ${parseError.message}`,
          line: line
        }));
      }
    }
  } catch (error) {
    console.error(JSON.stringify({
      error: `Buffer Error: ${error.message}`,
      details: error.stack
    }));
  }
});

async function processRequest(request) {
  try {
    // Transform MCP request to server format
    let serverRequest;
    
    if (request.method === 'initialize') {
      // Handle initialize request directly
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2025-06-18',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'outreach-mcp-server',
            version: '1.0.0'
          }
        }
      }));
      return;
    } else if (request.method === 'notifications/initialized') {
      // Ignore initialized notification
      return;
    } else if (request.method === 'tools/list') {
      serverRequest = { method: 'tools/list' };
    } else if (request.method === 'tools/call') {
      serverRequest = { method: 'tools/call', params: request.params };
    } else if (request.method === 'prompts/list') {
      // Handle prompts/list - return empty list
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: { prompts: [] }
      }));
      return;
    } else if (request.method === 'resources/list') {
      // Handle resources/list - return empty list
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        result: { resources: [] }
      }));
      return;
    } else if (request.method && request.method.startsWith('notifications/')) {
      // Ignore notifications
      return;
    } else {
      // Unknown method, return error
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32601, message: `Method not found: ${request.method}` }
      }));
      return;
    }
    
    // Forward request to Railway-hosted MCP server
    const response = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {}),
        'X-Outreach-Refresh-Token': OUTREACH_REFRESH_TOKEN // Pass user's Outreach refresh token
      },
      body: JSON.stringify(serverRequest),
      timeout: 30000
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: request.id,
        error: { 
          code: -32603, 
          message: `Server error: ${response.status} ${response.statusText}`,
          data: errorText
        }
      }));
      return;
    }

    const result = await response.json();
    
    // Return result in MCP format
    console.log(JSON.stringify({
      jsonrpc: '2.0',
      id: request.id,
      result: result
    }));
    
  } catch (error) {
    console.error(JSON.stringify({
      error: `Process Request Error: ${error.message}`,
      details: error.stack
    }));
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Health check on startup
async function healthCheck() {
  try {
    const response = await fetch(`${SERVER_URL}/health`, {
      timeout: 5000
    });
    
    if (response.ok) {
      const health = await response.json();
      console.error(`✅ Connected to Outreach MCP Server: ${health.service} v${health.version}`);
    } else {
      console.error(`⚠️  Server health check failed: ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Cannot connect to server: ${error.message}`);
  }
}

// Run health check on startup
healthCheck();