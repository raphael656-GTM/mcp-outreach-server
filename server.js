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

// Store MCP server instance
let mcpProcess = null;
let isInitialized = false;

// Initialize MCP server
function initializeMCPServer() {
  if (mcpProcess) return mcpProcess;
  
  console.log('🚀 Starting MCP Outreach server...');
  
  mcpProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  mcpProcess.stdout.on('data', (data) => {
    console.log('📡 MCP Server:', data.toString().trim());
  });

  mcpProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    console.log('🔧 MCP Server:', output);
    
    if (output.includes('MCP Outreach server running')) {
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
      return res.status(503).json({ 
        error: 'MCP server not initialized',
        message: 'Server is starting up, please try again in a moment'
      });
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
    res.status(500).json({ 
      error: error.message,
      type: 'mcp_error'
    });
  }
});

// Tools endpoint - list available MCP tools
app.get('/tools', async (req, res) => {
  try {
    if (!mcpProcess || !isInitialized) {
      return res.status(503).json({ 
        error: 'MCP server not initialized',
        message: 'Server is starting up, please try again in a moment'
      });
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
    res.status(500).json({ error: error.message });
  }
});

// Call tool endpoint
app.post('/tools/call', async (req, res) => {
  try {
    if (!mcpProcess || !isInitialized) {
      return res.status(503).json({ 
        error: 'MCP server not initialized',
        message: 'Server is starting up, please try again in a moment'
      });
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
    console.error('❌ Tool call error:', error);
    res.status(500).json({ error: error.message });
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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mcp_initialized: isInitialized
  });
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
      health: '/health - Health check'
    }
  });
});

// Initialize MCP server on startup
initializeMCPServer();

app.listen(PORT, () => {
  console.log(`🌐 HTTP wrapper for MCP server running on port ${PORT}`);
  console.log(`🔗 Callback URL: ${process.env.RAILWAY_PUBLIC_DOMAIN ? 'https://' + process.env.RAILWAY_PUBLIC_DOMAIN : 'http://localhost:' + PORT}/callback`);
});