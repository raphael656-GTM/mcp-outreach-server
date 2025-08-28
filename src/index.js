#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import EnhancedOutreachClient from './enhanced-outreach-client.js';
import { enhancedTools } from './enhanced-tools.js';
import { config } from 'dotenv';

config();

const server = new Server(
  {
    name: process.env.MCP_SERVER_NAME || 'outreach-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let outreachClient;

async function initializeClient() {
  try {
    outreachClient = new EnhancedOutreachClient();
    console.error('✅ Outreach MCP server initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Outreach client:', error.message);
    throw error;
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: enhancedTools
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  // Debug logging
  if (process.env.DEBUG) {
    console.error('🔧 Tool called:', name, JSON.stringify(args, null, 2));
  }

  if (!outreachClient) {
    throw new McpError(ErrorCode.InternalError, 'Outreach client not initialized');
  }

  // Health check endpoint with enhanced monitoring
  if (name === 'health_check') {
    try {
      const health = outreachClient.getHealth();
      await outreachClient.getMailboxes(); // Still test API connectivity
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...health,
            server: process.env.MCP_SERVER_NAME || 'outreach-mcp',
            version: '1.0.0'
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }
  }

  try {
    let result;

    switch (name) {
      // Prospect Management
      case 'create_prospect':
        result = await outreachClient.createProspect(args);
        break;

      case 'search_prospects':
        result = await outreachClient.searchProspects(args);
        break;

      case 'update_prospect':
        result = await outreachClient.updateProspect(args.prospectId, args.updates);
        break;

      case 'tag_prospect':
        result = await outreachClient.tagProspect(args.prospectId, args.tags);
        break;

      // Sequence Management
      case 'get_sequences':
        result = await outreachClient.getSequences(args.limit);
        break;

      case 'find_sequence':
        result = await outreachClient.findSequence(args.name);
        break;

      case 'create_sequence':
        result = await outreachClient.createSequence(args);
        break;

      case 'create_sequence_step':
        result = await outreachClient.createSequenceStep(args);
        break;

      case 'get_sequence_steps':
        result = await outreachClient.getSequenceSteps(args.sequenceId);
        break;

      // Template Management
      case 'create_sequence_template':
        result = await outreachClient.createSequenceTemplate(args);
        break;

      case 'get_sequence_templates':
        result = await outreachClient.getSequenceTemplates(args);
        break;

      case 'find_sequence_template':
        result = await outreachClient.findSequenceTemplate(args.name);
        break;

      case 'update_sequence_template':
        result = await outreachClient.updateSequenceTemplate(args.templateId, args.updates);
        break;

      case 'link_template_to_step':
        result = await outreachClient.linkTemplateToStep(args.sequenceStepId, args.templateId);
        break;

      case 'add_prospect_to_sequence':
        result = await outreachClient.addProspectToSequence(
          args.prospectId,
          args.sequenceId,
          args.options
        );
        break;

      case 'remove_prospect_from_sequence':
        result = await outreachClient.removeProspectFromSequence(args.sequenceStateId);
        break;

      // Account Management
      case 'create_account':
        result = await outreachClient.createAccount(args);
        break;

      case 'search_accounts':
        result = await outreachClient.searchAccounts(args);
        break;

      // Mailbox Management
      case 'get_mailboxes':
        result = await outreachClient.getMailboxes();
        break;

      // === HIGH-LEVEL WORKFLOW TOOLS ===
      case 'create_complete_email_sequence':
        result = await outreachClient.createCompleteEmailSequence(args);
        break;

      case 'create_and_enroll_prospect':
        result = await outreachClient.createAndEnrollProspect(args);
        break;

      case 'create_campaign_with_prospects':
        result = await outreachClient.createCampaignWithProspects(args);
        break;

      // === BULK OPERATIONS (New Enhanced Features) ===
      case 'bulk_create_prospects':
        result = await outreachClient.bulkCreateProspects(args.prospects, args.options);
        break;

      case 'bulk_create_sequences':
        result = await outreachClient.bulkCreateSequences(args.sequences);
        break;

      case 'bulk_create_templates':
        result = await outreachClient.bulkCreateTemplates(args.templates);
        break;

      case 'bulk_enroll_prospects':
        result = await outreachClient.bulkEnrollProspects(args.enrollments);
        break;

      // === PERFORMANCE MONITORING TOOLS ===
      case 'get_performance_metrics':
        result = outreachClient.getPerformanceMetrics();
        break;

      case 'get_health_status':
        result = outreachClient.getHealth();
        break;

      case 'generate_performance_report':
        result = outreachClient.generatePerformanceReport();
        break;

      // === CACHE MANAGEMENT TOOLS ===
      case 'clear_cache':
        result = {
          success: true,
          message: `Cache cleared for type: ${args.cacheType || 'api'}`,
          timestamp: new Date().toISOString()
        };
        // Call cache clearing method based on type
        if (args.cacheType === 'all') {
          outreachClient.cacheManager.clear();
        } else {
          outreachClient.cacheManager.clearByType(args.cacheType || 'api');
        }
        break;

      case 'get_cache_stats':
        result = outreachClient.cacheManager.getStats();
        break;

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Tool ${name} not found`);
    }

    // Debug logging for result
    if (process.env.DEBUG) {
      console.error('📊 Result:', JSON.stringify(result, null, 2));
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };

  } catch (error) {
    console.error(`❌ Error executing tool ${name}:`, error);
    
    // Handle specific error types
    if (error.response?.status === 401) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Authentication failed. Please check your Outreach credentials.'
      );
    } else if (error.response?.status === 403) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Access forbidden. Please check your Outreach permissions.'
      );
    } else if (error.response?.status === 429) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Rate limit exceeded. Please try again later.'
      );
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Error executing ${name}: ${error.message}`
    );
  }
});

async function main() {
  try {
    await initializeClient();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('🚀 Outreach MCP server running on stdio');
  } catch (error) {
    console.error('💥 Fatal error starting server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown with cleanup
process.on('SIGINT', async () => {
  console.error('🛑 Server shutting down...');
  if (outreachClient) {
    await outreachClient.shutdown();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('🛑 Server shutting down...');
  if (outreachClient) {
    await outreachClient.shutdown();
  }
  process.exit(0);
});

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});