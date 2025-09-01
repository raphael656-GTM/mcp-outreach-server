# 📚 Complete Guide: Outreach MCP Server - Seamless Sales Outreach via Claude

## 🎯 Mission
**Make it seamless for sales reps to manage outreach tasks directly via Claude.** No switching between applications, no complex interfaces - just natural conversation with Claude to handle all Outreach operations.

## 🏢 Current Status
- ✅ **Phase 3 Enterprise** deployment ready with 29 tools
- 🔧 **Local Server Issue**: OAuth 401 errors - invalid_client authentication failure
- 🔧 **Remote Proxy Issue**: Zod validation errors in proxy script responses  
- 🎯 **Current Task**: Fix both authentication and proxy validation issues
- 👥 **User Deployment**: Blocked until proxy validation errors resolved

## 🚀 Phase 3 Enterprise Features (Ready for Multi-User Deployment)

### **29 Total Tools Available:**
- **12 Core Outreach Tools**: Sequences, prospects, accounts, mailboxes
- **9 Advanced Management**: Full CRUD operations, templates, bulk actions  
- **4 Enterprise Monitoring**: Health status, error analytics, rate limiting
- **4 Performance Features**: Auto-retry, error recovery, health monitoring

### **Enterprise-Grade Infrastructure:**
- ✅ **Rate Limiting** with exponential backoff and jitter
- ✅ **Enhanced Error Handling** with automatic recovery strategies
- ✅ **Health Monitoring** with component-level status tracking
- ✅ **Performance Optimization** for high-volume operations

### **Multi-User Ready:**
- ✅ **Scalable Architecture** supporting 7+ concurrent users
- ✅ **Individual Authentication** via personal OAuth tokens
- ✅ **Centralized Deployment** on Railway cloud infrastructure
- ✅ **Monitoring & Analytics** for deployment health across users

---

## 🚨 Current Issues Blocking Deployment

### **Issue 1: Local MCP Server (Admin) - OAuth Authentication Failure**
```
❌ OAuth token refresh failed: HTTP 401: "invalid_client" 
❌ Client authentication failed due to unknown client
```
**Root Cause**: Outreach OAuth application credentials invalid/expired  
**Impact**: Admin cannot use direct server connection  
**Status**: ❌ NEEDS FIX - OAuth app may need regeneration

### **Issue 2: Remote Proxy Server (Users) - Zod Validation Errors**
```
❌ Zod validation error: "invalid_union", "method" Required, "error" unrecognized keys
```
**Root Cause**: Proxy script sending malformed MCP protocol responses  
**Impact**: Users cannot use proxy scripts  
**Status**: ❌ NEEDS FIX - Proxy response format incorrect

### **Immediate Action Plan:**
1. **Fix OAuth**: Regenerate Outreach OAuth application credentials
2. **Fix Proxy**: Debug and fix JSON-RPC 2.0 response formatting in proxy scripts
3. **Test Both**: Verify admin direct server and user proxy scripts work
4. **Deploy**: Roll out to 7 users once both issues resolved

---

## 🚀 Method 1: Phase 3 Enterprise Remote (Current - 29 Tools)
**Best for**: Sales teams who want immediate access with centralized admin control

### What You Get
- ✅ **No OAuth setup required** - Admin manages authentication on Railway
- ✅ **29 enterprise tools** ready to use (12 core + 9 advanced + 8 enterprise)
- ✅ **Zero maintenance** - Updates handled automatically by admin
- ✅ **Enterprise monitoring** - Health checks, error analytics, rate limiting
- ✅ **Shared access** - All users leverage admin's Outreach permissions

### Setup Steps

1. **Download the Phase 3 Enterprise Script**
   ```bash
   # Download the Phase 3 enterprise proxy script
   curl -O https://raw.githubusercontent.com/raphael656-GTM/mcp-outreach-server/main/outreach-proxy-phase3.cjs
   chmod +x outreach-proxy-phase3.cjs
   ```
   
   **If experiencing validation errors, use debug version:**
   ```bash
   curl -O https://raw.githubusercontent.com/raphael656-GTM/mcp-outreach-server/main/outreach-proxy-debug.cjs
   chmod +x outreach-proxy-debug.cjs
   ```

