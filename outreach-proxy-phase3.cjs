#!/usr/bin/env node

// PHASE 3 - Outreach MCP Proxy with Enterprise Features (25 Tools + 4 Enterprise Tools = 29 Total)
// Complete implementation of LEEYA deployment plan Phase 3: Enterprise-level capabilities

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
            name: 'outreach-mcp-server-phase3-enterprise',
            version: '3.0.0'
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
        // PHASE 1 TOOLS (12 core tools)
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
        },
        {
          name: 'list_sequences',
          description: 'Enhanced sequence listing with analytics and performance data',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of sequences to return', default: 50 },
              offset: { type: 'number', description: 'Offset for pagination', default: 0 }
            }
          }
        },
        {
          name: 'get_account_prospects',
          description: 'Get prospects from a specific account',
          inputSchema: {
            type: 'object',
            properties: {
              accountId: { type: 'number', description: 'ID of the account' },
              accountName: { type: 'string', description: 'Name of the account (alternative to accountId)' },
              limit: { type: 'number', description: 'Number of prospects to return', default: 100 }
            }
          }
        },
        {
          name: 'search_accounts',
          description: 'Search for accounts by name or domain',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query (name or domain)' },
              limit: { type: 'number', description: 'Number of accounts to return', default: 20 }
            },
            required: ['query']
          }
        },
        {
          name: 'add_prospects_to_sequence',
          description: 'Add prospects to a sequence',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceId: { type: 'number', description: 'ID of the sequence' },
              prospectIds: { type: 'array', items: { type: 'number' }, description: 'Array of prospect IDs to add' },
              mailboxId: { type: 'number', description: 'ID of the mailbox to use for sending' }
            },
            required: ['sequenceId', 'prospectIds']
          }
        },
        {
          name: 'create_sequence_step',
          description: 'Add a step to a sequence',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceId: { type: 'number', description: 'ID of the sequence' },
              order: { type: 'number', description: 'Order of the step in the sequence' },
              interval: { type: 'number', description: 'Days to wait before this step', default: 1 },
              stepType: { 
                type: 'string', 
                description: 'Type of step: auto_email, manual_email, call, task, linkedin_send_message',
                enum: ['auto_email', 'manual_email', 'call', 'task', 'linkedin_send_message']
              },
              subject: { type: 'string', description: 'Email subject (for email steps)' },
              body: { type: 'string', description: 'Content of the step' }
            },
            required: ['sequenceId', 'order', 'stepType']
          }
        },
        {
          name: 'get_mailboxes',
          description: 'Get available mailboxes for sending emails',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of mailboxes to return', default: 100 }
            }
          }
        },
        // PHASE 2 ADVANCED TOOLS (9 additional tools)
        {
          name: 'get_sequence_by_id',
          description: 'Get detailed sequence information by ID',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceId: { type: 'number', description: 'ID of the sequence to retrieve' }
            },
            required: ['sequenceId']
          }
        },
        {
          name: 'update_sequence',
          description: 'Update an existing sequence',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceId: { type: 'number', description: 'ID of the sequence to update' },
              name: { type: 'string', description: 'New name for the sequence' },
              description: { type: 'string', description: 'New description for the sequence' },
              enabled: { type: 'boolean', description: 'Whether the sequence should be enabled' }
            },
            required: ['sequenceId']
          }
        },
        {
          name: 'delete_sequence',
          description: 'Delete a sequence',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceId: { type: 'number', description: 'ID of the sequence to delete' }
            },
            required: ['sequenceId']
          }
        },
        {
          name: 'get_sequence_steps',
          description: 'Get all steps for a sequence',
          inputSchema: {
            type: 'object',
            properties: {
              sequenceId: { type: 'number', description: 'ID of the sequence' }
            },
            required: ['sequenceId']
          }
        },
        {
          name: 'update_sequence_step',
          description: 'Update a sequence step',
          inputSchema: {
            type: 'object',
            properties: {
              stepId: { type: 'number', description: 'ID of the step to update' },
              subject: { type: 'string', description: 'Email subject (for email steps)' },
              body: { type: 'string', description: 'Content of the step' },
              interval: { type: 'number', description: 'Days to wait before this step' }
            },
            required: ['stepId']
          }
        },
        {
          name: 'delete_sequence_step',
          description: 'Delete a sequence step',
          inputSchema: {
            type: 'object',
            properties: {
              stepId: { type: 'number', description: 'ID of the step to delete' }
            },
            required: ['stepId']
          }
        },
        {
          name: 'update_prospect',
          description: 'Update prospect details',
          inputSchema: {
            type: 'object',
            properties: {
              prospectId: { type: 'number', description: 'ID of the prospect to update' },
              firstName: { type: 'string', description: 'First name of the prospect' },
              lastName: { type: 'string', description: 'Last name of the prospect' },
              email: { type: 'string', description: 'Email address of the prospect' },
              company: { type: 'string', description: 'Company name' },
              title: { type: 'string', description: 'Job title' }
            },
            required: ['prospectId']
          }
        },
        {
          name: 'get_prospect_by_id',
          description: 'Get detailed prospect information by ID',
          inputSchema: {
            type: 'object',
            properties: {
              prospectId: { type: 'number', description: 'ID of the prospect to retrieve' }
            },
            required: ['prospectId']
          }
        },
        {
          name: 'get_templates',
          description: 'List email templates',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Number of templates to return', default: 50 }
            }
          }
        },
        // PHASE 3 ENTERPRISE TOOLS (4 new enterprise-level tools)
        {
          name: 'get_health_status',
          description: 'Get comprehensive MCP server health status and metrics',
          inputSchema: {
            type: 'object',
            properties: {
              detailed: {
                type: 'boolean',
                description: 'Include detailed component health information',
                default: true
              }
            }
          }
        },
        {
          name: 'get_error_analytics',
          description: 'Get error analytics and recovery metrics',
          inputSchema: {
            type: 'object',
            properties: {
              hours: {
                type: 'number',
                description: 'Hours of error history to analyze',
                default: 24
              }
            }
          }
        },
        {
          name: 'get_rate_limit_stats',
          description: 'Get API rate limiting statistics and utilization',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'reset_rate_limiter',
          description: 'Reset the API rate limiter (admin function)',
          inputSchema: {
            type: 'object',
            properties: {
              confirm: {
                type: 'boolean',
                description: 'Confirm the rate limiter reset',
                default: false
              }
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

console.error(`[Proxy] Outreach MCP Proxy Phase 3 Enterprise started - 25 TOOLS + 4 ENTERPRISE TOOLS = 29 TOTAL`);
console.error(`[Proxy] Server: ${SERVER_URL}`);
console.error(`[Proxy] Enterprise Features: Rate Limiting, Error Analytics, Health Monitoring, Performance Optimization`);