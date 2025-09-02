# Complete MCP Outreach Server Deployment Guide

**Version**: Enhanced with 76 Tools (All 33 Outreach API Scopes)  
**Updated**: September 1, 2025  
**Status**: ✅ PRODUCTION READY

## 🎯 **Overview**

This guide covers deployment of the enhanced MCP Outreach Server with comprehensive coverage of all Outreach API scopes (76 tools total). The server uses a proven dual-mode architecture that works both locally with Claude Desktop and remotely via Railway.

## 📋 **Prerequisites**

### **Required**
- Node.js 18+ installed
- Outreach account with API access
- Claude Desktop (for local mode)
- Railway account (for remote deployment)
- Git repository access

### **OAuth Credentials Needed**
```bash
OUTREACH_CLIENT_ID=huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug
OUTREACH_CLIENT_SECRET=jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6
OUTREACH_REFRESH_TOKEN=shCYvyYnQ6ON_RJLmOAbGhKlqElJNI7NNhM_EKY-c-s
```

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Claude Desktop │    │   Railway       │    │   Proxy         │
│    (Local)      │    │  (Remote HTTP)  │    │  (Connection)   │
│                 │    │                 │    │                 │
│ STDIO Mode      │    │ HTTP Mode       │    │ HTTP→STDIO      │
│ Direct Access   │◄───┤ Port 3000       │◄───┤ Bridge          │
│ All 76 Tools   │    │ All 76 Tools    │    │ All 76 Tools    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📦 **Step 1: Project Setup**

### **1.1 Clone and Install**
```bash
git clone <your-repo>
cd mcp-outreach-server
npm install
```

### **1.2 Verify Enhanced Version**
```bash
# Check that simple-index.js is the main file
grep "simple-index.js" package.json
# Should show: "main": "src/simple-index.js"

# Test syntax
node -c src/simple-index.js
# Should complete without errors
```

### **1.3 Environment Setup**
```bash
# Create .env file
cp .env.example .env

# Edit with your OAuth credentials
OUTREACH_CLIENT_ID=your_client_id
OUTREACH_CLIENT_SECRET=your_client_secret  
OUTREACH_REFRESH_TOKEN=your_refresh_token
```

## 🖥️ **Step 2: Local Deployment (STDIO Mode)**

### **2.1 Configure Claude Desktop**

Create or update your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "outreach-enhanced": {
      "command": "node",
      "args": ["/FULL/PATH/TO/mcp-outreach-server/src/simple-index.js"],
      "cwd": "/FULL/PATH/TO/mcp-outreach-server",
      "env": {
        "OUTREACH_CLIENT_ID": "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug",
        "OUTREACH_CLIENT_SECRET": "jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6",
        "OUTREACH_REFRESH_TOKEN": "shCYvyYnQ6ON_RJLmOAbGhKlqElJNI7NNhM_EKY-c-s"
      }
    }
  }
}
```

### **2.2 Test Local Deployment**
```bash
# Test server starts correctly
OUTREACH_CLIENT_ID="..." OUTREACH_CLIENT_SECRET="..." OUTREACH_REFRESH_TOKEN="..." node src/simple-index.js

# Should output:
# Simple Outreach MCP server running on stdio
```

### **2.3 Restart Claude Desktop**
- Completely quit Claude Desktop
- Restart the application
- Verify the server appears in the MCP section
- Test with a simple command: "List my Outreach sequences"

## ☁️ **Step 3: Remote Deployment (Railway)**

### **3.1 Prepare for Railway**

Verify these files are configured correctly:

**package.json**:
```json
{
  "name": "mcp-outreach-server",
  "version": "1.0.0",
  "main": "src/simple-index.js",
  "scripts": {
    "start": "node src/simple-index.js",
    "dev": "node --watch src/simple-index.js"
  }
}
```

**Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/simple-index.js"]
```

### **3.2 Deploy to Railway**

**Option A: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up

# Set environment variables
railway variables set OUTREACH_CLIENT_ID="huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug"
railway variables set OUTREACH_CLIENT_SECRET="jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6"
railway variables set OUTREACH_REFRESH_TOKEN="shCYvyYnQ6ON_RJLmOAbGhKlqElJNI7NNhM_EKY-c-s"
```

**Option B: GitHub Integration**
1. Push code to GitHub
2. Connect Railway to your GitHub repo  
3. Set environment variables in Railway dashboard
4. Deploy automatically on push

### **3.3 Test Railway Deployment**
```bash
# Get your Railway URL
railway status

# Test health endpoint
curl https://your-app.up.railway.app/health

# Test tools list
curl -X POST https://your-app.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-Outreach-Refresh-Token: your_refresh_token" \
  -d '{"method": "tools/list"}'

