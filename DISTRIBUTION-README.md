# 🚀 Outreach MCP Server - Remote Access

## What This Is
Access **24 powerful Outreach tools** directly from Claude Desktop without any OAuth setup, API keys, or configuration on your end. Everything runs through our secure Railway server.

## ⚡ Quick Setup (2 minutes)

### Step 1: Download the Bridge Script
Download the single file you need:
- **File**: `outreach-proxy.cjs`
- **Size**: ~15KB
- **Requirements**: Node.js (already installed if you use Claude Desktop)

### Step 2: Add to Claude Desktop
1. **Open your Claude Desktop config**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add this configuration**:
   ```json
   {
     "mcpServers": {
       "outreach-remote": {
         "command": "node",
         "args": ["/full/path/to/outreach-proxy.cjs"]
       }
     }
   }
   ```

3. **Replace `/full/path/to/` with the actual path** where you saved the file

### Step 3: Restart Claude Desktop
Quit Claude Desktop completely and restart it.

### Step 4: Test It!
Try these commands in Claude:
- *"List all available Outreach tools"*
- *"Check the health of the Outreach server"*
- *"Create a prospect named John Doe with email john@example.com"*

## 🛠️ Available Tools (24 Total)

### **🎯 High-Level Workflow Tools**
- **`create_complete_email_sequence`** - Create complete sequence with emails and timing in one call
- **`create_and_enroll_prospect`** - Create prospect and enroll in sequence (2-in-1)
- **`create_campaign_with_prospects`** - Full campaign setup: sequence + emails + prospects

### **⚡ Bulk Operations** 
- **`bulk_create_prospects`** - Create 25-50 prospects at once
- **`bulk_create_sequences`** - Create multiple sequences in batch
- **`bulk_create_templates`** - Create multiple email templates in batch
- **`bulk_enroll_prospects`** - Enroll multiple prospects in sequences

### **📊 Performance & Monitoring**
- **`get_performance_metrics`** - Detailed server performance metrics
- **`get_health_status`** - Component health status with alerts
- **`generate_performance_report`** - Performance report with recommendations
- **`clear_cache`** - Clear cached data for fresh API calls
- **`get_cache_stats`** - Cache performance statistics

### **🔧 Core Outreach Operations**
- **`create_prospect`** - Create individual prospects
- **`search_prospects`** - Search prospects by email, company, tags
- **`get_sequences`** - List all sequences with caching
- **`create_sequence`** - Create new sequences
- **`create_sequence_step`** - Add email/call/task steps to sequences
- **`create_sequence_template`** - Create email templates with variables
- **`link_template_to_step`** - Connect templates to sequence steps
- **`add_prospect_to_sequence`** - Enroll prospects in sequences
- **`get_mailboxes`** - List available sending mailboxes
- **`health_check`** - Server and API connection status

## 🔒 Security & Privacy

### **What We Handle For You:**
- ✅ **OAuth Authentication** - We manage all Outreach API credentials
- ✅ **API Key Management** - Secure server-side authentication  
- ✅ **Rate Limiting** - Built-in request throttling and caching
- ✅ **Error Handling** - Graceful failures with helpful messages

### **What We Don't See:**
- ❌ **Your Claude conversations** - Bridge only forwards tool requests
- ❌ **Your personal data** - No data storage or logging on our end
- ❌ **Other MCP servers** - Isolated to Outreach functionality only

### **Data Flow:**
```
Claude Desktop → Your Bridge Script → Our Railway Server → Outreach API
```

## 🚨 Troubleshooting

### **"MCP server not initialized" Error**
- **Cause**: Railway server is starting up (cold start)
- **Solution**: Wait 30 seconds and try again

### **"Connection refused" Error**  
- **Cause**: Network connectivity or server maintenance
- **Solution**: Check https://mcp-outreach-server-production.up.railway.app/health

### **"Tool not found" Error**
- **Cause**: Typo in tool name or outdated bridge script
- **Solution**: Use exact tool names from the list above

### **Claude Desktop Not Recognizing Server**
1. **Check file path** - Use absolute path in config
2. **Restart Claude Desktop** - Completely quit and reopen  
3. **Check Node.js** - Ensure `node` command works in terminal
4. **File permissions** - Make sure the file is executable: `chmod +x outreach-proxy.cjs`

## 📞 Support & Updates

### **Get Help:**
- **Health Check**: https://mcp-outreach-server-production.up.railway.app/health
- **Issues**: Report problems with specific error messages
- **Feature Requests**: Suggest new Outreach tools or workflows

### **Stay Updated:**
- **Version**: Current version embedded in bridge script
- **Updates**: New versions announced with enhanced tools and bug fixes
- **Backwards Compatible**: Old bridge scripts continue working

## 🌟 Example Usage

### **Create a Complete Email Sequence:**
```
"Using Outreach, create a complete email sequence called 'SaaS Demo Follow-up' with 3 emails:

1. Initial follow-up (day 0): Subject 'Thanks for the demo, {{first_name}}!'
2. Value add (day 3): Subject 'Helpful resources for {{account.name}}'  
3. Final touch (day 7): Subject 'Quick question about {{account.name}} priorities'

Each email should be friendly and personalized."
```

### **Bulk Create Prospects:**
```
"Using Outreach, create prospects for these contacts in bulk:
- John Smith, john@techcorp.com, TechCorp, CTO
- Sarah Johnson, sarah@innovate.co, Innovate Co, VP Marketing  
- Mike Davis, mike@startup.io, Startup Inc, Founder"
```

### **Campaign with Full Setup:**
```
"Using Outreach, create a complete campaign called 'Q4 Security Outreach' targeting security professionals with a 3-email sequence, and enroll the prospects I just mentioned."
```

## 🎉 What Makes This Special

- **🔥 No Setup Required** - Download one file, add one config entry
- **⚡ 24 Powerful Tools** - Everything from simple prospect creation to complex campaign automation
- **🚀 High-Performance** - Bulk operations, caching, and optimized workflows
- **🔒 Secure & Reliable** - Production-ready with proper error handling
- **📈 Scalable** - Handles individual requests or batch operations seamlessly

---

**Ready to supercharge your Outreach workflows with Claude?** 🚀

Download `outreach-proxy.cjs`, add it to your config, restart Claude Desktop, and start automating your sales outreach like never before!