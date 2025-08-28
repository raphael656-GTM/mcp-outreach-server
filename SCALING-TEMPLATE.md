# 🚀 MCP Remote Server Scaling Template

## REPLICATION BLUEPRINT
Use this template to convert ANY local MCP server into a remote-accessible server.

## 📋 STEP-BY-STEP REPLICATION

### **Phase 1: Analyze Existing MCP Server**
```bash
# 1. Identify your local MCP server files
find . -name "*mcp*" -o -name "*tools*" -o -name "*index.js"

# 2. Extract tool definitions
grep -r "name.*:" src/ | grep -v "description"

# 3. Find tool schemas
grep -A 20 "inputSchema" src/
```

### **Phase 2: Create HTTP Server** 
**File: `server.js`**
```javascript
#!/usr/bin/env node
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = 'your-generated-api-key';

app.use(cors());
app.use(express.json());

// API Key Middleware
app.use((req, res, next) => {
  const openPaths = ['/health', '/', '/auth'];
  if (openPaths.includes(req.path)) return next();
  
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: { code: -32001, message: 'Unauthorized: Invalid API key' }
    });
  }
  next();
});

// Tools endpoint
app.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args = {} } = req.body;
    
    // TODO: Add your tool execution logic here
    // Example: const result = await yourMCPServer.callTool(name, args);
    
    const response = {
      jsonrpc: '2.0',
      id: req.body.id || Date.now(),
      result: {
        content: [{ type: 'text', text: `Tool ${name} executed successfully` }]
      }
    };
    res.json(response);
  } catch (error) {
    const errorResponse = {
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: { code: -32603, message: error.message }
    };
    res.status(500).json(errorResponse);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🌐 [SERVICE_NAME] MCP Server running on port ${PORT}`);
});
```

### **Phase 3: Create Bridge Script**
**File: `[service]-proxy.cjs`**
```javascript
#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const SERVER_URL = 'https://your-app.railway.app';
const API_KEY = 'your-api-key';

// TODO: Replace with your actual tools from your MCP server
const TOOLS = [
  {
    name: 'example_tool',
    description: 'Example tool description',
    inputSchema: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: 'Example parameter' }
      },
      required: ['param1']
    }
  }
  // Add all your tools here...
];

let buffer = '';

function makeHttpRequest(data) {
  return new Promise((resolve, reject) => {
    const url = new URL(SERVER_URL + '/tools/call');
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'Content-Length': Buffer.byteLength(JSON.stringify(data))
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve({ error: 'Invalid JSON response', data: responseData });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function processRequest(request) {
  try {
    let response;

    if (request.method === 'initialize') {
      response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: '[SERVICE_NAME]-mcp-server',
            version: '1.0.0'
          }
        }
      };
    } else if (request.method === 'notifications/initialized') {
      return; // No response needed
    } else if (request.method === 'tools/list') {
      response = {
        jsonrpc: '2.0',
        id: request.id,
        result: { tools: TOOLS }
      };
    } else if (request.method === 'tools/call') {
      const { name, arguments: args = {} } = request.params;
      
      try {
        const toolResponse = await makeHttpRequest({ name, arguments: args });
        
        if (toolResponse.error) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32603, message: toolResponse.error }
          };
        } else {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: toolResponse.result || {
              content: [{ type: 'text', text: JSON.stringify(toolResponse, null, 2) }]
            }
          };
        }
      } catch (error) {
        response = {
          jsonrpc: '2.0',
          id: request.id,
          error: { code: -32603, message: `Tool call failed: ${error.message}` }
        };
      }
    } else {
      response = {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32601, message: `Method not found: ${request.method}` }
      };
    }

    if (response) {
      console.log(JSON.stringify(response));
    }

  } catch (error) {
    const errorResponse = {
      jsonrpc: '2.0',
      id: request.id || null,
      error: { code: -32603, message: `Proxy error: ${error.message}` }
    };
    console.log(JSON.stringify(errorResponse));
  }
}

