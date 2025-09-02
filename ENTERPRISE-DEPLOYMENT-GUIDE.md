# Enterprise/Team Centralized Server Deployment Guide

**Use Case**: Deploy one MCP server for your entire team where you (admin) control the Outreach API credentials, but each user accesses their own data through Claude Desktop.

## 🎯 **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User 1        │    │                 │    │   Your Outreach │
│   Claude Desktop│◄───┤  Your Hosted    │◄───┤   Admin API     │
└─────────────────┘    │  MCP Server     │    │   Credentials   │
                       │                 │    └─────────────────┘
┌─────────────────┐    │  (Railway/VPS)  │    
│   User 2        │◄───┤  All 76 Tools   │    
│   Claude Desktop│    │  Port 3000      │    
└─────────────────┘    └─────────────────┘    

┌─────────────────┐           ▲
│   User N        │───────────┘
│   Claude Desktop│
└─────────────────┘
```

## 📋 **Prerequisites**

### **For You (Admin)**
- ✅ Outreach admin account with API access
- ✅ Hosting service (Railway, Heroku, VPS, etc.)
- ✅ Your Outreach OAuth credentials:
  - `OUTREACH_CLIENT_ID`
  - `OUTREACH_CLIENT_SECRET` 
  - `OUTREACH_REFRESH_TOKEN`

### **For Your Users**
- ✅ Claude Desktop installed
- ✅ Node.js installed (for proxy script)
- ❌ **NO Outreach API access needed**
- ❌ **NO individual credentials needed**

## 🚀 **Step 1: Deploy Your Centralized Server**

### **Option A: Railway Deployment (Recommended)**

1. **Prepare your project**:
```bash
# Clone/use your existing project
cd mcp-outreach-server

# Verify package.json has correct start script
grep "start.*simple-index.js" package.json
```

2. **Deploy to Railway**:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up

# Set your admin credentials (CRITICAL - these are YOUR credentials)
railway variables set OUTREACH_CLIENT_ID="your_admin_client_id"
railway variables set OUTREACH_CLIENT_SECRET="your_admin_client_secret"  
railway variables set OUTREACH_REFRESH_TOKEN="your_admin_refresh_token"
railway variables set PORT="3000"

# Get your deployment URL
railway status
# Note down your URL: https://your-app.up.railway.app
```

### **Option B: Manual VPS/Server Deployment**

1. **Server setup**:
```bash
# On your server
git clone your-repo
cd mcp-outreach-server
npm install

# Create production environment file
cat > .env << EOF
OUTREACH_CLIENT_ID=your_admin_client_id
OUTREACH_CLIENT_SECRET=your_admin_client_secret
OUTREACH_REFRESH_TOKEN=your_admin_refresh_token
PORT=3000
NODE_ENV=production
EOF

# Start with PM2 or similar
npm install -g pm2
pm2 start src/simple-index.js --name outreach-mcp
pm2 save
pm2 startup
```

2. **Configure reverse proxy** (Nginx example):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔧 **Step 2: Create User Proxy Script**

Create this file for your users to download:

**File**: `outreach-mcp-proxy.js`

```javascript
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
        const response = await axios.post(\`\${COMPANY_SERVER_URL}/mcp\`, {
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
        throw new Error(\`Company MCP server unavailable: \${error.message}\`);
      }
    });

    // Forward tool calls to company server  
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const response = await axios.post(\`\${COMPANY_SERVER_URL}/mcp\`, {
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
              error: \`Company server error: \${error.message}\`,
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
    console.error(\`MCP Outreach Proxy connected to: \${COMPANY_SERVER_URL}\`);
  }
}

// Start the proxy
const proxy = new OutreachMCPProxy();
proxy.run().catch(console.error);
```

## 📤 **Step 3: Test Your Deployment**

1. **Test server health**:
```bash
curl https://your-app.up.railway.app/health
# Should return: {"status":"healthy",...}
```

2. **Test MCP endpoint**:
```bash
curl -X POST https://your-app.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
# Should return tools list with 76 tools
```

3. **Test a tool call**:
```bash  
curl -X POST https://your-app.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "get_current_user", "arguments": {}}}'
# Should return your user info
```

## 👥 **Step 4: Distribute to Users**

### **Option A: NPM Package for Proxy**

1. **Create proxy package**:
```json
{
  "name": "@yourcompany/outreach-mcp-proxy",
  "version": "1.0.0",
  "bin": {
    "outreach-mcp-proxy": "./outreach-mcp-proxy.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.3",
    "axios": "^1.11.0"
  }
}
```

2. **Users install**:
```bash
npm install -g @yourcompany/outreach-mcp-proxy
```

### **Option B: Direct File Distribution**

1. **Package the proxy script**:
```bash
# Create distribution package
mkdir outreach-mcp-user-setup
cp outreach-mcp-proxy.js outreach-mcp-user-setup/
cat > outreach-mcp-user-setup/package.json << EOF
{
  "name": "outreach-mcp-proxy",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.3",
    "axios": "^1.11.0"
  }
}
EOF

# Zip it up for distribution
zip -r outreach-mcp-setup.zip outreach-mcp-user-setup/
```

2. **Send to users with instructions**

## 📋 **User Setup Instructions**

Give this to your users:

---

### **For Company Users - Outreach MCP Setup**

1. **Install Node.js** (if needed):
   - Download from: https://nodejs.org/en/download
   - Choose "LTS" version

2. **Install the proxy**:
   ```bash
   # Option A: If admin published NPM package
   npm install -g @yourcompany/outreach-mcp-proxy
   
   # Option B: If using provided files
   unzip outreach-mcp-setup.zip
   cd outreach-mcp-user-setup
   npm install
   ```

3. **Configure Claude Desktop**:
   
   Edit: `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%/Claude/claude_desktop_config.json` (Windows)
   
   ```json
   {
     "mcpServers": {
       "outreach": {
         "command": "outreach-mcp-proxy",
         "env": {
           "OUTREACH_SERVER_URL": "https://your-app.up.railway.app"
         }
       }
     }
   }
   ```
   
   *Note: Replace with your actual server URL*

4. **Restart Claude Desktop**

5. **Test**: Try "Show me my Outreach sequences"

---

## ⚖️ **Pros & Cons**

### ✅ **Advantages**
- **Zero credentials** for users
- **Centralized control** of API access
- **Shared rate limits** efficiently managed
- **Easy user onboarding**
- **Single point of updates**

### ⚠️ **Considerations**  
- **Single point of failure** (if your server goes down)
- **Your API limits** shared across all users
- **Hosting costs** on you
- **All data flows** through your server

## 🔒 **Security Notes**

- Your admin credentials never leave your server
- Users connect via HTTPS proxy
- Each user still sees only their own Outreach data (API handles this)
- Consider adding authentication if needed for sensitive environments

## 📊 **Monitoring & Maintenance**

1. **Monitor server health**: Set up alerts for downtime
2. **Watch API usage**: Monitor rate limit consumption  
3. **Update regularly**: Keep MCP server updated
4. **User support**: Provide help channel for connection issues

---

**This setup gives you full control while providing seamless access to all users with minimal technical setup required.**