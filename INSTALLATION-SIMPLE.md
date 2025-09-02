# Simple Installation Guide

## For End Users (Least Technical Lift)

### Prerequisites
- Have Claude Desktop installed
- Have an Outreach account with API access

### Step 1: Install Node.js (if needed) (5 minutes)
**Check if you have Node.js**:
```bash
node --version
```

**If you get "command not found"**:
1. Go to: https://nodejs.org/en/download
2. Download "LTS" version for your system  
3. Run the installer (follow prompts)
4. Restart your terminal/command prompt

### Step 2: Install the Server (30 seconds)
```bash
npm install -g @raphaelberrebi/mcp-outreach-server
```

### Step 3: Get Credentials (5 minutes)
1. Go to Outreach → Settings → API Access
2. Create a new application
3. Copy these three values:
   - `Client ID`
   - `Client Secret` 
   - `Refresh Token`

### Step 4: Configure Claude Desktop (2 minutes)

**Find your config file:**
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Add this configuration:**
```json
{
  "mcpServers": {
    "outreach": {
      "command": "mcp-outreach-server",
      "env": {
        "OUTREACH_CLIENT_ID": "paste_your_client_id_here",
        "OUTREACH_CLIENT_SECRET": "paste_your_client_secret_here",
        "OUTREACH_REFRESH_TOKEN": "paste_your_refresh_token_here"
      }
    }
  }
}
```

### Step 5: Restart Claude Desktop (30 seconds)
Completely quit and restart Claude Desktop.

### Step 6: Test (30 seconds)
In Claude Desktop, try: **"Show me my Outreach sequences"**

## ✅ That's it! 

You now have access to all **76 Outreach tools** through natural language in Claude Desktop.

### Quick Test Commands
- `"List my Outreach sequences"`
- `"Show me my prospects"`
- `"Create a new sequence called 'Test'"`
- `"Get my user information"`

### Need Help?
- Check the [main README](./README.md) for detailed documentation
- Open an [issue](https://github.com/raphael656-GTM/mcp-outreach-server/issues) if you get stuck

---
**Total setup time: ~13 minutes** (including Node.js installation if needed)