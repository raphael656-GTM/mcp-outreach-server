#!/usr/bin/env node

/**
 * Outreach MCP Proxy - Updated for Railway MCP Server
 * Forwards all requests to the Railway-hosted MCP server with template linking support
 */

const https = require('https');
const http = require('http');

// Configuration with multiple fallback options
const SERVER_URL = process.env.RAILWAY_URL || process.env.OUTREACH_SERVER_URL || 'https://mcp-outreach-server-production.up.railway.app';

// Try multiple environment variable names for the refresh token
const OUTREACH_REFRESH_TOKEN = process.env.OUTREACH_REFRESH_TOKEN || 
                               process.env.OUTREACH_API_REFRESH_TOKEN || 
                               process.env.REFRESH_TOKEN;

// Debug logging
console.error(`[Proxy] SERVER_URL: ${SERVER_URL}`);
console.error(`[Proxy] OUTREACH_REFRESH_TOKEN: ${OUTREACH_REFRESH_TOKEN ? 'SET' : 'NOT SET'}`);

if (!OUTREACH_REFRESH_TOKEN) {
  console.error(`[Proxy] ERROR: Outreach refresh token not found in environment variables`);
  console.error(`[Proxy] Please set one of: OUTREACH_REFRESH_TOKEN, OUTREACH_API_REFRESH_TOKEN, or REFRESH_TOKEN`);
  console.error(`[Proxy] Available env vars: ${Object.keys(process.env).filter(k => k.includes('OUTREACH') || k.includes('TOKEN')).join(', ') || 'none'}`);
  
  // Don't exit immediately - try to continue and show the error in responses
  console.error(`[Proxy] Continuing without token - requests will fail with authentication errors`);
}

let buffer = '';

// HTTP request helper
function makeHttpRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SERVER_URL + endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(OUTREACH_REFRESH_TOKEN ? { 'X-Outreach-Refresh-Token': OUTREACH_REFRESH_TOKEN } : {})
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve({ error: 'Invalid JSON response', data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Process MCP request and forward to Railway server
async function processRequest(request) {
  try {
    console.error(`[Proxy] Processing: ${request.method}`);

    let response;

    if (request.method === 'initialize') {
      // Handle initialization directly
      response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'outreach-mcp-server',
            version: '1.0.0'
          }
        }
      };
    } else if (request.method === 'notifications/initialized') {
      // Handle initialized notification (no response needed)
      return;
    } else if (request.method === 'tools/list') {
      // Forward to Railway server
      const serverResponse = await makeHttpRequest('POST', '/mcp', {
        method: 'tools/list'
      });
      response = {
        jsonrpc: '2.0',
        id: request.id,
        result: serverResponse
      };
    } else if (request.method === 'tools/call') {
      // Forward to Railway server
      const serverResponse = await makeHttpRequest('POST', '/mcp', {
        method: 'tools/call',
        params: request.params
      });
      response = {
        jsonrpc: '2.0',
        id: request.id,
        result: serverResponse
      };
    } else if (request.method === 'prompts/list') {
      // Return empty prompts list
      response = {
        jsonrpc: '2.0',
        id: request.id,
        result: { prompts: [] }
      };
    } else if (request.method === 'resources/list') {
      // Return empty resources list
      response = {
        jsonrpc: '2.0',
        id: request.id,
        result: { resources: [] }
      };
    } else if (request.method && request.method.startsWith('notifications/')) {
      // Ignore notifications
      return;
    } else {
      // Unknown method
      response = {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32601, message: `Method not found: ${request.method}` }
      };
    }

    // Send response
    if (response) {
      console.log(JSON.stringify(response));
    }

  } catch (error) {
    console.error(`[Proxy] Error: ${error.message}`);
    
    // Send error response
    const errorResponse = {
      jsonrpc: '2.0',
      id: request.id || null,
      error: {
        code: -32603,
        message: `Proxy error: ${error.message}`,
        data: error.stack
      }
    };
    console.log(JSON.stringify(errorResponse));
  }
}

// Handle incoming data from Claude Desktop
process.stdin.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  
  // Keep incomplete line in buffer
  buffer = lines.pop() || '';
  
  // Process complete lines
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    try {
      const request = JSON.parse(line);
      processRequest(request);
    } catch (parseError) {
      console.error(`[Proxy] Parse error: ${parseError.message}`);
    }
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.error('[Proxy] Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[Proxy] Terminating...');
  process.exit(0);
});

// Health check on startup
async function healthCheck() {
  try {
    const response = await makeHttpRequest('GET', '/health');
    if (response && response.status === 'healthy') {
      console.error(`✅ Connected to Outreach MCP Server: ${response.service} v${response.version}`);
    } else {
      console.error(`⚠️  Server health check failed`);
    }
  } catch (error) {
    console.error(`❌ Cannot connect to server: ${error.message}`);
  }
}

// Run health check
healthCheck();

console.error('[Proxy] Outreach MCP Proxy ready - forwarding requests to Railway server with template linking support');