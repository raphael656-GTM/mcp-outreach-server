#!/usr/bin/env node

// HTTP wrapper for MCP Outreach Server on Railway
import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { config } from 'dotenv';

config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const API_KEY = '55d6900ec2fbe3804ba6904ddfb82dc1879cbf0ecdca85b5cc16b8ce964c74c8';
// API key middleware
app.use((req, res, next) => {
  const openPaths = [
    '/health',
    '/callback',
    '/',
    '/auth',
    '/auth/validate',
    '/mcp-server',
    '/download/proxy'
  ];
  
  // Allow MCP OAuth endpoints
  if (req.path.startsWith('/api/organizations/') && req.path.includes('/mcp/')) {
    return next();
  }
  
  if (openPaths.includes(req.path)) {
    return next();
  }
  
  const key = req.headers['x-api-key'];
  if (!API_KEY || key === API_KEY) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
});

// MCP OAuth endpoints for Claude Desktop
app.get('/api/organizations/:orgId/mcp/start-auth/:serverId', (req, res) => {
  const { orgId, serverId } = req.params;
  const { redirect_url } = req.query;
  
  console.log('🔐 MCP OAuth start requested:', { orgId, serverId, redirect_url });
  
  // Return success - no additional auth needed since we use API key
  res.json({
    status: 'success',
    message: 'No additional authentication required',
    redirect_url: redirect_url || 'claude://claude.ai/new'
  });
});

app.post('/api/organizations/:orgId/mcp/complete-auth/:serverId', (req, res) => {
  const { orgId, serverId } = req.params;
  
  console.log('🔐 MCP OAuth complete requested:', { orgId, serverId });
  
  // Return success
  res.json({
    status: 'authenticated',
    server_id: serverId
  });
});

// Add Claude connector auth endpoints (legacy)
app.get('/auth', (req, res) => {
  res.json({
    name: "MCP Outreach Server",
    version: "1.0",
    auth_type: "none",
    capabilities: {
      tools: {}
    }
  });
});

app.post('/auth/validate', (req, res) => {
  res.json({ status: 'authenticated' });
});

// Store MCP server instance
let mcpProcess = null;
let isInitialized = false;

// Initialize MCP server
function initializeMCPServer() {
  if (mcpProcess) return mcpProcess;
  
  console.log('🚀 Starting MCP Outreach server...');
  console.log('📋 Environment check:');
  console.log('  - OUTREACH_CLIENT_ID:', process.env.OUTREACH_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('  - OUTREACH_CLIENT_SECRET:', process.env.OUTREACH_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('  - OUTREACH_REFRESH_TOKEN:', process.env.OUTREACH_REFRESH_TOKEN ? '✅ Set' : '❌ Missing');
  
  mcpProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      OUTREACH_CLIENT_ID: process.env.OUTREACH_CLIENT_ID,
      OUTREACH_CLIENT_SECRET: process.env.OUTREACH_CLIENT_SECRET,
      OUTREACH_REFRESH_TOKEN: process.env.OUTREACH_REFRESH_TOKEN,
      OUTREACH_REDIRECT_URI: process.env.OUTREACH_REDIRECT_URI,
      OUTREACH_API_BASE_URL: process.env.OUTREACH_API_BASE_URL || 'https://api.outreach.io/api/v2',
    }
  });

  mcpProcess.stdout.on('data', (data) => {
    console.log('📡 MCP Server:', data.toString().trim());
  });

  mcpProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    console.log('🔧 MCP Server:', output);
    
    if (output.includes('Outreach MCP server running') || output.includes('Enhanced Outreach Client initialized')) {
      isInitialized = true;
    }
  });

  mcpProcess.on('error', (error) => {
    console.error('❌ MCP Server error:', error);
  });

  mcpProcess.on('exit', (code) => {
    console.log(`🔄 MCP Server exited with code ${code}`);
    mcpProcess = null;
    isInitialized = false;
  });

  return mcpProcess;
}

// MCP Server communication endpoint
app.post('/mcp', async (req, res) => {
  try {
    if (!mcpProcess || !isInitialized) {
      const jsonRpcError = {
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32002,
          message: 'MCP server not initialized',
          data: { details: 'Server is starting up, please try again in a moment' }
        }
      };
      return res.status(503).json(jsonRpcError);
    }

    const request = req.body;
    console.log('📥 MCP Request:', JSON.stringify(request));

    // Send request to MCP server
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');

    // Wait for response (simplified - in production you'd want proper response matching)
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Request timeout')), 30000);
      
      const onData = (data) => {
        try {
          const lines = data.toString().split('\n').filter(line => line.trim());
          for (const line of lines) {
            const parsed = JSON.parse(line);
            if (parsed.id === request.id) {
              clearTimeout(timeout);
              mcpProcess.stdout.removeListener('data', onData);
              resolve(parsed);
              return;
            }
          }
        } catch (e) {
          // Ignore parsing errors for non-JSON output
        }
      };
      
      mcpProcess.stdout.on('data', onData);
    });

    res.json(response);
  } catch (error) {
    console.error('❌ MCP Request error:', error);
    const jsonRpcError = {
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: error.message,
        data: { type: 'mcp_error' }
      }
    };
    res.status(500).json(jsonRpcError);
  }
});