# Should return JSON with 76 tools
```

## 🔄 **Step 4: Proxy Setup (Remote Connection)**

### **4.1 Configure Proxy for Claude Desktop**

Add this configuration alongside your local config:

```json
{
  "mcpServers": {
    "outreach-enhanced": {
      "command": "node",
      "args": ["/FULL/PATH/TO/mcp-outreach-server/src/simple-index.js"],
      "cwd": "/FULL/PATH/TO/mcp-outreach-server",
      "env": {
        "OUTREACH_CLIENT_ID": "huKx35FSVCR1RXClVCLsorRq.Ljk9ZyPyfo2qqW~xeug",
        "OUTREACH_CLIENT_SECRET": "jei[VGvlj9l&]]qO*.Zlh#v!V=pGRFytVq|U{I-tXa6",
        "OUTREACH_REFRESH_TOKEN": "shCYvyYnQ6ON_RJLmOAbGhKlqElJNI7NNhM_EKY-c-s"
      }
    },
    "outreach-enhanced-remote": {
      "command": "node",
      "args": ["/FULL/PATH/TO/mcp-outreach-server/simple-outreach-proxy.js"],
      "env": {
        "RAILWAY_URL": "https://your-app.up.railway.app",
        "OUTREACH_REFRESH_TOKEN": "shCYvyYnQ6ON_RJLmOAbGhKlqElJNI7NNhM_EKY-c-s"
      }
    }
  }
}
```

### **4.2 Test Proxy Connection**
```bash
# Test proxy directly
RAILWAY_URL="https://your-app.up.railway.app" OUTREACH_REFRESH_TOKEN="..." node simple-outreach-proxy.js

# Should connect successfully to Railway
```

## ✅ **Step 5: Verification & Testing**

### **5.1 Test All Tool Categories**

In Claude Desktop, test each major category:

```
# Accounts
"List accounts in Outreach"
"Create a new account named 'Test Company' with domain 'test.com'"

# Prospects  
"Search for prospects with email containing 'john@test.com'"
"Create a prospect named 'John Doe' with email 'john@test.com'"

# Sequences
"List all sequences"
"Create a new sequence called 'Enhanced Test Sequence'"

# Templates
"List email templates"
"Get template with ID 123"

# Users & System
"Get current user information"
"List all users"

# Tasks & Activities
"List recent tasks"
"List calls for prospect ID 456"
```

### **5.2 Verify Tool Count**

```bash
# Should return 76 tools
curl -s -X POST https://your-app.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-Outreach-Refresh-Token: your_token" \
  -d '{"method": "tools/list"}' | grep -o '"name":' | wc -l
```

### **5.3 Performance Check**

```bash
# Health check should be fast
time curl https://your-app.up.railway.app/health

# Tool execution should complete in < 5 seconds
time curl -X POST https://your-app.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-Outreach-Refresh-Token: your_token" \
  -d '{"method": "tools/call", "params": {"name": "list_sequences", "arguments": {"limit": 10}}}'
```

## 🚨 **Troubleshooting**

### **Common Issues**

**Problem**: "Unknown tool" errors
**Solution**: Verify you're using the enhanced `src/simple-index.js` (not the old version)

**Problem**: OAuth authentication failures  
**Solution**: Check refresh token is current and has proper permissions

**Problem**: Railway deployment fails
**Solution**: Ensure Dockerfile uses `CMD ["node", "src/simple-index.js"]`

**Problem**: Claude Desktop can't find server
**Solution**: Use absolute paths in configuration, restart Claude Desktop

**Problem**: Proxy connection fails
**Solution**: Verify Railway URL is correct and server is running

### **Debug Commands**

```bash
# Check server file being used
grep -n "Simple Outreach MCP server" src/simple-index.js

# Test OAuth credentials
OUTREACH_CLIENT_ID="..." OUTREACH_CLIENT_SECRET="..." OUTREACH_REFRESH_TOKEN="..." node -e "
const axios = require('axios');
axios.post('https://api.outreach.io/oauth/token', {
  client_id: process.env.OUTREACH_CLIENT_ID,
  client_secret: process.env.OUTREACH_CLIENT_SECRET, 
  refresh_token: process.env.OUTREACH_REFRESH_TOKEN,
  grant_type: 'refresh_token'
}).then(r => console.log('OAuth OK')).catch(e => console.error('OAuth Failed:', e.response?.data));
"

# Check Railway logs
railway logs
```

## 📊 **Available Tools Summary**

The enhanced server provides **76 tools** covering all 33 Outreach API scopes:

- **Accounts**: list, get, create, update
- **Prospects**: list, get, create, update, search  
- **Sequences**: list, get, create, update, delete
- **Sequence Steps**: list, create, update, delete
- **Sequence States**: list, create (add prospects to sequences)
- **Templates**: list, get, create
- **Tasks**: list, create, update
- **Calls**: list, create
- **Opportunities**: list, get, create
- **Users**: list, get, get_current_user
- **Mailboxes**: list, get
- **And 21 additional scopes** with full CRUD operations

## 🎉 **Success Criteria**

Your deployment is successful when:

✅ **Local Mode**: Claude Desktop shows 76 available tools  
✅ **Remote Mode**: Railway health check returns `{"status":"healthy"}`  
✅ **Proxy Mode**: Can switch between local and remote seamlessly  
✅ **Functionality**: All major Outreach operations work (list, create, update)  
✅ **Performance**: Tool calls complete in < 5 seconds  
✅ **Reliability**: No authentication failures or timeouts

---

**🔧 Need Help?** Check CLAUDE.md for detailed troubleshooting or refer to the specific error patterns documented there.