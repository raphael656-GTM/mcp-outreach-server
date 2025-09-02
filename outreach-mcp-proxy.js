#!/usr/bin/env node

/**
 * MCP Outreach Proxy - Connects to centralized company server
 * Users run this locally to connect to your hosted MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const COMPANY_SERVER_URL = process.env.OUTREACH_SERVER_URL || 'https://your-app.up.railway.app';

class OutreachMCPProxy {
  constructor() {
    this.server = new Server({
      name: 'outreach-mcp-proxy',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.setupHandlers();
  }

  setupHandlers() {
    // Forward tools list request to company server
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const response = await axios.post(`${COMPANY_SERVER_URL}/mcp`, {
          method: 'tools/list'
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      } catch (error) {
        console.error('Failed to fetch tools from company server:', error.message);
        throw new Error(`Company MCP server unavailable: ${error.message}`);
      }
    });

    // Forward tool calls to company server  
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const response = await axios.post(`${COMPANY_SERVER_URL}/mcp`, {
          method: 'tools/call',
          params: request.params
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      } catch (error) {
        console.error('Failed to execute tool on company server:', error.message);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Company server error: ${error.message}`,
              details: 'Contact your admin if this persists'
            }, null, 2)
          }]
        };
      }
    });

    // Error handling
    this.server.onerror = (error) => {
      console.error('MCP Proxy error:', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`MCP Outreach Proxy connected to: ${COMPANY_SERVER_URL}`);
  }
}

// Start the proxy
const proxy = new OutreachMCPProxy();
proxy.run().catch(console.error);