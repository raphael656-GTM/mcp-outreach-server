#!/usr/bin/env node

// MCP HTTP-to-STDIO Bridge
// This script bridges Claude Desktop's stdio MCP protocol to our HTTP-based MCP server

const https = require('https');
const http = require('http');

const MCP_SERVER_URL = 'https://mcp-outreach-server-production.up.railway.app/mcp-server';

// Buffer to collect stdin data
let inputBuffer = '';

// Function to make HTTP request to MCP server
function makeHttpRequest(data) {
  return new Promise((resolve, reject) => {
    const url = new URL(MCP_SERVER_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve(responseData);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Track pending requests
let pendingRequests = 0;

// Handle stdin data
process.stdin.on('data', async (data) => {
  inputBuffer += data.toString();
  
  // Process complete JSON-RPC messages
  const lines = inputBuffer.split('\n');
  inputBuffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (line.trim()) {
      let jsonData = null;
      try {
        jsonData = JSON.parse(line.trim());
        console.error(`[Bridge] Received: ${JSON.stringify(jsonData)}`);
        
        pendingRequests++;
        const response = await makeHttpRequest(line.trim());
        console.error(`[Bridge] Sending: ${response}`);
        
        process.stdout.write(response + '\n');
        pendingRequests--;
      } catch (error) {
        console.error(`[Bridge] Error processing message: ${error.message}`);
        
        // Send error response with proper JSON-RPC format
        const errorResponse = {
          jsonrpc: '2.0',
          id: jsonData?.id || null,
          error: {
            code: -32700, // Parse error for JSON parsing issues, -32603 for internal errors
            message: error.name === 'SyntaxError' ? 'Parse error' : `Bridge error: ${error.message}`,
            data: { originalError: error.message }
          }
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
        pendingRequests--;
      }
    }
  }
});

process.stdin.on('end', () => {
  console.error('[Bridge] stdin closed');
  // Wait for pending requests before exiting
  const checkPending = () => {
    if (pendingRequests === 0) {
      process.exit(0);
    } else {
      setTimeout(checkPending, 10);
    }
  };
  checkPending();
});

// Handle process termination
process.on('SIGTERM', () => {
  console.error('[Bridge] Received SIGTERM, exiting');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.error('[Bridge] Received SIGINT, exiting');
  process.exit(0);
});

console.error('[Bridge] MCP HTTP-to-STDIO Bridge started');