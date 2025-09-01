#!/usr/bin/env node

// DEBUG VERSION - Helps identify connection issues

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVER_URL = process.env.RAILWAY_URL || 'https://mcp-outreach-server-production.up.railway.app';
const MCP_ENDPOINT = '/mcp-server';

// Debug logging
const DEBUG = true;
const LOG_FILE = path.join(process.env.HOME || '/tmp', 'mcp-debug.log');

function debugLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  if (DEBUG) {
    fs.appendFileSync(LOG_FILE, logMessage);
    console.error(`[DEBUG] ${message}`);
  }
}

debugLog('=== MCP Proxy Started ===');
debugLog(`Server URL: ${SERVER_URL}`);
debugLog(`Log file: ${LOG_FILE}`);

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
        'Content-Type': 'application/json'
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
      debugLog(`HTTP request error: ${error.message}`);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Generate proper request ID
function generateRequestId(originalId) {
  if (originalId !== null && originalId !== undefined) {
    return originalId;
  }
  return Date.now();
}

// Process MCP request
async function processRequest(request) {
  const requestId = generateRequestId(request.id);
  
  debugLog(`Processing request: ${JSON.stringify(request)}`);
  
  try {
    if (request.method === 'initialize') {
      const response = {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'outreach-mcp-debug',
            version: '1.0.0'
          }
        }
      };
      
      debugLog(`Sending response: ${JSON.stringify(response)}`);
      console.log(JSON.stringify(response));
      return;
      
    } else if (request.method === 'notifications/initialized') {
      debugLog('Received initialized notification');
      return;
      
    } else if (request.method === 'tools/list') {
      // Return just 2 tools for simple testing
      const tools = [
        {
          name: 'health_check',
          description: 'Check server health',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'get_sequences',
          description: 'Get all sequences from Outreach',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', default: 25 }
            }
          }
        }
      ];

      const response = {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          tools: tools
        }
      };
      
      debugLog(`Sending tools list: ${JSON.stringify(response)}`);
      console.log(JSON.stringify(response));
      return;
      
    } else if (request.method === 'tools/call') {
      debugLog(`Tool call request: ${JSON.stringify(request.params)}`);
      
      const { name, arguments: args = {} } = request.params || {};
      
      if (!name) {
        const errorResponse = {
          jsonrpc: '2.0',
          id: requestId,
          error: {
            code: -32602,
            message: 'Invalid params: tool name is required'
          }
        };
        console.log(JSON.stringify(errorResponse));
        return;
      }
      
      // For health_check, return a simple response without calling the server
      if (name === 'health_check') {
        const response = {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            content: [
              {
                type: 'text',
                text: 'Debug proxy is running. Server connectivity test pending.'
              }
            ]
          }
        };
        debugLog(`Sending health check response: ${JSON.stringify(response)}`);
        console.log(JSON.stringify(response));
        return;
      }
      
      // For other tools, try to call the server
      try {
        const toolResponse = await makeHttpRequest('POST', MCP_ENDPOINT, {
          jsonrpc: '2.0',
          id: requestId,
          method: 'tools/call',
          params: { name, arguments: args }
        });

        debugLog(`Server response: ${JSON.stringify(toolResponse)}`);

        if (toolResponse.error) {
          const errorResponse = {
            jsonrpc: '2.0',
            id: requestId,
            error: {
              code: -32603,
              message: typeof toolResponse.error === 'string' ? toolResponse.error : 'Tool execution failed'
            }
          };
          console.log(JSON.stringify(errorResponse));
          return;
        }
        
        let content = [];
        if (typeof toolResponse === 'string') {
          content = [{ type: 'text', text: toolResponse }];
        } else if (toolResponse.result && Array.isArray(toolResponse.result.content)) {
          content = toolResponse.result.content;
        } else if (Array.isArray(toolResponse.content)) {
          content = toolResponse.content;
        } else {
          content = [{ type: 'text', text: JSON.stringify(toolResponse, null, 2) }];
        }

        const successResponse = {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            content: content
          }
        };
        
        console.log(JSON.stringify(successResponse));
        return;
        
      } catch (error) {
        debugLog(`Tool execution error: ${error.message}`);
        const errorResponse = {
          jsonrpc: '2.0',
          id: requestId,
          error: {
            code: -32603,
            message: error.message || 'Internal error'
          }
        };
        console.log(JSON.stringify(errorResponse));
        return;
      }
      
    } else {
      debugLog(`Unknown method: ${request.method}`);
      const errorResponse = {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      };
      console.log(JSON.stringify(errorResponse));
      return;
    }

  } catch (error) {
    debugLog(`Fatal error: ${error.message}`);
    
    const errorResponse = {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32603,
        message: `Proxy error: ${error.message}`
      }
    };
    
    console.log(JSON.stringify(errorResponse));
  }
}

// Handle stdin data
process.stdin.on('data', async (data) => {
  const chunk = data.toString();
  debugLog(`Received data: ${chunk}`);
  
  buffer += chunk;
  
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    debugLog(`Processing line: ${line}`);
    
    try {
      const request = JSON.parse(line);
      
      if (!request.method) {
        const errorResponse = {
          jsonrpc: '2.0',
          id: generateRequestId(request.id),
          error: {
            code: -32600,
            message: 'Invalid Request: method is required'
          }
        };
        console.log(JSON.stringify(errorResponse));
        continue;
      }
      
      await processRequest(request);
      
    } catch (error) {
      debugLog(`Parse error: ${error.message} for line: ${line}`);
      
      const parseErrorResponse = {
        jsonrpc: '2.0',
        id: Date.now(),
        error: {
          code: -32700,
          message: 'Parse error'
        }
      };
      
      console.log(JSON.stringify(parseErrorResponse));
    }
  }
});

process.stdin.on('end', () => {
  debugLog('stdin closed');
  process.exit(0);
});

process.on('SIGTERM', () => {
  debugLog('SIGTERM received');
  process.exit(0);
});

process.on('SIGINT', () => {
  debugLog('SIGINT received');
  process.exit(0);
});

debugLog('Debug proxy ready and listening...');
console.error('[DEBUG] MCP Debug Proxy Started');
console.error(`[DEBUG] Check logs at: ${LOG_FILE}`);