// Download endpoint for proxy script
app.get('/download/proxy', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Read the proxy script file
    const proxyPath = path.join(process.cwd(), 'outreach-proxy.cjs');
    
    // Check if file exists
    if (!fs.existsSync(proxyPath)) {
      return res.status(404).json({ error: 'Proxy script not found' });
    }
    
    // Read file content
    const proxyContent = fs.readFileSync(proxyPath, 'utf8');
    
    // Set appropriate headers for download
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Content-Disposition', 'attachment; filename="outreach-proxy.cjs"');
    
    // Send the file content
    res.send(proxyContent);
    
    console.log('📥 Proxy script downloaded');
  } catch (error) {
    console.error('❌ Error serving proxy script:', error);
    res.status(500).json({ error: 'Failed to serve proxy script' });
  }
});

// Tools endpoint - list available MCP tools
app.get('/tools', async (req, res) => {
  try {
    if (!mcpProcess || !isInitialized) {
      const jsonRpcError = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32002,
          message: 'MCP server not initialized',
          data: { details: 'Server is starting up, please try again in a moment' }
        }
      };
      return res.status(503).json(jsonRpcError);
    }

    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/list'
    };

    console.log('📥 Tools list request:', JSON.stringify(request));

    // Send request to MCP server
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');

    // Wait for response
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);
      
      const onData = (data) => {
        try {
          const lines = data.toString().split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.id === request.id) {
                clearTimeout(timeout);
                mcpProcess.stdout.removeListener('data', onData);
                resolve(parsed);
                return;
              }
            } catch (e) {
              // Skip non-JSON lines
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      };
      
      mcpProcess.stdout.on('data', onData);
    });

    res.json(response);
  } catch (error) {
    console.error('❌ Tools request error:', error);
    const jsonRpcError = {
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: error.message
      }
    };
    res.status(500).json(jsonRpcError);
  }
});

// Call tool endpoint
app.post('/tools/call', async (req, res) => {
  try {
    if (!mcpProcess || !isInitialized) {
      const jsonRpcError = {
        jsonrpc: '2.0',
        id: req.body?.name ? Date.now() : null,
        error: {
          code: -32002,
          message: 'MCP server not initialized',
          data: { details: 'Server is starting up, please try again in a moment' }
        }
      };
      return res.status(503).json(jsonRpcError);
    }

    const { name, arguments: args = {} } = req.body;
    
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name, arguments: args }
    };

    console.log('📥 Tool call request:', JSON.stringify(request));

    // Send request to MCP server
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');

    // Wait for response
    const response = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Request timeout')), 30000);
      
      const onData = (data) => {
        try {
          const lines = data.toString().split('\n').filter(line => line.trim());
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.id === request.id) {
                clearTimeout(timeout);
                mcpProcess.stdout.removeListener('data', onData);
                
                // Validate the response structure
                if (!parsed.jsonrpc) {
                  console.error('⚠️  Invalid response: missing jsonrpc field');
                  parsed.jsonrpc = '2.0';
                }
                
                // If it's an error response, make sure it's properly formatted
                if (parsed.error) {
                  if (typeof parsed.error === 'string') {
                    parsed.error = {
                      code: -32603,
                      message: parsed.error
                    };
                  }
                  if (!parsed.error.code) {
                    parsed.error.code = -32603;
                  }
                  if (!parsed.error.message) {
                    parsed.error.message = 'Unknown error';
                  }
                }
                
                resolve(parsed);
                return;
              }
            } catch (e) {
              console.error('⚠️  Failed to parse MCP response line:', line, e.message);
            }
          }
        } catch (e) {
          console.error('⚠️  Error processing MCP response data:', e.message);
        }
      };
      
      mcpProcess.stdout.on('data', onData);
    });

    // Check if response is already an error and return it directly
    if (response && response.error) {
      console.log('📥 MCP subprocess returned error:', JSON.stringify(response, null, 2));
      return res.json(response);
    }
    
    res.json(response);
  } catch (error) {
    console.error('❌ Tool call error:', error);
    
    // Create properly formatted JSON-RPC error
    const jsonRpcError = {
      jsonrpc: '2.0',
      id: req.body?.id || Date.now(),
      error: {
        code: -32603,
        message: error.message || 'Internal server error',
        data: { type: 'wrapper_error' }
      }
    };
    res.status(500).json(jsonRpcError);
  }
});

