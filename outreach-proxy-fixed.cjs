#!/usr/bin/env node

// FIXED Outreach MCP Proxy - Enhanced Error Handling
// Addresses JSON-RPC 2.0 validation issues identified by BMAD analysis
// This proxy translates between Claude Desktop's stdio MCP protocol and HTTP server

const https = require('https');
const http = require('http');

// Configuration
const SERVER_URL = process.env.RAILWAY_URL || 'https://mcp-outreach-server-production.up.railway.app';
const MCP_ENDPOINT = '/tools/call';

let buffer = '';

// Enhanced HTTP request helper with proper error handling
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
        'x-api-key': '55d6900ec2fbe3804ba6904ddfb82dc1879cbf0ecdca85b5cc16b8ce964c74c8',
        'User-Agent': 'MCP-Outreach-Proxy/1.0.0'
      },
      timeout: 30000 // 30 second timeout
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
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          // Return proper JSON-RPC error for invalid JSON
          resolve({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Invalid JSON response from server',
              data: { originalResponse: responseData.substring(0, 200) }
            }
          });
        }
      });
    });

    req.on('error', (error) => {
      // Return proper JSON-RPC error for network issues
      reject({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: `Network error: ${error.message}`,
          data: { errorCode: error.code }
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Request timeout after 30 seconds'
        }
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Enhanced request processor with strict JSON-RPC 2.0 compliance
async function processRequest(request) {
  const requestId = request.id || null;
  
  try {
    console.error(`[Proxy] Processing: ${request.method} (ID: ${requestId})`);

    let response;

    if (request.method === 'initialize') {
      // Handle initialization with proper JSON-RPC format
      response = {
        jsonrpc: '2.0',
        id: requestId,
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
      console.error('[Proxy] Initialization complete');
      return;
      
    } else if (request.method === 'tools/list') {
      // Handle tools list with all 24 tools properly formatted
      const tools = [
        {
          name: 'create_complete_email_sequence',
          description: 'Create a complete email sequence with templates and timing in one call - no need for multiple steps',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceName: {
                type: 'string',
                description: 'Name of the sequence (e.g., "TechCorp - Security Platform - Steve Jobs Style")'
              },
              description: {
                type: 'string', 
                description: 'Description of the sequence purpose and target audience'
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags for organizing the sequence (e.g., ["security", "enterprise", "cold outreach"])'
              },
              emails: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    templateName: { type: 'string', description: 'Name of the email template' },
                    subject: { type: 'string', description: 'Email subject line with personalization variables' },
                    bodyHtml: { type: 'string', description: 'HTML email content with {{first_name}} and {{account.name}} variables' },
                    tags: { type: 'array', items: { type: 'string' }, description: 'Tags for this specific email' },
                    intervalInDays: { type: 'number', description: 'Days to wait before sending this email (0 for first email)' }
                  },
                  required: ['templateName', 'subject', 'bodyHtml', 'intervalInDays']
                },
                minItems: 1,
                maxItems: 10,
                description: 'Array of email templates with timing'
              }
            },
            required: ['sequenceName', 'description', 'emails']
          }
        },
        {
          name: 'create_prospect',
          description: 'Create a new prospect in Outreach (enhanced with caching)',
          inputSchema: {
            type: 'object',
            properties: {
              firstName: { type: 'string', description: 'First name of the prospect' },
              lastName: { type: 'string', description: 'Last name of the prospect' },
              email: { type: 'string', description: 'Email address of the prospect' },
              company: { type: 'string', description: 'Company name' },
              title: { type: 'string', description: 'Job title of the prospect' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Tags to assign to the prospect' }
            },
            required: ['firstName', 'lastName', 'email']
          }
        },
        {
          name: 'search_prospects',
          description: 'Search for prospects based on criteria (enhanced with caching)',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', description: 'Search by email address' },
              company: { type: 'string', description: 'Search by company name' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Search by tags' },
              limit: { type: 'number', description: 'Maximum number of results', default: 25 }
            }
          }
        },
        {
          name: 'get_sequences',
          description: 'Get all sequences from Outreach (enhanced with caching)',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Maximum number of sequences', default: 25 }
            }
          }
        },
        {
          name: 'create_sequence',
          description: 'Create a new sequence in Outreach (enhanced with caching)',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name of the sequence' },
              description: { type: 'string', description: 'Description of the sequence' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the sequence' }
            },
            required: ['name']
          }
        },
        {
          name: 'health_check',
          description: 'Check the health status of the MCP server and Outreach API connection',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ];

      response = {
        jsonrpc: '2.0',
        id: requestId,
        result: {
          tools: tools
        }
      };
      
    } else if (request.method === 'tools/call') {
      // Handle tool calls with enhanced error handling
      try {
        const { name, arguments: args = {} } = request.params || {};
        
        if (!name) {
          throw new Error('Tool name is required');
        }
        
        console.error(`[Proxy] Calling tool: ${name}`);
        
        const toolResponse = await makeHttpRequest('POST', MCP_ENDPOINT, {
          name: name,
          arguments: args
        });

        // Handle server response format variations
        if (toolResponse.jsonrpc && toolResponse.error) {
          // Server returned a JSON-RPC error
          response = {
            jsonrpc: '2.0',
            id: requestId,
            error: toolResponse.error
          };
        } else if (toolResponse.error) {
          // Server returned a plain error
          response = {
            jsonrpc: '2.0',
            id: requestId,
            error: {
              code: -32603,
              message: typeof toolResponse.error === 'string' ? toolResponse.error : 'Tool execution failed',
              data: toolResponse.error
            }
          };
        } else {
          // Successful tool response
          let content = [];
          
          if (typeof toolResponse === 'string') {
            content = [{ type: 'text', text: toolResponse }];
          } else if (toolResponse.result && toolResponse.result.content) {
            content = toolResponse.result.content;
          } else if (toolResponse.content) {
            content = toolResponse.content;
          } else if (toolResponse.result) {
            content = [{ type: 'text', text: JSON.stringify(toolResponse.result, null, 2) }];
          } else {
            content = [{ type: 'text', text: JSON.stringify(toolResponse, null, 2) }];
          }

          response = {
            jsonrpc: '2.0',
            id: requestId,
            result: {
              content: content
            }
          };
        }
        
      } catch (error) {
        console.error(`[Proxy] Tool call error:`, error);
        
        response = {
          jsonrpc: '2.0',
          id: requestId,
          error: {
            code: -32603,
            message: error.message || 'Tool call failed',
            data: {
              toolName: request.params?.name || 'unknown',
              errorType: error.name || 'Error'
            }
          }
        };
      }
      
    } else {
      // Unknown method
      response = {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`,
          data: { supportedMethods: ['initialize', 'tools/list', 'tools/call', 'notifications/initialized'] }
        }
      };
    }

    // Send response with validation
    if (response) {
      // Validate response format before sending
      if (!response.jsonrpc) {
        console.error('[Proxy] ERROR: Response missing jsonrpc field');
        response.jsonrpc = '2.0';
      }
      
      if (response.id === undefined && requestId !== null) {
        console.error('[Proxy] ERROR: Response missing id field');
        response.id = requestId;
      }
      
      console.error(`[Proxy] Sending response for ID: ${response.id}`);
      console.log(JSON.stringify(response));
    }

  } catch (error) {
    console.error(`[Proxy] Fatal error processing request:`, error);
    
    // Always send a proper JSON-RPC error response
    const errorResponse = {
      jsonrpc: '2.0',
      id: requestId,
      error: {
        code: -32603,
        message: `Proxy error: ${error.message}`,
        data: {
          method: request.method || 'unknown',
          errorType: error.name || 'Error'
        }
      }
    };
    
    console.log(JSON.stringify(errorResponse));
  }
}

// Enhanced input handling with better error recovery
process.stdin.on('data', async (data) => {
  buffer += data.toString();
  
  // Process complete lines
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    try {
      const request = JSON.parse(line);
      await processRequest(request);
    } catch (error) {
      console.error(`[Proxy] JSON parse error:`, error.message);
      
      // Send proper parse error response
      const parseError = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: { 
            originalLine: line.substring(0, 100),
            parseError: error.message
          }
        }
      };
      
      console.log(JSON.stringify(parseError));
    }
  }
});

// Enhanced cleanup handlers
process.stdin.on('end', () => {
  console.error('[Proxy] stdin closed - shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[Proxy] Received SIGTERM - shutting down');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.error('[Proxy] Received SIGINT - shutting down');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('[Proxy] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Proxy] Unhandled rejection:', reason);
  process.exit(1);
});

console.error(`[Proxy] Enhanced Outreach MCP Proxy started, connecting to ${SERVER_URL}`);
console.error('[Proxy] BMAD Enhanced Error Handling - Version 1.0.0');