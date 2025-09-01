#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { OutreachClient } from './outreach-client.js';
import { OutreachOAuth } from './oauth.js';
import { MCPHealthMonitor } from './enterprise/health-monitor.js';
import { config } from 'dotenv';
import axios from 'axios';

config();

const server = new Server(
  {
    name: 'mcp-outreach-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let outreachClient: OutreachClient | null = null;
let healthMonitor: MCPHealthMonitor;

function ensureOutreachClient(): OutreachClient {
  if (!outreachClient) {
    throw new McpError(
      ErrorCode.InternalError,
      'Outreach client not initialized. Please check server logs for authentication errors.'
    );
  }
  return outreachClient;
}

async function initializeClient() {
  try {
    console.error('🔄 Starting MCP client initialization...');
    
    // Use OAuth credentials for MCP servers
    const clientId = process.env.OUTREACH_CLIENT_ID;
    const clientSecret = process.env.OUTREACH_CLIENT_SECRET;
    const refreshToken = process.env.OUTREACH_REFRESH_TOKEN;
    const redirectUri = process.env.OUTREACH_REDIRECT_URI || 'http://localhost:3000/callback';
    
    console.error('📋 Environment variables check:');
    console.error(`  - CLIENT_ID: ${clientId ? '✅' : '❌'} (${clientId ? clientId.substring(0, 20) + '...' : 'MISSING'})`);
    console.error(`  - CLIENT_SECRET: ${clientSecret ? '✅' : '❌'} (${clientSecret ? clientSecret.substring(0, 10) + '...' : 'MISSING'})`);
    console.error(`  - REFRESH_TOKEN: ${refreshToken ? '✅' : '❌'} (${refreshToken ? refreshToken.substring(0, 20) + '...' : 'MISSING'})`);
    console.error(`  - REDIRECT_URI: ${redirectUri}`);
    
    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('OUTREACH_CLIENT_ID, OUTREACH_CLIENT_SECRET, and OUTREACH_REFRESH_TOKEN environment variables are required.');
    }

    console.error('🔐 Refreshing OAuth token directly...');
    // Use environment variable refresh token directly 
    const tokenResponse = await axios.post('https://api.outreach.io/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const accessToken = tokenResponse.data.access_token;
    console.error('✅ Access token obtained successfully');
    
    console.error('🌐 Initializing Outreach client...');
    outreachClient = new OutreachClient(
      accessToken,
      process.env.OUTREACH_API_URL || 'https://api.outreach.io/api/v2'
    );
    
    console.error('✅ MCP Outreach server initialized with OAuth credentials');
    
    // Initialize health monitoring
    console.error('🏥 Initializing health monitor...');
    healthMonitor = new MCPHealthMonitor();
    
    // Register Outreach API health checker
    healthMonitor.registerHealthChecker('outreach-api', async () => {
      try {
        const start = Date.now();
        // Simple health check - list sequences with limit 1
        if (outreachClient) {
          await outreachClient.listSequences(1);
        }
        const responseTime = Date.now() - start;
        
        return {
          name: 'outreach-api',
          status: responseTime < 2000 ? 'healthy' : responseTime < 5000 ? 'warning' : 'critical',
          responseTime,
          details: {
            responseTimeMs: responseTime,
            threshold: { warning: 2000, critical: 5000 }
          }
        };
      } catch (error: any) {
        return {
          name: 'outreach-api',
          status: 'critical',
          details: {
            error: error.message,
            errorType: error.response?.status || 'network'
          }
        };
      }
    });
    
    console.error('✅ Health monitoring initialized');
  } catch (error: any) {
    console.error('❌ Failed to initialize MCP client:', error);
    console.error('❌ Error details:', error?.message || 'Unknown error');
    console.error('❌ Error stack:', error?.stack || 'No stack trace');
    throw error;
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_sequence',
        description: 'Create a new sequence in Outreach',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the sequence',
            },
            description: {
              type: 'string',
              description: 'Description of the sequence',
            },
            enabled: {
              type: 'boolean',
              description: 'Whether the sequence is enabled',
              default: true,
            },
            shareType: {
              type: 'string',
              description: 'Share type: private, read_only, or shared',
              enum: ['private', 'read_only', 'shared'],
              default: 'private',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'list_sequences',
        description: 'List all sequences in Outreach',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of sequences to return',
              default: 50,
            },
            offset: {
              type: 'number',
              description: 'Offset for pagination',
              default: 0,
            },
          },
        },
      },
      {
        name: 'get_account_prospects',
        description: 'Get prospects from a specific account',
        inputSchema: {
          type: 'object',
          properties: {
            accountId: {
              type: 'number',
              description: 'ID of the account',
            },
            accountName: {
              type: 'string',
              description: 'Name of the account (alternative to accountId)',
            },
            limit: {
              type: 'number',
              description: 'Number of prospects to return',
              default: 100,
            },
          },
        },
      },
      {
        name: 'search_accounts',
        description: 'Search for accounts by name or domain',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (name or domain)',
            },
            limit: {
              type: 'number',
              description: 'Number of accounts to return',
              default: 20,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'add_prospects_to_sequence',
        description: 'Add prospects to a sequence',
        inputSchema: {
          type: 'object',
          properties: {
            sequenceId: {
              type: 'number',
              description: 'ID of the sequence',
            },
            prospectIds: {
              type: 'array',
              items: {
                type: 'number',
              },
              description: 'Array of prospect IDs to add',
            },
            mailboxId: {
              type: 'number',
              description: 'ID of the mailbox to use for sending',
            },
          },
          required: ['sequenceId', 'prospectIds'],
        },
      },
      {
        name: 'create_sequence_step',
        description: 'Add a step to a sequence',
        inputSchema: {
          type: 'object',
          properties: {
            sequenceId: {
              type: 'number',
              description: 'ID of the sequence',
            },
            order: {
              type: 'number',
              description: 'Order of the step in the sequence',
            },
            interval: {
              type: 'number',
              description: 'Days to wait before this step',
              default: 1,
            },
            stepType: {
              type: 'string',
              description: 'Type of step: auto_email, manual_email, call, task, linkedin_send_message',
              enum: ['auto_email', 'manual_email', 'call', 'task', 'linkedin_send_message'],
            },
            subject: {
              type: 'string',
              description: 'Email subject (for email steps)',
            },
            body: {
              type: 'string',
              description: 'Content of the step',
            },
          },
          required: ['sequenceId', 'order', 'stepType'],
        },
      },
      {
        name: 'get_sequence_by_id',
        description: 'Get detailed sequence information by ID',
        inputSchema: {
          type: 'object',
          properties: {
            sequenceId: {
              type: 'number',
              description: 'ID of the sequence to retrieve',
            },
          },
          required: ['sequenceId'],
        },
      },
      {
        name: 'update_sequence',
        description: 'Update an existing sequence',
        inputSchema: {
          type: 'object',
          properties: {
            sequenceId: {
              type: 'number',
              description: 'ID of the sequence to update',
            },
            name: {
              type: 'string',
              description: 'New name for the sequence',
            },
            description: {
              type: 'string',
              description: 'New description for the sequence',
            },
            enabled: {
              type: 'boolean',
              description: 'Whether the sequence should be enabled',
            },
          },
          required: ['sequenceId'],
        },
      },
      {
        name: 'delete_sequence',
        description: 'Delete a sequence',
        inputSchema: {
          type: 'object',
          properties: {
            sequenceId: {
              type: 'number',
              description: 'ID of the sequence to delete',
            },
          },
          required: ['sequenceId'],
        },
      },
      {
        name: 'get_sequence_steps',
        description: 'Get all steps for a sequence',
        inputSchema: {
          type: 'object',
          properties: {
            sequenceId: {
              type: 'number',
              description: 'ID of the sequence',
            },
          },
          required: ['sequenceId'],
        },
      },
      {
        name: 'update_sequence_step',
        description: 'Update a sequence step',
        inputSchema: {
          type: 'object',
          properties: {
            stepId: {
              type: 'number',
              description: 'ID of the step to update',
            },
            subject: {
              type: 'string',
              description: 'Email subject (for email steps)',
            },
            body: {
              type: 'string',
              description: 'Content of the step',
            },
            interval: {
              type: 'number',
              description: 'Days to wait before this step',
            },
          },
          required: ['stepId'],
        },
      },
      {
        name: 'delete_sequence_step',
        description: 'Delete a sequence step',
        inputSchema: {
          type: 'object',
          properties: {
            stepId: {
              type: 'number',
              description: 'ID of the step to delete',
            },
          },
          required: ['stepId'],
        },
      },
      {
        name: 'create_prospect',
        description: 'Create a new prospect',
        inputSchema: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              description: 'First name of the prospect',
            },
            lastName: {
              type: 'string',
              description: 'Last name of the prospect',
            },
            email: {
              type: 'string',
              description: 'Email address of the prospect',
            },
            company: {
              type: 'string',
              description: 'Company name',
            },
            title: {
              type: 'string',
              description: 'Job title',
            },
          },
          required: ['firstName', 'lastName', 'email'],
        },
      },
      {
        name: 'update_prospect',
        description: 'Update prospect details',
        inputSchema: {
          type: 'object',
          properties: {
            prospectId: {
              type: 'number',
              description: 'ID of the prospect to update',
            },
            firstName: {
              type: 'string',
              description: 'First name of the prospect',
            },
            lastName: {
              type: 'string',
              description: 'Last name of the prospect',
            },
            email: {
              type: 'string',
              description: 'Email address of the prospect',
            },
            company: {
              type: 'string',
              description: 'Company name',
            },
            title: {
              type: 'string',
              description: 'Job title',
            },
          },
          required: ['prospectId'],
        },
      },
      {
        name: 'get_prospect_by_id',
        description: 'Get detailed prospect information by ID',
        inputSchema: {
          type: 'object',
          properties: {
            prospectId: {
              type: 'number',
              description: 'ID of the prospect to retrieve',
            },
          },
          required: ['prospectId'],
        },
      },
      {
        name: 'search_prospects',
        description: 'Search for prospects',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Email to search for',
            },
            company: {
              type: 'string',
              description: 'Company name to search for',
            },
            limit: {
              type: 'number',
              description: 'Number of prospects to return',
              default: 25,
            },
          },
        },
      },
      {
        name: 'get_templates',
        description: 'List email templates',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of templates to return',
              default: 50,
            },
          },
        },
      },
      {
        name: 'get_health_status',
        description: 'Get comprehensive MCP server health status and metrics',
        inputSchema: {
          type: 'object',
          properties: {
            detailed: {
              type: 'boolean',
              description: 'Include detailed component health information',
              default: true,
            },
          },
        },
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
              default: 24,
            },
          },
        },
      },
      {
        name: 'get_rate_limit_stats',
        description: 'Get API rate limiting statistics and utilization',
        inputSchema: {
          type: 'object',
          properties: {},
        },
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
              default: false,
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'create_sequence': {
        const client = ensureOutreachClient();
        const result = await client.createSequence(
          args.name as string,
          args.description as string,
          args.enabled as boolean,
          args.shareType as string
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'list_sequences': {
        const client = ensureOutreachClient();
        const result = await client.listSequences(
          args.limit as number,
          args.offset as number
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'get_account_prospects': {
        const client = ensureOutreachClient();
        const result = await client.getAccountProspects(
          args.accountId as number,
          args.accountName as string,
          args.limit as number
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'search_accounts': {
        const client = ensureOutreachClient();
        const result = await client.searchAccounts(
          args.query as string,
          args.limit as number
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'add_prospects_to_sequence': {
        const client = ensureOutreachClient();
        const result = await client.addProspectsToSequence(
          args.sequenceId as number,
          args.prospectIds as number[],
          args.mailboxId as number
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'create_sequence_step': {
        const client = ensureOutreachClient();
        const result = await client.createSequenceStep(
          args.sequenceId as number,
          args.order as number,
          args.interval as number,
          args.stepType as string,
          args.subject as string,
          args.body as string
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'get_sequence_by_id': {
        const client = ensureOutreachClient();
        const result = await client.getSequenceById(args.sequenceId as number);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'update_sequence': {
        const client = ensureOutreachClient();
        const result = await client.updateSequence(
          args.sequenceId as number,
          args.name as string,
          args.description as string,
          args.enabled as boolean
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'delete_sequence': {
        const client = ensureOutreachClient();
        const result = await client.deleteSequence(args.sequenceId as number);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'get_sequence_steps': {
        const client = ensureOutreachClient();
        const result = await client.getSequenceSteps(args.sequenceId as number);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'update_sequence_step': {
        const client = ensureOutreachClient();
        const result = await client.updateSequenceStep(
          args.stepId as number,
          args.subject as string,
          args.body as string,
          args.interval as number
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'delete_sequence_step': {
        const client = ensureOutreachClient();
        const result = await client.deleteSequenceStep(args.stepId as number);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'create_prospect': {
        const client = ensureOutreachClient();
        const result = await client.createProspect(
          args.firstName as string,
          args.lastName as string,
          args.email as string,
          args.company as string,
          args.title as string
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'update_prospect': {
        const client = ensureOutreachClient();
        const result = await client.updateProspect(
          args.prospectId as number,
          args.firstName as string,
          args.lastName as string,
          args.email as string,
          args.company as string,
          args.title as string
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'get_prospect_by_id': {
        const client = ensureOutreachClient();
        const result = await client.getProspectById(args.prospectId as number);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'search_prospects': {
        const client = ensureOutreachClient();
        const result = await client.searchProspects(
          args.email as string,
          args.company as string,
          args.limit as number
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'get_templates': {
        const client = ensureOutreachClient();
        const result = await client.getTemplates(args.limit as number);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'get_health_status': {
        const detailed = args.detailed !== false;
        if (detailed) {
          const healthReport = await healthMonitor.getHealthReport();
          return { content: [{ type: 'text', text: JSON.stringify(healthReport, null, 2) }] };
        } else {
          const quickStatus = healthMonitor.getQuickStatus();
          return { content: [{ type: 'text', text: JSON.stringify(quickStatus, null, 2) }] };
        }
      }

      case 'get_error_analytics': {
        const hours = args.hours as number || 24;
        const errorMetrics = (outreachClient as any).errorHandler?.getMetrics() || {
          message: 'Error analytics not available - enterprise features initializing'
        };
        const recentErrors = (outreachClient as any).errorHandler?.getRecentErrors(hours) || [];
        
        const analytics = {
          timeRange: `Last ${hours} hours`,
          metrics: errorMetrics,
          recentErrors: recentErrors.slice(0, 10), // Limit to 10 most recent
          summary: {
            totalErrors: recentErrors.length,
            criticalErrors: recentErrors.filter((e: any) => e.error.name === 'Critical').length,
            resolvedErrors: recentErrors.filter((e: any) => e.resolved).length
          }
        };
        
        return { content: [{ type: 'text', text: JSON.stringify(analytics, null, 2) }] };
      }

      case 'get_rate_limit_stats': {
        const rateLimitStats = (outreachClient as any).rateLimiter?.getStats() || {
          message: 'Rate limiting stats not available - enterprise features initializing'
        };
        
        return { content: [{ type: 'text', text: JSON.stringify(rateLimitStats, null, 2) }] };
      }

      case 'reset_rate_limiter': {
        if (args.confirm === true) {
          (outreachClient as any).rateLimiter?.reset();
          return { content: [{ type: 'text', text: JSON.stringify({ 
            success: true, 
            message: 'Rate limiter has been reset',
            timestamp: new Date().toISOString()
          }, null, 2) }] };
        } else {
          return { content: [{ type: 'text', text: JSON.stringify({ 
            success: false, 
            message: 'Rate limiter reset requires explicit confirmation. Set "confirm": true to proceed.'
          }, null, 2) }] };
        }
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
    }
  } catch (error: any) {
    console.error(`Error executing ${name}:`, error);
    
    // Handle Axios errors with more detail
    if (error.response) {
      const statusCode = error.response.status;
      const responseData = error.response.data;
      
      if (statusCode === 401) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'Authentication failed. Please check your API token.'
        );
      } else if (statusCode === 403) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'Access denied. Please check your API permissions.'
        );
      } else if (statusCode >= 400 && statusCode < 500) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Bad request: ${responseData?.errors?.[0]?.detail || error.message}`
        );
      } else {
        throw new McpError(
          ErrorCode.InternalError,
          `Server error: ${responseData?.errors?.[0]?.detail || error.message}`
        );
      }
    }
    
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing ${name}: ${error.message}`
    );
  }
});

async function main() {
  try {
    // Initialize MCP server first, then try to connect to Outreach
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Outreach server started on stdio');
    
    // Try to initialize Outreach client in background
    try {
      await initializeClient();
      console.error('✅ Outreach client initialized successfully');
    } catch (error) {
      console.error('⚠️  Outreach client initialization failed, server will still respond with error messages');
      console.error('Error:', (error as any).message);
      // Server continues to run but tools will return authentication errors
    }
    
  } catch (error) {
    console.error('Fatal MCP server error:', error);
    process.exit(1);
  }
}