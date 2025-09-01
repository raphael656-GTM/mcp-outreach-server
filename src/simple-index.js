#!/usr/bin/env node

/**
 * Simple Outreach MCP Server - Based on Successful Lemlist Pattern
 * Dual-mode: STDIO for local, HTTP for Railway deployment
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

class OutreachMCPServer {
  constructor() {
    this.server = new Server({
      name: 'outreach-mcp-server',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  // Create Outreach API client with access token
  createOutreachClient(accessToken) {
    const baseURL = process.env.OUTREACH_API_BASE_URL || 'https://api.outreach.io/api/v2';
    
    return axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      },
      timeout: 30000
    });
  }

  // Get OAuth access token using refresh token
  async getAccessToken(refreshToken) {
    try {
      const clientId = process.env.OUTREACH_CLIENT_ID;
      const clientSecret = process.env.OUTREACH_CLIENT_SECRET;
      
      if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('OAuth credentials missing: OUTREACH_CLIENT_ID, OUTREACH_CLIENT_SECRET, and refresh token required');
      }

      const response = await axios.post('https://api.outreach.io/oauth/token', {
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
      
      return response.data.access_token;
    } catch (error) {
      console.error('OAuth token refresh failed:', error.response?.data || error.message);
      throw new Error(`OAuth authentication failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async getToolsList() {
    return {
      tools: [
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
            },
          },
        },
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
            },
            required: ['name'],
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
        }
      ],
    };
  }

  async callTool(params, outreachClient) {
    const { name, arguments: args = {} } = params;

    try {
      switch (name) {
        case 'list_sequences': {
          const response = await outreachClient.get(`/sequences`, {
            params: {
              'page[size]': args.limit || 50
            }
          });
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                sequences: response.data.data || [],
                count: response.data.data?.length || 0
              }, null, 2)
            }]
          };
        }

        case 'create_sequence': {
          const response = await outreachClient.post('/sequences', {
            data: {
              type: 'sequence',
              attributes: {
                name: args.name,
                description: args.description || '',
                enabled: true,
                shareType: 'private'
              }
            }
          });
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                sequence: response.data.data
              }, null, 2)
            }]
          };
        }

        case 'search_prospects': {
          const params_obj = {};
          if (args.email) params_obj['filter[emails]'] = args.email;
          if (args.company) params_obj['filter[company]'] = args.company;
          params_obj['page[size]'] = args.limit || 25;

          const response = await outreachClient.get('/prospects', {
            params: params_obj
          });
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                prospects: response.data.data || [],
                count: response.data.data?.length || 0
              }, null, 2)
            }]
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            details: error.response?.data || 'Unknown error'
          }, null, 2)
        }]
      };
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return await this.getToolsList();
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // For STDIO mode, use environment variables
      const refreshToken = process.env.OUTREACH_REFRESH_TOKEN;
      if (!refreshToken) {
        throw new Error('OUTREACH_REFRESH_TOKEN environment variable is required');
      }

      const accessToken = await this.getAccessToken(refreshToken);
      const outreachClient = this.createOutreachClient(accessToken);
      
      return await this.callTool(request.params, outreachClient);
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('Server error:', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    // Dual-mode: HTTP for Railway, STDIO for local
    if (process.env.PORT || process.env.RAILWAY_ENVIRONMENT) {
      await this.runHttpServer();
    } else {
      await this.runStdioServer();
    }
  }

  async runStdioServer() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Simple Outreach MCP server running on stdio');
  }

  async runHttpServer() {
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(express.json());
    
    // CORS
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Outreach-Refresh-Token');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      next();
    });

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'outreach-mcp-server',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });

    // Main MCP endpoint
    app.post('/mcp', async (req, res) => {
      try {
        // Get Outreach refresh token from header
        const refreshToken = req.headers['x-outreach-refresh-token'] || process.env.OUTREACH_REFRESH_TOKEN;
        if (!refreshToken) {
          return res.status(400).json({ error: 'Outreach refresh token required' });
        }

        const { method, params } = req.body;
        
        try {
          if (method === 'tools/list') {
            const toolsResponse = await this.getToolsList();
            res.json(toolsResponse);
          } else if (method === 'tools/call') {
            const accessToken = await this.getAccessToken(refreshToken);
            const outreachClient = this.createOutreachClient(accessToken);
            const toolResponse = await this.callTool(params, outreachClient);
            res.json(toolResponse);
          } else {
            res.status(400).json({ error: 'Invalid method' });
          }
        } catch (toolError) {
          console.error('Tool execution error:', toolError);
          res.status(500).json({ 
            error: 'Tool execution failed',
            details: toolError.message 
          });
        }
      } catch (error) {
        console.error('MCP endpoint error:', error);
        res.status(500).json({ 
          error: 'Internal server error',
          details: error.message 
        });
      }
    });

    app.listen(port, '0.0.0.0', () => {
      console.log(`Simple Outreach MCP Server listening on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
    });
  }
}

// Start the server
const server = new OutreachMCPServer();
server.run().catch(console.error);