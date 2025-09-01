# 🚀 Outreach MCP - Simple Setup Guide for Users

## Quick Setup (2 minutes)

### Step 1: Download the Proxy Script

Open your Terminal and run:

```bash
# Create a directory for MCP files
mkdir ~/mcp-files
cd ~/mcp-files

# Download the proxy script from the server
curl -o outreach-proxy.cjs https://mcp-outreach-server-production.up.railway.app/download/proxy

# Make it executable
chmod +x outreach-proxy.cjs

# Verify it downloaded correctly (should be ~24KB)
ls -lh outreach-proxy.cjs
```

### Step 2: Configure Claude Desktop

1. **Open your Claude Desktop config file:**

   **On macOS:**
   ```bash
   open -e ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

   **On Windows:**
   Open in Notepad:
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

2. **Add this configuration:**

   If the file is empty, paste this:
   ```json
   {
     "mcpServers": {
       "outreach-remote": {
         "command": "node",
         "args": ["/Users/YOUR_USERNAME/mcp-files/outreach-proxy.cjs"]
       }
     }
   }
   ```

   If the file already has content, add the outreach-remote section:
   ```json
   {
     "mcpServers": {
       "existing-server": {
         "...": "..."
       },
       "outreach-remote": {
         "command": "node",
         "args": ["/Users/YOUR_USERNAME/mcp-files/outreach-proxy.cjs"]
       }
     }
   }
   ```

3. **IMPORTANT: Replace YOUR_USERNAME with your actual username!**

   To find your username:
   ```bash
   echo $USER
   ```

   Your path will be:
   - Mac: `/Users/[your-username]/mcp-files/outreach-proxy.cjs`
   - Windows: `C:\\Users\\[your-username]\\mcp-files\\outreach-proxy.cjs`

### Step 3: Restart Claude Desktop

1. **Completely quit Claude Desktop** (not just close the window)
   - Mac: Cmd+Q or right-click dock icon → Quit
   - Windows: Right-click system tray icon → Quit

2. **Wait 5 seconds**

3. **Relaunch Claude Desktop**

### Step 4: Test Your Connection

In Claude, type:
```
List all available Outreach tools
```

You should see a list of 24 tools. If you see "MCP server not initialized", wait 30 seconds and try again (the server needs to wake up).

## Available Commands

Once connected, you can use commands like:

- **Create prospects:**
  ```
  Create a prospect named John Smith with email john@techcorp.com
  ```

- **Create email sequences:**
  ```
  Create a 3-email follow-up sequence called "Product Demo Follow-up"
  ```

- **Bulk operations:**
  ```
  Create 5 prospects in bulk from this list:
  - Alice Johnson, alice@startup.io, CEO
  - Bob Wilson, bob@tech.co, CTO
  [etc...]
  ```

## Troubleshooting

### "Command not found: node"
Install Node.js from https://nodejs.org/

### "MCP server not initialized"
The server is waking up. Wait 30 seconds and try again.

### Claude doesn't recognize Outreach commands
1. Make sure you completely quit Claude (not just closed window)
2. Check your config file path is correct
3. Verify the proxy script is executable: `chmod +x ~/mcp-files/outreach-proxy.cjs`

### Still having issues?
Test the server directly:
```bash
curl https://mcp-outreach-server-production.up.railway.app/health
```

Should return JSON with "status": "healthy"

## What This Gives You

✅ **24 Outreach tools** ready to use
✅ **No API keys** needed
✅ **No OAuth setup** required
✅ **Automatic updates** from the server
✅ **Full Outreach automation** through Claude

Ready to go! 🎉