// Handle stdin
process.stdin.on('data', async (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  
  for (const line of lines) {
    if (line.trim()) {
      try {
        const request = JSON.parse(line);
        await processRequest(request);
      } catch (error) {
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error' }
        }));
      }
    }
  }
});

process.stdin.on('end', () => process.exit(0));
console.error(`[Proxy] [SERVICE_NAME] MCP Proxy started, connecting to ${SERVER_URL}`);
```

### **Phase 4: Deploy to Railway**
```bash
# 1. Initialize Railway project
railway init

# 2. Set environment variables
railway variables set API_KEY=your-generated-api-key
railway variables set SERVICE_SPECIFIC_VAR=value

# 3. Deploy
railway up

# 4. Get deployment URL
railway domain
```

### **Phase 5: Package for Distribution**
```bash
# 1. Make proxy executable
chmod +x [service]-proxy.cjs

# 2. Test locally
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node [service]-proxy.cjs

# 3. Create README for users
cat > DISTRIBUTION-README.md << EOF
# [SERVICE_NAME] Remote MCP Server

## Quick Setup
1. Download: \`[service]-proxy.cjs\`
2. Add to Claude Desktop config:
   \`\`\`json
   {
     "mcpServers": {
       "[service]-remote": {
         "command": "node",
         "args": ["/path/to/[service]-proxy.cjs"]
       }
     }
   }
   \`\`\`
3. Restart Claude Desktop
4. Use [SERVICE_NAME] tools!

## Available Tools
- tool1: Description
- tool2: Description
EOF
```

## 🔧 CUSTOMIZATION CHECKLIST

### **Replace These Placeholders:**
- [ ] `[SERVICE_NAME]` - Your service name (e.g., "lemlist", "hubspot")
- [ ] `your-generated-api-key` - Generate a secure API key
- [ ] Tool definitions in `TOOLS` array
- [ ] HTTP server tool execution logic
- [ ] Environment variables for your service
- [ ] Railway app configuration

### **Tool Migration Process:**
1. **Extract from local MCP server**:
   ```bash
   # Find tool definitions
   grep -A 50 "name.*:" src/tools.js
   ```

2. **Convert to proxy format**:
   ```javascript
   {
     name: 'tool_name',
     description: 'Tool description', 
     inputSchema: { /* complete schema */ }
   }
   ```

3. **Test tool execution**:
   ```bash
   curl -X POST http://localhost:3000/tools/call \
     -H "Content-Type: application/json" \
     -H "x-api-key: your-key" \
     -d '{"name": "tool_name", "arguments": {}}'
   ```

## 📊 SUCCESS VALIDATION

### **Test Checklist:**
- [ ] Bridge responds to `initialize` method
- [ ] Bridge returns all tools in `tools/list`
- [ ] Bridge executes tools via `tools/call`
- [ ] No JSON-RPC validation errors in Claude Desktop
- [ ] All tools accessible from Claude Desktop
- [ ] HTTP server handles authentication correctly
- [ ] Railway deployment stable and accessible

### **Performance Benchmarks:**
- Response time: < 2 seconds for tool calls
- Bridge startup: < 1 second
- Memory usage: < 100MB
- Claude Desktop connection: Immediate

---

## 🎯 QUICK DEPLOYMENT COMMANDS

```bash
# Full deployment in one script
#!/bin/bash

# 1. Setup
SERVICE_NAME="your-service"
API_KEY=$(openssl rand -hex 32)

# 2. Create files from templates above
# 3. Deploy to Railway
railway login
railway init
railway variables set API_KEY=$API_KEY
railway up

# 4. Test
RAILWAY_URL=$(railway status --json | jq -r '.domains[0]')
echo '{"name":"health_check","arguments":{}}' | \
curl -X POST $RAILWAY_URL/tools/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d @-

echo "✅ $SERVICE_NAME MCP Server deployed successfully!"
echo "📦 Distribute: ${SERVICE_NAME}-proxy.cjs"
echo "🔗 Server URL: $RAILWAY_URL"
```

This template can create remote MCP servers for ANY service following the proven Outreach pattern! 🚀