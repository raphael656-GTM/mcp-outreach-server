# Complete Outreach MCP Deployment Guide

**Last Updated**: September 2, 2025  
**Version**: 1.0.0 (76 tools covering all 33 Outreach API scopes)

This guide covers ALL deployment options for the Outreach MCP server.

---

## 🎯 Choose Your Deployment Method

### **Option 1: Individual Users (You have your own Outreach admin access)**
→ [Jump to Individual Setup](#option-1-individual-setup)

### **Option 2: Team/Enterprise (Admin deploys for non-admin users)**
→ [Jump to Team Setup](#option-2-teamenterprisesetup)

---

## Option 1: Individual Setup
*For users with their own Outreach API access*

### Prerequisites
- ✅ Node.js installed ([download here](https://nodejs.org))
- ✅ Claude Desktop installed
- ✅ Outreach account with API access

### Step 1: Install the Server
```bash
npm install -g @raphaelberrebi/mcp-outreach-server
```

### Step 2: Get Your Outreach Credentials

1. Log into Outreach as admin
2. Go to **Settings → Integrations → API Access**
3. Create a new OAuth application
4. Get these three values:
   - `OUTREACH_CLIENT_ID`
   - `OUTREACH_CLIENT_SECRET`
   - `OUTREACH_REFRESH_TOKEN`

[Detailed OAuth Setup Guide](https://api.outreach.io/api/v2/docs#authentication)

### Step 3: Configure Claude Desktop

Find your config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

Add this configuration:
```json
{
  "mcpServers": {
    "outreach": {
      "command": "mcp-outreach-server",
      "env": {
        "OUTREACH_CLIENT_ID": "your_client_id_here",
        "OUTREACH_CLIENT_SECRET": "your_client_secret_here",
        "OUTREACH_REFRESH_TOKEN": "your_refresh_token_here"
      }
    }
  }
}
```

### Step 4: Restart & Test
1. Restart Claude Desktop completely
2. Test: "Show me my Outreach sequences"

**✅ You now have access to all 76 Outreach tools!**

---

## Option 2: Team/Enterprise Setup
*For admins deploying to teams without individual API access*

### Part A: Admin Setup (One-time deployment)

#### Prerequisites
- ✅ Admin access to Outreach
- ✅ Hosting service (Railway recommended)
- ✅ Your OAuth credentials

#### Step 1: Clone the Repository
```bash
git clone https://github.com/raphael656-GTM/mcp-outreach-server.git
cd mcp-outreach-server
```

#### Step 2: Deploy to Railway

**Quick Deploy:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway link
railway up

# Set your admin credentials
railway variables set OUTREACH_CLIENT_ID="your_client_id_here"
railway variables set OUTREACH_CLIENT_SECRET="your_client_secret_here"
railway variables set OUTREACH_REFRESH_TOKEN="your_refresh_token_here"

# Get your server URL
railway status
# Note the URL (e.g., https://mcp-outreach-server-production.up.railway.app)
```

#### Step 3: Verify Deployment
```bash
# Test health
curl https://your-server-url.up.railway.app/health

# Test tools (should show 76)
curl -X POST https://your-server-url.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}' | grep -o '"name":' | wc -l
```

### Part B: User Setup (What admin does on each user's computer)

#### Prerequisites (Admin installs on user's computer)
- ✅ Node.js installed ([download here](https://nodejs.org))
- ✅ Claude Desktop installed
- ❌ NO Outreach API access needed for the user

#### Step 1: Admin Creates Proxy Files on User's Computer

**Admin runs these commands on user's computer:**
```bash
mkdir outreach-mcp-proxy
cd outreach-mcp-proxy
```

#### Step 2: Admin Creates package.json

**Admin creates a file named `package.json` on user's computer with:**
```json
{
  "name": "outreach-mcp-proxy",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.3",
    "axios": "^1.11.0"
  }
}
```

#### Step 3: Admin Creates Proxy Script

**Admin creates a file named `outreach-mcp-proxy.js` on user's computer with:**
```javascript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// REPLACE THIS WITH YOUR COMPANY'S SERVER URL
const COMPANY_SERVER_URL = process.env.OUTREACH_SERVER_URL || 'https://mcp-outreach-server-production.up.railway.app';

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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const response = await axios.post(`${COMPANY_SERVER_URL}/mcp`, {
          method: 'tools/list'
        }, {
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
      } catch (error) {
        console.error('Failed to fetch tools from company server:', error.message);
        throw new Error(`Company MCP server unavailable: ${error.message}`);
      }
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const response = await axios.post(`${COMPANY_SERVER_URL}/mcp`, {
          method: 'tools/call',
          params: request.params
        }, {
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' }
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

const proxy = new OutreachMCPProxy();
proxy.run().catch(console.error);
```

**IMPORTANT**: Admin replaces the `COMPANY_SERVER_URL` with their actual Railway URL!

#### Step 4: Admin Installs Dependencies on User's Computer
**Admin runs:**
```bash
npm install
```

#### Step 5: Admin Gets Current Path
**Admin runs on user's computer:**
```bash
pwd
# Admin copies this path for the next step
```

#### Step 6: Admin Configures Claude Desktop on User's Computer

**Admin finds the user's Claude config file:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Admin adds this configuration to the user's Claude config:**
```json
{
  "mcpServers": {
    "outreach": {
      "command": "node",
      "args": ["/PATH/FROM/STEP5/outreach-mcp-proxy.js"],
      "env": {
        "OUTREACH_SERVER_URL": "https://your-admin-server-url.up.railway.app"
      }
    }
  }
}
```

**Admin replaces:**
- `/PATH/FROM/STEP5/` with the actual path from Step 5
- `your-admin-server-url` with their Railway URL (`mcp-outreach-server-production.up.railway.app`)

#### Step 7: Admin Tests the Setup
1. Admin restarts Claude Desktop on user's computer
2. Admin tests: "Show me my Outreach sequences" in Claude

**✅ User now has access to all 76 Outreach tools through the admin's server!**

---

## 📋 **Admin Setup Summary**

### **What Admin Does Once (Server Setup):**
1. Deploy server to Railway with admin credentials
2. Get Railway server URL
3. Verify server has all 76 tools

### **What Admin Does on Each User's Computer:**
1. Install Node.js (if not installed)
2. Create proxy folder and files
3. Install dependencies (`npm install`)
4. Configure Claude Desktop with proxy settings
5. Test the connection

### **What User Gets:**
- Access to all 76 Outreach tools
- No Outreach credentials needed
- Works through admin's centralized server

**✅ You now have access to all 76 Outreach tools through your company server!**

---

## 🛠️ Available Tools (76 Total)

### Core Features
- **Accounts**: list, get, create, update
- **Prospects**: list, get, create, update, search
- **Sequences**: list, get, create, update, delete
- **Sequence Steps**: list, create, update, delete
- **Sequence States**: list, create (add prospects to sequences)
- **Tasks**: list, create, update
- **Templates**: list, get, create
- **Calls**: list, create
- **Opportunities**: list, get, create
- **Users**: list, get, get_current_user
- **Mailboxes**: list, get

### Additional Scopes
- Audit Logs, Batches, Batch Items
- Content Categories & Memberships
- Currency Types, Custom Objects
- Email Addresses, Phone Numbers
- Favorites, Job Roles, Personas
- Mailings, Mail Aliases
- Opportunity Stages & Roles
- Snippets, Stages
- Task Dispositions & Purposes
- And more!

---

## 🔧 Troubleshooting

### "npm: command not found"
Install Node.js from https://nodejs.org

### "Server not found" in Claude
- Restart Claude Desktop completely
- Check your config file path is correct
- Verify JSON syntax

### "Authentication failed"
- Check your OAuth credentials
- Ensure refresh token is current
- Verify API permissions

### "Company server unavailable" (Team setup)
- Contact your admin
- Check server URL is correct
- Verify network connectivity

---

## 📚 Resources

- **GitHub Repository**: https://github.com/raphael656-GTM/mcp-outreach-server
- **NPM Package**: https://www.npmjs.com/package/@raphaelberrebi/mcp-outreach-server
- **Outreach API Docs**: https://api.outreach.io/api/v2/docs
- **Railway Hosting**: https://railway.app

---

## 🆘 Support

- **Issues**: https://github.com/raphael656-GTM/mcp-outreach-server/issues
- **Documentation**: See repository for additional guides

---

**Current Production Server**: https://mcp-outreach-server-production.up.railway.app  
**Status**: ✅ Live with 76 tools