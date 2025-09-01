# Installing the Outreach Proxy Script

Since the proxy script can't be downloaded directly from GitHub, follow these steps:

## Option 1: Create from Terminal

1. Create the file:
```bash
cat > ~/mcp-files/outreach-proxy.cjs << 'EOF'
[PASTE THE ENTIRE SCRIPT HERE]
EOF
```

2. Make it executable:
```bash
chmod +x ~/mcp-files/outreach-proxy.cjs
```

## Option 2: Manual Creation

1. Open TextEdit or your preferred text editor
2. Create a new file
3. Copy the entire script content (provided separately)
4. Save as: `outreach-proxy.cjs` in your `~/mcp-files/` folder
5. In Terminal, make it executable:
```bash
chmod +x ~/mcp-files/outreach-proxy.cjs
```

## Option 3: Download from Alternative Source

Ask the administrator to provide one of these:
- A public Gist URL with the script
- A download link from a file sharing service
- The script via email or Slack

## Verify Installation

After creating the file, verify it's correct:

```bash
# Check file size (should be around 24KB)
ls -lh ~/mcp-files/outreach-proxy.cjs

# Check it starts with the shebang
head -n 1 ~/mcp-files/outreach-proxy.cjs
# Should show: #!/usr/bin/env node

# Check it has the correct server URL
grep "mcp-outreach-server-production" ~/mcp-files/outreach-proxy.cjs
# Should show the Railway URL
```

## Configure Claude Desktop

Once the file is created:

1. Open Claude config:
```bash
open -e ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

2. Add this configuration:
```json
{
  "mcpServers": {
    "outreach-remote": {
      "command": "node",
      "args": ["/Users/leeyalazarovic/mcp-files/outreach-proxy.cjs"]
    }
  }
}
```

3. Save, quit Claude completely, and restart

## Test the Connection

In Claude, try:
- "List all available Outreach tools"
- "Check the health of the Outreach server"