# MCP Outreach Server - Working Architecture Documentation

**Last Updated**: September 1, 2025  
**Status**: ✅ FULLY OPERATIONAL  
**OAuth Authentication**: ✅ WORKING  

## 🎯 **CRITICAL SUCCESS NOTES**

### **Root Problem Identified & Solved**
- **Issue**: Over-engineered architecture with background processes causing `invalid_client` OAuth errors
- **Solution**: Adopted proven Lemlist MCP dual-mode pattern with per-request OAuth refresh
- **Result**: Complete elimination of authentication failures

### **Key Architecture Decision**
**ALWAYS use the simple implementation** (`src/simple-index.js`) - it follows the proven Lemlist pattern and eliminates all OAuth complexity that was causing failures.

## 🏗️ **Working Architecture Overview**

### **Dual-Mode Server Pattern**
```javascript
// Single file handles both deployment modes
if (process.env.PORT || process.env.RAILWAY_ENVIRONMENT) {
  await this.runHttpServer();  // Railway deployment
} else {
  await this.runStdioServer(); // Local Claude Desktop
}
```

### **Per-Request OAuth Flow**
```javascript
// Simple, stateless OAuth refresh per request
async getAccessToken(refreshToken) {
  const response = await axios.post('https://api.outreach.io/oauth/token', {
    client_id: process.env.OUTREACH_CLIENT_ID,
    client_secret: process.env.OUTREACH_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });
  return response.data.access_token;
}
```

## 📁 **File Structure (Working Implementation)**

```
/mcp-outreach-server/
├── src/
│   ├── simple-index.js           # ✅ MAIN ENTRY POINT - Working dual-mode server
│   ├── index.ts                  # ❌ LEGACY - Complex TypeScript version (deprecated)
│   └── index.js.backup           # ❌ LEGACY - Backup of old enhanced version
├── simple-outreach-proxy.js      # ✅ Working proxy for Railway connection
├── claude-config-simple.json     # ✅ Claude Desktop config for new implementation
├── package.json                  # ✅ Updated to use simple-index.js
├── Dockerfile                    # ✅ Updated to use simple-index.js
└── test/
    └── simple-server.test.js     # ✅ Basic tests for deployment
```

## ⚙️ **Configuration Files**

### **package.json (Critical Settings)**
```json
{
  "main": "src/simple-index.js",
  "scripts": {
    "start": "node src/simple-index.js",
    "dev": "node --watch src/simple-index.js"
  }
}
```

### **Dockerfile (Critical Settings)**
```dockerfile
# Start the simple OAuth server
CMD ["node", "src/simple-index.js"]
```

### **OAuth Credentials (Set as Environment Variables)**
```bash
OUTREACH_CLIENT_ID=your_client_id_here
OUTREACH_CLIENT_SECRET=your_client_secret_here
OUTREACH_REFRESH_TOKEN=your_refresh_token_here
```

## 🔧 **Claude Desktop Integration**

### **Local Connection (STDIO)**
```json
{
  "mcpServers": {
    "outreach-simple": {
      "command": "node",
      "args": ["/Users/raphaelberrebi/mcp-outreach-server/src/simple-index.js"],
      "cwd": "/Users/raphaelberrebi/mcp-outreach-server",
      "env": {
        "OUTREACH_CLIENT_ID": "your_client_id_here",
        "OUTREACH_CLIENT_SECRET": "your_client_secret_here",
        "OUTREACH_REFRESH_TOKEN": "your_refresh_token_here"
      }
    }
  }
}
```

### **Remote Connection (via Proxy)**
```json
{
  "mcpServers": {
    "outreach-simple-remote": {
      "command": "node",
      "args": ["/Users/raphaelberrebi/mcp-outreach-server/simple-outreach-proxy.js"],
      "env": {
        "RAILWAY_URL": "https://mcp-outreach-server-production.up.railway.app",
        "OUTREACH_REFRESH_TOKEN": "your_refresh_token_here"
      }
    }
  }
}
```

## 🧪 **Testing & Verification**

### **Local STDIO Mode Test**
```bash
OUTREACH_CLIENT_ID="your_id" OUTREACH_CLIENT_SECRET="your_secret" OUTREACH_REFRESH_TOKEN="your_token" node src/simple-index.js
# Should output: "Simple Outreach MCP server running on stdio"
```

