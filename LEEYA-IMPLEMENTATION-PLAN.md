# Leeya's MCP Outreach Implementation Plan

**Plan ID:** LEEYA-IMPL-001  
**Created:** September 1, 2025  
**Status:** Ready for Implementation  
**Priority:** HIGH - Union Validation Errors Resolved

## 🎯 Objective

Deploy the fixed MCP Outreach server to Leeya's Claude Desktop to resolve union validation errors and enable Outreach.io integration.

## 🔧 Technical Solution Summary

**Root Cause Identified**: Proxy script was using failing `/tools/call` endpoint instead of working `/mcp-server` endpoint.

**Solution Implemented**: Updated proxy script (`outreach-proxy-final-fix.cjs`) to use the stable HTTP endpoint with proper JSON-RPC 2.0 compliance.

## 📋 Step-by-Step Implementation Guide

### Phase 1: File Preparation (5 minutes)

1. **Download the Fixed Proxy Script**
   ```bash
   # Create MCP directory
   mkdir -p ~/mcp-files
   cd ~/mcp-files
   
   # Download the working proxy script
   curl -o outreach-proxy.cjs https://mcp-outreach-server-production.up.railway.app/download/proxy
   ```

2. **Verify Proxy Script**
   ```bash
   # Check file downloaded correctly
   ls -la outreach-proxy.cjs
   head -5 outreach-proxy.cjs
   ```

### Phase 2: Claude Desktop Configuration (10 minutes)

3. **Locate Claude Config File**
   ```bash
   # macOS location
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Or create if doesn't exist
   touch ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

4. **Add MCP Server Configuration**
   ```json
   {
     "mcpServers": {
       "outreach": {
         "command": "node",
         "args": ["/Users/leeyalazarovic/mcp-files/outreach-proxy.cjs"],
         "env": {
           "RAILWAY_URL": "https://mcp-outreach-server-production.up.railway.app"
         }
       }
     }
   }
   ```

   **⚠️ Important**: Replace `/Users/leeyalazarovic/mcp-files/` with your actual home directory path.

### Phase 3: Testing & Verification (10 minutes)

5. **Restart Claude Desktop**
   - Completely quit Claude Desktop application
   - Relaunch Claude Desktop
   - Look for MCP server initialization in bottom status bar

6. **Test Basic Connectivity**
   - Open new chat in Claude Desktop
   - Type: "What MCP tools are available?"
   - Should see Outreach tools listed including:
     - `create_complete_email_sequence`
     - `create_prospect`
     - `search_prospects`
     - `get_sequences`
     - `health_check`

7. **Test Health Check**
   - Type: "Run the health_check tool"
   - Should return: "MCP Outreach Server is running! Status: HTTP-only mode"

### Phase 4: Advanced Testing (15 minutes)

8. **Test Outreach Integration**
   ```
   # In Claude Desktop chat:
   "Create a test prospect with:
   - First Name: Test
   - Last Name: User  
   - Email: test@example.com
   - Company: Test Corp"
   ```

9. **Test Email Sequence Creation**
   ```
   # In Claude Desktop chat:
   "Create a simple email sequence called 'Welcome Series' with 2 emails:
   1. Welcome email - subject 'Welcome to our platform'
   2. Follow-up email - subject 'How are you finding our platform?'"
   ```

## 🛠 Technical Details

### Fixed Proxy Script Features
- ✅ **Endpoint**: Uses stable `/mcp-server` instead of failing `/tools/call`
- ✅ **JSON-RPC 2.0**: Strict compliance prevents union validation errors
- ✅ **ID Handling**: Never null/undefined IDs (generates timestamp if missing)
- ✅ **Error Handling**: Proper JSON-RPC error responses
- ✅ **Authentication**: No API key required for `/mcp-server` endpoint

### Server Status
- **URL**: `https://mcp-outreach-server-production.up.railway.app`
- **Mode**: HTTP-only (sufficient for proxy functionality)
- **Uptime**: Active and responding
- **Tools**: 6 tools available including complete email sequence creation

## 🚨 Troubleshooting Guide

### Issue: "MCP server failed to start"
**Solution**: Check file path in config matches actual location
```bash
# Verify path exists
ls -la /Users/leeyalazarovic/mcp-files/outreach-proxy.cjs
```

### Issue: "Union validation errors" 
**Solution**: These should be resolved with the fixed proxy. If they persist:
1. Restart Claude Desktop completely
2. Check config file syntax (use JSON validator)
3. Verify proxy script is the latest version

### Issue: "Tools not showing"
**Solution**: 
1. Check Claude Desktop bottom status bar for MCP initialization
2. Ensure `node` is in PATH: `which node`
3. Test proxy manually: `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node outreach-proxy.cjs`

### Issue: "Outreach API errors"
**Solution**: Server is in HTTP-only mode - this is expected. The tools will work but may have limited Outreach API functionality until the full MCP subprocess is initialized on the server side.

## 📊 Expected Results

After successful implementation:
- ✅ No more union validation errors
- ✅ MCP Outreach tools available in Claude Desktop
- ✅ Health check returns server status
- ✅ Basic prospect creation functionality
- ✅ Email sequence creation capabilities

## 🎉 Success Criteria

1. **No Error Messages**: Claude Desktop starts without union validation errors
2. **Tools Visible**: Outreach tools appear in Claude's available tools
3. **Health Check Pass**: `health_check` tool returns server status
4. **Basic Functionality**: Can create test prospects and sequences

## 📞 Support Information

If issues persist after following this plan:
- **Server Status**: Check `https://mcp-outreach-server-production.up.railway.app/health`
- **Proxy Download**: Available at `/download/proxy` endpoint
- **Technical Details**: All fixes implemented in `outreach-proxy-final-fix.cjs`

---

**Implementation Time**: ~30 minutes  
**Difficulty Level**: Beginner  
**Success Rate**: High (union validation issues resolved)