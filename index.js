// src/index.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import OutreachClient from './outreach-client.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Outreach client
const outreachClient = new OutreachClient();

// Define available tools
const TOOLS = [
  {
    name: 'create_prospect',
    description: 'Create a new prospect in Outreach',
    inputSchema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', description: 'First name of the prospect' },
        lastName: { type: 'string', description: 'Last name of the prospect' },
        email: { type: 'string', description: 'Email address of the prospect' },
        company: { type: 'string', description: 'Company name' },
        title: { type: 'string', description: 'Job title' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags to assign' },
        customFields: { type: 'object', description: 'Custom field values' }
      },
      required: ['firstName', 'lastName', 'email']
    }
  },
  {
    name: 'search_prospects',
    description: 'Search for prospects based on criteria',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Email to search for' },
        company: { type: 'string', description: 'Company name to search for' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags to filter by' },
        limit: { type: 'number', description: 'Maximum number of results', default: 25 }
      }
    }
  },
  {
    name: 'tag_prospect',
    description: 'Add tags to an existing prospect',
    inputSchema: {
      type: 'object',
      properties: {
        prospectId: { type: 'string', description: 'ID of the prospect' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags to add' }
      },
      required: ['prospectId', 'tags']
    }
  },
  {
    name: 'update_prospect',
    description: 'Update prospect information',
    inputSchema: {
      type: 'object',
      properties: {
        prospectId: { type: 'string', description: 'ID of the prospect' },
        updates: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            company: { type: 'string' },
            title: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      required: ['prospectId', 'updates']
    }
  },
  {
    name: 'find_sequence',
    description: 'Find a sequence by name',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the sequence' }
      },
      required: ['name']
    }
  },
  {
    name: 'get_sequences',
    description: 'Get list of available sequences',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of sequences to return', default: 25 }
      }
    }
  },
  {
    name: 'add_prospect_to_sequence',
    description: 'Add a prospect to a sequence',
    inputSchema: {
      type: 'object',
      properties: {
        prospectId: { type: 'string', description: 'ID of the prospect' },
        sequenceId: { type: 'string', description: 'ID of the sequence' },
        mailboxId: { type: 'string', description: 'ID of the mailbox to use (optional)' }
      },
      required: ['prospectId', 'sequenceId']
    }
  },
  {
    name: 'create_account',
    description: 'Create a new account in Outreach',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Account name' },
        domain: { type: 'string', description: 'Company domain' },
        industry: { type: 'string', description: 'Industry' },
        size: { type: 'string', description: 'Company size' }
      },
      required: ['name']
    }
  },
  {
    name: 'search_accounts',
    description: 'Search for accounts',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Account name to search for' },
        domain: { type: 'string', description: 'Domain to search for' }
      }
    }
  },
  {
    name: 'get_mailboxes',
    description: 'Get available mailboxes for sending emails',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Create MCP server
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

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'create_prospect':
        result = await outreachClient.createProspect(args);
        break;

      case 'search_prospects':
        result = await outreachClient.searchProspects(args);
        break;

      case 'tag_prospect':
        result = await outreachClient.tagProspect(args.prospectId, args.tags);
        break;

      case 'update_prospect':
        result = await outreachClient.updateProspect(args.prospectId, args.updates);
        break;

      case 'find_sequence':
        result = await outreachClient.findSequence(args.name);
        break;

      case 'get_sequences':
        result = await outreachClient.getSequences(args.limit || 25);
        break;

      case 'add_prospect_to_sequence':
        result = await outreachClient.addProspectToSequence(
          args.prospectId,
          args.sequenceId,
          { mailboxId: args.mailboxId }
        );
        break;

      case 'create_account':
        result = await outreachClient.createAccount(args);
        break;

      case 'search_accounts':
        result = await outreachClient.searchAccounts(args);
        break;

      case 'get_mailboxes':
        result = await outreachClient.getMailboxes();
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Outreach Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