### **Local HTTP Mode Test**
```bash
PORT=3000 OUTREACH_CLIENT_ID="your_id" OUTREACH_CLIENT_SECRET="your_secret" OUTREACH_REFRESH_TOKEN="your_token" node src/simple-index.js
# Test: curl http://localhost:3000/health
# Should return: {"status":"healthy","service":"outreach-mcp-server","version":"1.0.0"}
```

### **Railway Deployment Test**
```bash
# Health check
curl https://mcp-outreach-server-production.up.railway.app/health

# MCP endpoint test
curl -X POST https://mcp-outreach-server-production.up.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "X-Outreach-Refresh-Token: your_refresh_token_here" \
  -d '{"method": "tools/list"}'
```

### **Proxy Connection Test**
```bash
node test-simple-proxy.cjs
# Should show: "🎉 SIMPLE PROXY IS WORKING WITH RAILWAY!"
```

## 🚨 **Critical Deployment Steps**

### **If Railway Needs Redeploy**
1. Make small change to trigger redeploy: `echo "redeploy-$(date)" > .railway-deploy`
2. Commit and push: `git add . && git commit -m "trigger redeploy" && git push origin main`
3. Wait 60-90 seconds for Railway to rebuild
4. Verify: `curl https://mcp-outreach-server-production.up.railway.app/health`

### **If OAuth Tokens Expire**
1. **Get new authorization code**: Run `npm run setup` and follow OAuth flow
2. **Exchange for refresh token**: Use the exchange script or manual curl
3. **Update all configs**:
   - `.env` file
   - Claude Desktop config JSON
   - Railway environment variables (if using Railway CLI)

## 📊 **Available Tools**

The working implementation provides these MCP tools:

1. **`list_sequences`** - List all sequences in Outreach
2. **`create_sequence`** - Create a new sequence in Outreach  
3. **`search_prospects`** - Search for prospects by email/company

## 🔍 **Troubleshooting Guide**

### **If you see `invalid_client` errors:**
❌ **Don't** go back to the complex implementation  
✅ **Do** verify you're using `src/simple-index.js`  
✅ **Do** check OAuth credentials are current  
✅ **Do** ensure no background processes from old implementations  

### **If Railway returns wrong health format:**
❌ **Problem**: Old server still running  
✅ **Solution**: Check Dockerfile uses `CMD ["node", "src/simple-index.js"]`  
✅ **Solution**: Force redeploy as described above  

### **If proxy gets 401 Unauthorized:**
❌ **Problem**: Railway using old authentication method  
✅ **Solution**: Verify Railway deployment is using simple-index.js  
✅ **Solution**: Check proxy sends `X-Outreach-Refresh-Token` header  

## ✅ **Success Criteria**

### **Local Mode Working When:**
- No crash on startup
- Health endpoint returns correct format
- MCP protocol responds to initialize/tools/list
- OAuth refresh works without background processes

### **Railway Mode Working When:**
- Health endpoint: `{"status":"healthy","service":"outreach-mcp-server","version":"1.0.0"}`
- MCP endpoint accepts `X-Outreach-Refresh-Token` header
- Returns tools list without authentication errors

### **Proxy Mode Working When:**
- Connects to Railway with success message
- Forwards MCP requests correctly  
- Returns proper JSON-RPC responses
- No 401/authentication errors

## 📝 **Development Notes**

### **Why the Simple Implementation Works**
1. **No Background Processes**: Eliminates race conditions and credential conflicts
2. **Stateless OAuth**: Each request gets fresh token, no caching issues  
3. **Proven Pattern**: Based on successful Lemlist MCP architecture
4. **Single Responsibility**: One file, clear purpose, minimal complexity

### **Why the Complex Implementation Failed**
1. **Background OAuth Refresh**: Proactive token refresh with old credentials
2. **Subprocess Spawning**: HTTP wrapper spawning Node.js processes
3. **Multiple OAuth Managers**: Competing authentication systems
4. **Enterprise Features**: Rate limiting, error recovery adding complexity

## 🎯 **Key Learnings**

1. **Architecture Complexity is the Enemy**: Simple, proven patterns work better than over-engineered solutions
2. **Background Processes are Dangerous**: They can run with stale credentials and cause hard-to-debug issues
3. **Follow Working Examples**: Lemlist's dual-mode pattern was the key to success
4. **Test Early and Often**: Direct API testing revealed issues faster than complex debugging
5. **Docker Configuration Matters**: Railway uses Dockerfile CMD, not package.json start script

---

**🎉 This architecture is proven to work. If you encounter issues, refer back to this document and use the simple implementation as your foundation.**