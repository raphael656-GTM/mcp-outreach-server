#!/usr/bin/env node

// FINAL FIX - Outreach MCP Proxy with Strict Zod Validation Compliance
// Addresses all union validation issues by ensuring strict type compliance

const https = require('https');
const http = require('http');

const SERVER_URL = process.env.RAILWAY_URL || 'https://mcp-outreach-server-production.up.railway.app';
const MCP_ENDPOINT = '/mcp-server';

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
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Generate proper request ID - never null, always string or number
function generateRequestId(originalId) {
  if (originalId !== null && originalId !== undefined) {
    return originalId;
  }
  return Date.now(); // Return number if no ID provided
}

// Process MCP request with strict compliance
async function processRequest(request) {
  // CRITICAL: Always generate a valid ID - never null/undefined
  const requestId = generateRequestId(request.id);
  
  try {
    console.error(`[Proxy] Processing: ${request.method} (ID: ${requestId})`);

    if (request.method === 'initialize') {
      const response = {
        jsonrpc: '2.0',
        id: requestId, // Always valid ID
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
      
      console.log(JSON.stringify(response));
      return;
      
    } else if (request.method === 'notifications/initialized') {
      // No response for notifications
      return;
      
    } else if (request.method === 'tools/list') {
      const tools = [
        {
          name: 'create_complete_email_sequence',
          description: 'Create a complete email sequence with templates and timing in one call',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceName: { type: 'string' },
              description: { type: 'string' },
              emails: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    templateName: { type: 'string' },
                    subject: { type: 'string' },
                    bodyHtml: { type: 'string' },
                    intervalInDays: { type: 'number' }
                  },
                  required: ['templateName', 'subject', 'bodyHtml', 'intervalInDays']
                }
              }
            },
            required: ['sequenceName', 'description', 'emails']
          }
        },
        {
          name: 'create_prospect',
          description: 'Create a new prospect in Outreach',
          inputSchema: {
            type: 'object',
            properties: {
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string' },
              company: { type: 'string' },
              title: { type: 'string' }
            },
            required: ['firstName', 'lastName', 'email']
          }
        },
        {
          name: 'search_prospects',
          description: 'Search for prospects',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              company: { type: 'string' },
              limit: { type: 'number', default: 25 }
            }
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
        },
        {
          name: 'create_sequence',
          description: 'Create a new sequence',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' }
            },
            required: ['name']
          }
        },
        {
          name: 'health_check',
          description: 'Check server health',
          inputSchema: {
            type: 'object',
            properties: {}
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
      
      console.log(JSON.stringify(response));
      return;
      
    } else if (request.method === 'tools/call') {
      try {
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
        
        const toolResponse = await makeHttpRequest('POST', MCP_ENDPOINT, {
          jsonrpc: '2.0',
          id: requestId,
          method: 'tools/call',
          params: { name, arguments: args }
        });

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
        
        // Format successful response
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
      // Unknown method
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
    console.error(`[Proxy] Fatal error:`, error);
    
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
  buffer += data.toString();
  
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    try {
      const request = JSON.parse(line);
      
      // Validate request has method
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
      console.error(`[Proxy] Parse error:`, error);
      
      const parseErrorResponse = {
        jsonrpc: '2.0',
        id: Date.now(), // Always provide valid ID for parse errors
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
  console.error('[Proxy] stdin closed');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[Proxy] SIGTERM received');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.error('[Proxy] SIGINT received');
  process.exit(0);
});

console.error(`[Proxy] Outreach MCP Proxy started - FINAL FIX`);
console.error(`[Proxy] Server: ${SERVER_URL}`);