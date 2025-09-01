# 🚀 Complete Outreach MCP Setup Guide for Leeya

## Prerequisites Check

First, let's check if Node.js is installed:

```bash
node --version
```

If you see a version number (like v18.x.x), you're good. If not, download Node.js from https://nodejs.org/

---

## Step 1: Clean Up Any Previous Attempts

```bash
# Remove any existing config file
rm -f ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Remove any old proxy files
rm -f ~/mcp-files/outreach-proxy.cjs

# Make sure the directory exists
mkdir -p ~/mcp-files
```

---

## Step 2: Download the Proxy Script

```bash
# Navigate to the mcp-files directory
cd ~/mcp-files

# Download the proxy script from Raphael's server
curl -o outreach-proxy.cjs https://mcp-outreach-server-production.up.railway.app/download/proxy

# Make it executable
chmod +x outreach-proxy.cjs

# Verify it downloaded correctly (should be about 24KB)
ls -lh outreach-proxy.cjs
```

If the file is too small (like 14 bytes), it means the download failed. In that case, we'll create it manually (see Alternative Method below).

---

## Step 3: Create Claude Desktop Configuration

We'll use printf to avoid any quote issues:

```bash
# Create the config file with proper straight quotes
printf '{"mcpServers":{"outreach-remote":{"command":"node","args":["/Users/leeyalazarovic/mcp-files/outreach-proxy.cjs"]}}}' > ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Verify the file was created
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

You should see:
```json
{"mcpServers":{"outreach-remote":{"command":"node","args":["/Users/leeyalazarovic/mcp-files/outreach-proxy.cjs"]}}}
```

---

## Step 4: Verify Everything is Correct

```bash
# Check the config file exists and has the right content
echo "Config file:"
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

echo -e "\nProxy file size:"
ls -lh ~/mcp-files/outreach-proxy.cjs

echo -e "\nNode.js version:"
node --version
```

---

## Step 5: Restart Claude Desktop

1. **Completely quit Claude Desktop**
   - Press `Cmd + Q` while Claude is active
   - Or right-click Claude in the dock and select "Quit"

2. **Wait 5 seconds**

3. **Reopen Claude Desktop**
   - Should open without any error messages

---

## Step 6: Test the Connection

In Claude, type these commands one by one:

1. **First test:**
   ```
   List all available Outreach tools
   ```
   
   **Expected result:** A list of 24 tools

2. **If you see "MCP server not initialized":**
   - Wait 30 seconds (server is waking up)
   - Try again

3. **Second test:**
   ```
   Check the health of the Outreach server
   ```
   
   **Expected result:** Health status showing "healthy"

4. **Third test:**
   ```
   Create a test prospect named John Doe with email john.doe@example.com
   ```
   
   **Expected result:** Confirmation that prospect was created

---

## Alternative Method: Manual Proxy Script Creation

If the download doesn't work (file is too small), ask Raphael to:

1. **Create a GitHub Gist:**
   - Go to https://gist.github.com
   - Paste the contents of outreach-proxy.cjs
   - Make it public
   - Share the raw URL

2. **Or send the file directly via:**
   - Email
   - Slack/Discord
   - File sharing service

Then you can create the file manually:

```bash
# Open nano editor
nano ~/mcp-files/outreach-proxy.cjs

# Paste the contents Raphael provides
# Save with Ctrl+X, then Y, then Enter

# Make it executable
chmod +x ~/mcp-files/outreach-proxy.cjs
```

---

## Troubleshooting

### "Command not found: node"
- Install Node.js from https://nodejs.org/

### "MCP server not initialized"
- Wait 30 seconds and try again (server needs to wake up)

### "Error reading or parsing claude_desktop_config.json"
- You have curly quotes instead of straight quotes
- Run this to fix:
```bash
rm ~/Library/Application\ Support/Claude/claude_desktop_config.json
printf '{"mcpServers":{"outreach-remote":{"command":"node","args":["/Users/leeyalazarovic/mcp-files/outreach-proxy.cjs"]}}}' > ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Claude doesn't respond to Outreach commands
- Make sure you completely quit Claude (not just closed window)
- Verify Node.js is installed: `node --version`
- Check proxy file exists: `ls -lh ~/mcp-files/outreach-proxy.cjs`
- Check config file: `cat ~/Library/Application\ Support/Claude/claude_desktop_config.json`

### Test the server directly
```bash
curl https://mcp-outreach-server-production.up.railway.app/health
```
Should return JSON with "status": "healthy"

---

## What You Can Do Once Connected

### Basic Commands:
```
Create a prospect named Sarah Johnson with email sarah@techcorp.com at company TechCorp

Search for prospects with tag "hot-lead"

List all my Outreach sequences

Get all available mailboxes
```

### Advanced Commands:
```
Create a complete email sequence called "Q1 Outreach" with 3 emails:
1. Initial outreach (day 0): "Quick question about {{account.name}}"
2. Follow-up (day 3): "Following up on my previous email"
3. Final touch (day 7): "Final thoughts on our solution"

Then enroll john@example.com in this sequence
```

### Bulk Operations:
```
Create 5 prospects in bulk:
- Alice Johnson, alice@startup.io, Startup Inc, CEO
- Bob Wilson, bob@tech.co, Tech Co, CTO
- Carol Brown, carol@sales.com, Sales Corp, VP Sales
- David Lee, david@market.io, Market Inc, CMO
- Eve Davis, eve@product.co, Product Co, PM
```

---

## Success Checklist

- [ ] Node.js is installed
- [ ] Created ~/mcp-files directory
- [ ] Downloaded outreach-proxy.cjs (should be ~24KB)
- [ ] Created claude_desktop_config.json with straight quotes
- [ ] Restarted Claude Desktop
- [ ] No error messages when opening Claude
- [ ] "List all available Outreach tools" works
- [ ] Can create test prospects

Once all items are checked, you're ready to use all 24 Outreach tools! 🎉

---

## Need Help?

If the proxy download doesn't work from the server, ask Raphael to either:
1. Make the repository public temporarily
2. Create a public Gist with the proxy script
3. Send the file directly

The server health check URL: https://mcp-outreach-server-production.up.railway.app/health