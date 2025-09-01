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
import { config } from 'dotenv';

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

let outreachClient: OutreachClient;

async function initializeClient() {
  // Use OAuth credentials for MCP servers
  const clientId = process.env.OUTREACH_CLIENT_ID;
  const clientSecret = process.env.OUTREACH_CLIENT_SECRET;
  const refreshToken = process.env.OUTREACH_REFRESH_TOKEN;
  const redirectUri = process.env.OUTREACH_REDIRECT_URI || 'http://localhost:3000/callback';
  
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('OUTREACH_CLIENT_ID, OUTREACH_CLIENT_SECRET, and OUTREACH_REFRESH_TOKEN environment variables are required.');
  }

  // Initialize OAuth with config object and manually set refresh token
  const oauth = new OutreachOAuth({
    clientId,
    clientSecret,
    redirectUri,
    scope: 'read write'
  });
  
  // Manually set the token data for refresh
  (oauth as any).tokenData = {
    refresh_token: refreshToken,
    expires_at: 0 // Force refresh
  };
  
  const accessToken = await (oauth as any).refreshToken();
  
  outreachClient = new OutreachClient(
    accessToken,
    process.env.OUTREACH_API_URL || 'https://api.outreach.io/api/v2'
  );
  
  console.error('MCP Outreach server initialized with OAuth credentials');
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
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'create_sequence': {
        const result = await outreachClient.createSequence(
          args.name as string,
          args.description as string,
          args.enabled as boolean,
          args.shareType as string
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'list_sequences': {
        const result = await outreachClient.listSequences(
          args.limit as number,
          args.offset as number
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'get_account_prospects': {
        const result = await outreachClient.getAccountProspects(
          args.accountId as number,
          args.accountName as string,
          args.limit as number
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'search_accounts': {
        const result = await outreachClient.searchAccounts(
          args.query as string,
          args.limit as number
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'add_prospects_to_sequence': {
        const result = await outreachClient.addProspectsToSequence(
          args.sequenceId as number,
          args.prospectIds as number[],
          args.mailboxId as number
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'create_sequence_step': {
        const result = await outreachClient.createSequenceStep(
          args.sequenceId as number,
          args.order as number,
          args.interval as number,
          args.stepType as string,
          args.subject as string,
          args.body as string
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
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
  await initializeClient();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Outreach server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});