// OAuth callback route (same as before)
app.get('/callback', (req, res) => {
  const { code, state, error } = req.query;
  
  console.log('🔐 OAuth callback received:', { code, state, error });
  
  if (error) {
    return res.status(400).json({ 
      error: 'Authorization failed', 
      details: error 
    });
  }
  
  if (!code) {
    return res.status(400).json({ 
      error: 'No authorization code received' 
    });
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authorization Successful</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .success { color: #28a745; }
        .code { background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 20px; }
      </style>
    </head>
    <body>
      <h1 class="success">✅ Authorization Successful!</h1>
      <p>Your MCP Outreach server has been authorized!</p>
      <div class="code">
        <strong>Code:</strong> ${code}<br>
        <strong>State:</strong> ${state || 'N/A'}
      </div>
      <p>You can now use the MCP server tools. Check <a href="/tools">/tools</a> for available tools.</p>
    </body>
    </html>
  `);
});

// Health check with environment debug
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mcp_initialized: isInitialized,
    env_check: {
      OUTREACH_CLIENT_ID: process.env.OUTREACH_CLIENT_ID ? 'Set' : 'Missing',
      OUTREACH_CLIENT_SECRET: process.env.OUTREACH_CLIENT_SECRET ? 'Set' : 'Missing', 
      OUTREACH_REFRESH_TOKEN: process.env.OUTREACH_REFRESH_TOKEN ? 'Set' : 'Missing',
      OUTREACH_REDIRECT_URI: process.env.OUTREACH_REDIRECT_URI ? 'Set' : 'Missing'
    }
  });
});

// MCP Server endpoint for Claude Desktop remote connection
app.use('/mcp-server', (req, res) => {
  // Set MCP-specific headers
  res.setHeader('Content-Type', 'application/vnd.modelcontextprotocol+json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Return MCP server info
    return res.json({
      jsonrpc: '2.0',
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'mcp-outreach-server',
          version: '1.0.0'
        },
        capabilities: {
          tools: {}
        }
      }
    });
  }

  if (req.method === 'POST') {
    const request = req.body;
    console.log('📥 MCP Remote Request:', JSON.stringify(request));

    // Handle MCP requests directly
    try {
      if (request.method === 'initialize') {
        return res.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            },
            serverInfo: {
              name: 'mcp-outreach-server',
              version: '1.0.0'
            }
          }
        });
      }

      if (request.method === 'tools/list') {
        return res.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: [
              {
                name: 'health_check',
                description: 'Check MCP server status',
                inputSchema: {
                  type: 'object',
                  properties: {}
                }
              },
              {
                name: 'get_sequences',
                description: 'List all Outreach sequences',
                inputSchema: {
                  type: 'object',
                  properties: {}
                }
              },
              {
                name: 'find_sequence',
                description: 'Find sequences by name',
                inputSchema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' }
                  },
                  required: ['name']
                }
              }
            ]
          }
        });
      }

      if (request.method === 'tools/call') {
        const { name, arguments: args = {} } = request.params;
        
        if (name === 'health_check') {
          return res.json({
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: `MCP Outreach Server is running!\nStatus: ${isInitialized ? 'MCP Process Running' : 'HTTP-only mode'}\nTimestamp: ${new Date().toISOString()}`
              }]
            }
          });
        }

        // For other tools, return a message about MCP process status
        return res.json({
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [{
              type: 'text',
              text: `Tool "${name}" is available but the MCP subprocess is still initializing. The connection is working but Outreach API calls need the subprocess to be ready.`
            }]
          }
        });
      }

      // Unknown method
      return res.json({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      });

    } catch (error) {
      console.error('❌ MCP Request error:', error);
      return res.json({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: `Internal error: ${error.message}`
        }
      });
    }
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MCP Outreach Server',
    status: isInitialized ? 'ready' : 'initializing',
    endpoints: {
      mcp: '/mcp - POST - Send MCP requests',
      tools: '/tools - GET - List available tools',
      'tools/call': '/tools/call - POST - Call a tool',
      callback: '/callback - OAuth callback',
      health: '/health - Health check',
      'claude-tools': '/claude-tools.json - Custom connector JSON'
    }
  });
});

// Initialize MCP server on startup
initializeMCPServer();

app.listen(PORT, () => {
  console.log(`🌐 HTTP wrapper for MCP server running on port ${PORT}`);
  console.log(`🔗 Callback URL: ${process.env.RAILWAY_PUBLIC_DOMAIN ? 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN : 'http://localhost:' + PORT}/callback`);
});