2. **Add to Claude Desktop Configuration**
   
   Open your Claude config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

   Add this configuration:
   ```json
   {
     "mcpServers": {
       "outreach-phase3-enterprise": {
         "command": "node",
         "args": ["/absolute/path/to/outreach-proxy-phase3.cjs"],
         "env": {
           "RAILWAY_URL": "https://mcp-outreach-server-production.up.railway.app"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**
   - Completely quit Claude Desktop
   - Relaunch the application

4. **Test the Connection**
   Try these commands in Claude:
   - "List all available Outreach tools"
   - "Check the health of the Outreach server"

---

## 🏠 Method 2: Local Installation with OAuth (Recommended for Teams)
**Best for**: Teams who want full control with their own Outreach OAuth app

### Prerequisites
- Node.js v18 or higher
- Admin access to Outreach account
- Ability to create OAuth applications in Outreach

### Step 1: Create Outreach OAuth Application

1. **Log into Outreach as Admin**
   - Navigate to: Settings → Integrations → API Access
   - Click "Create New App" or "Register Application"

2. **Configure OAuth App**
   ```
   Application Name: MCP Integration
   Redirect URI: http://localhost:3000/callback
   Application Type: Private/Internal
   ```

3. **Select Required Scopes**
   - `accounts.all` - Account management
   - `prospects.all` - Prospect management
   - `sequences.all` - Sequence operations
   - `sequenceStates.all` - Sequence enrollment
   - `mailboxes.all` - Mailbox access
   - `tags.all` - Tag management
   - `users.all` - User information

4. **Save Credentials**
   Copy your **Client ID** and **Client Secret**

### Step 2: Install MCP Server Locally

1. **Clone the Repository**
   ```bash
   git clone https://github.com/raphael656-GTM/mcp-outreach-server.git
   cd mcp-outreach-server
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   OUTREACH_CLIENT_ID=your_client_id_here
   OUTREACH_CLIENT_SECRET=your_client_secret_here
   OUTREACH_REDIRECT_URI=http://localhost:3000/callback
   OUTREACH_API_BASE_URL=https://api.outreach.io/api/v2
   ```

4. **Authenticate with Outreach**
   ```bash
   npm run setup
   ```
   This will:
   - Open your browser for OAuth authorization
   - Save refresh token to `.env`
   - Confirm successful authentication

5. **Build the Server**
   ```bash
   npm run build
   ```

### Step 3: Configure Claude Desktop

Edit your Claude config file and add:

```json
{
  "mcpServers": {
    "outreach-local": {
      "command": "node",
      "args": ["/path/to/mcp-outreach-server/dist/index.js"],
      "env": {
        "OUTREACH_CLIENT_ID": "your_oauth_client_id",
        "OUTREACH_CLIENT_SECRET": "your_oauth_client_secret",
        "OUTREACH_REDIRECT_URI": "http://localhost:3000/callback",
        "OUTREACH_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

### Step 4: Restart Claude and Test

1. Restart Claude Desktop
2. Test with: "List my Outreach sequences"

---

## 🏢 Multi-User Deployment Strategy (7+ Users)

### **Deployment Architecture:**
```
Admin (You) → Claude Desktop → Direct MCP Server → Outreach API (Your OAuth)
     ↕
7 Sales Reps → Claude Desktop → Proxy Scripts → Railway Server → Outreach API (Your OAuth)
```

### **Two-Tier Setup:**
1. **Admin Setup (You)**: Direct connection to local/Railway MCP server without proxy
2. **User Setup (7 Reps)**: Proxy scripts connecting to your Railway deployment  
3. **Centralized Authentication**: Your OAuth tokens power both admin and user access
4. **Enterprise Monitoring**: You monitor all activity through direct server access

### **User Onboarding Process (Zero OAuth Setup):**
```bash
# Step 1: User downloads their proxy script (no API keys needed)
curl -O https://raw.githubusercontent.com/raphael656-GTM/mcp-outreach-server/main/outreach-proxy-phase3.cjs
chmod +x outreach-proxy-phase3.cjs

# Step 2: Configure Claude Desktop with unique server name
{
  "mcpServers": {
    "outreach-[USERNAME]": {
      "command": "node",
      "args": ["/full/path/to/outreach-proxy-phase3.cjs"],
      "env": {
        "RAILWAY_URL": "https://mcp-outreach-server-production.up.railway.app"
      }
    }
  }
}

# Step 3: Test with health check (uses admin's OAuth automatically)
"Check my Outreach server health status"
```

### **Benefits of Centralized OAuth:**
- ✅ **Zero Setup for Users**: No API keys or OAuth flows required
- ✅ **Admin Control**: You manage all authentication centrally  
- ✅ **Consistent Access**: All users get same permissions and data access
- ✅ **Easy Maintenance**: Token refresh handled centrally on Railway

### **Monitoring Dashboard (Coming Next):**
- 📊 **User Activity**: Track tool usage per user
- 🚨 **Error Alerts**: Monitor validation errors across deployments  
- ⚡ **Performance Metrics**: Response times and success rates
- 🔄 **Health Status**: Real-time status of all user connections

### **Current Blocker**: Claude Desktop validation errors need debugging before scaling

---

## 👑 Admin Setup (Direct MCP Server Access)

**For**: Platform admin (you) who manages OAuth and monitors all users

### **Admin Architecture:**
```
You → Claude Desktop → dist/index.js (Direct) → Outreach API (Your OAuth)
```

### **Admin Setup Steps:**

1. **Local Development Setup**
   ```bash
   # Your current setup
   git clone https://github.com/raphael656-GTM/mcp-outreach-server.git
   cd mcp-outreach-server
   npm install
   npm run build
   ```

2. **Claude Desktop Config (Admin)**
   ```json
   {
     "mcpServers": {
       "outreach-admin-direct": {
         "command": "node",
         "args": ["/Users/raphaelberrebi/mcp-outreach-server/dist/index.js"],
         "env": {
           "OUTREACH_CLIENT_ID": "your_oauth_client_id",
           "OUTREACH_CLIENT_SECRET": "your_oauth_client_secret", 
           "OUTREACH_REFRESH_TOKEN": "your_refresh_token",
           "OUTREACH_REDIRECT_URI": "https://mcp-outreach-server-production.up.railway.app/callback"
         }
       }
     }
   }
   ```

3. **Admin Benefits:**
   - ✅ **Direct server access** - No proxy layer delays
   - ✅ **Full enterprise monitoring** - All 29 tools including analytics
   - ✅ **Real-time debugging** - See server logs directly
   - ✅ **OAuth management** - Control authentication for all users

4. **Current Issue (Admin Only):**
   - 🔧 **Zod validation errors** when testing tools
   - **Cause**: Server startup/OAuth initialization issues 
   - **Status**: Fixed in latest commit - server now starts gracefully

### **Testing Admin Setup:**
```
"List all available Outreach tools"
"Check my Outreach server health status" 
"Show me error analytics for the last 24 hours"
```

---

## 🔑 Method 3: Personal Access Token (Simplest Local Setup)
**Best for**: Individual users with existing Outreach API tokens

### Step 1: Get Your Outreach API Token

1. **Generate Personal Access Token**
   - Log into Outreach
   - Go to: Settings → Apps → API Access
   - Click "Generate Personal Access Token"
   - Copy the token (you won't see it again!)

### Step 2: Quick Setup

1. **Download Pre-built Server**
   ```bash
   # Clone repository
   git clone https://github.com/raphael656-GTM/mcp-outreach-server.git
   cd mcp-outreach-server
   
   # Install dependencies
   npm install
   
   # Build
   npm run build
   ```

2. **Configure Claude Desktop**
   
   Add to your Claude config:
   ```json
   {
     "mcpServers": {
       "outreach-token": {
         "command": "node",
         "args": ["/path/to/mcp-outreach-server/dist/index.js"],
         "env": {
           "OUTREACH_API_TOKEN": "your_personal_access_token_here"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop and Test**

---

## 🛠️ Available Tools (All Methods)

### High-Level Workflow Tools
- `create_complete_email_sequence` - Build entire email sequences
- `create_and_enroll_prospect` - Create and enroll in one step
- `create_campaign_with_prospects` - Full campaign automation

### Bulk Operations
- `bulk_create_prospects` - Create 25-50 prospects at once
- `bulk_enroll_prospects` - Mass enrollment in sequences
- `bulk_create_templates` - Batch template creation

### Core Functions
- `create_prospect` - Add individual prospects
- `search_prospects` - Find prospects by criteria
- `get_sequences` - List all sequences
- `create_sequence` - Build new sequences
- `add_prospect_to_sequence` - Enroll prospects

### Monitoring Tools
- `get_health_status` - Server health check
- `get_performance_metrics` - Performance statistics
- `clear_cache` - Reset cached data

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### "MCP server not initialized"
- **Cause**: Server is starting up
- **Fix**: Wait 30 seconds and retry

#### "Connection refused"
- **Cause**: Incorrect path or server not running
- **Fix**: Verify absolute path in config, check Node.js installation

#### "Authentication failed"
- **Cause**: Invalid or expired credentials
- **Fix**: Re-run OAuth setup or regenerate API token

#### Claude Not Recognizing Server
1. Use absolute paths (not relative) in config
2. Ensure Node.js is installed: `node --version`
3. Check file permissions: `chmod +x outreach-proxy.cjs`
4. Completely quit and restart Claude Desktop

### Debug Commands

Test your setup:
```bash
# Test Node.js
node --version

# Test server directly (local installation)
node /path/to/mcp-outreach-server/dist/index.js

# Check Claude config syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python -m json.tool
```

---

## 📊 Comparison Table

| Feature | Remote (Method 1) | Local OAuth (Method 2) | Local Token (Method 3) |
|---------|------------------|----------------------|----------------------|
| **Setup Time** | 2 minutes | 15 minutes | 5 minutes |
| **API Keys Required** | No | Yes (OAuth) | Yes (Token) |
| **Maintenance** | None | Self-managed | Self-managed |
| **Data Privacy** | Via proxy | Direct to Outreach | Direct to Outreach |
| **Customization** | Limited | Full | Full |
| **Best For** | Quick start | Teams/Production | Individual users |

---

## 📈 Example Usage Patterns

### Creating a Complete Campaign
```
"Using Outreach, create a complete campaign called 'Q1 Enterprise Outreach' with:
- A 4-email sequence over 2 weeks
- Initial email with subject 'Quick question about [Company]'
- Follow-ups at days 3, 7, and 14
- Enroll these prospects: john@example.com, sarah@company.com"
```

### Bulk Prospect Import
```
"Import these 10 prospects to Outreach and tag them as 'WebinarAttendees':
[Paste CSV or list of contacts]
Then add them all to the 'Webinar Follow-up' sequence"
```

### Performance Monitoring
```
"Check the Outreach server performance metrics and cache statistics"
```

---

## 🆘 Getting Help

### Resources
- **Repository**: https://github.com/raphael656-GTM/mcp-outreach-server
- **Issues**: Report bugs on GitHub Issues
- **Health Check** (Remote): https://mcp-outreach-server-production.up.railway.app/health

### Quick Checks
1. Verify Node.js is installed: `node --version`
2. Check config file syntax is valid JSON
3. Use absolute paths in configuration
4. Ensure proper file permissions

---

## 🎉 Success Indicators

You'll know your setup is working when:
- ✅ Claude responds to "List Outreach tools" command
- ✅ You can create a test prospect
- ✅ Sequences list appears when requested
- ✅ No error messages in Claude's response

---

## 🚦 Next Steps

Once installed, try these progressively complex tasks:

1. **Basic Test**: "Create a prospect named Test User with email test@example.com"
2. **List Resources**: "Show me all my Outreach sequences"
3. **Create Content**: "Create a 3-email follow-up sequence for demo requests"
4. **Automation**: "Build a complete outreach campaign for our new product launch"

---

**Questions?** Check the troubleshooting section or file an issue on GitHub!