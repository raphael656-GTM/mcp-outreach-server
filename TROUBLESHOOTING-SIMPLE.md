# Quick Troubleshooting Guide

## Common Issues & Solutions

### ❌ "npm: command not found" or "node: command not found"

**Problem**: Node.js is not installed on your system.

**Solutions**:
1. **Install Node.js**:
   - Go to: https://nodejs.org/en/download
   - Download "LTS" version for your operating system
   - Run the installer and follow prompts
   - Restart your terminal/command prompt
2. **Verify installation**:
   ```bash
   node --version
   npm --version
   ```
3. **If still not working**:
   - Try opening a new terminal window
   - On Windows: Add Node.js to your PATH environment variable
   - On Mac: Try `brew install node` if you have Homebrew

### ❌ "Server not found" or "mcp-outreach-server not found"

**Problem**: Claude Desktop can't find the server after installation.

**Solutions**:
1. **Restart Claude Desktop completely** (quit and reopen)
2. **Check your config path**:
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`  
   - Windows: `%APPDATA%/Claude/claude_desktop_config.json`
3. **Verify JSON syntax** - use [JSONLint](https://jsonlint.com/) to validate
4. **Reinstall if needed**: `npm uninstall -g @raphaelberrebi/mcp-outreach-server && npm install -g @raphaelberrebi/mcp-outreach-server`

### ❌ "Authentication failed" or OAuth errors

**Problem**: Can't connect to Outreach API.

**Solutions**:
1. **Double-check credentials** in your config file
2. **Get fresh refresh token** - old tokens may expire
3. **Verify Outreach permissions** - ensure your app has proper scopes
4. **Test credentials manually**:
   ```bash
   curl -X POST https://api.outreach.io/oauth/token \
     -d "client_id=YOUR_ID&client_secret=YOUR_SECRET&refresh_token=YOUR_TOKEN&grant_type=refresh_token"
   ```

### ❌ Tools not working or giving errors

**Problem**: Commands like "list my sequences" don't work.

**Solutions**:
1. **Use natural language**: Say "List my sequences" not "list_sequences"  
2. **Check Outreach permissions** - your account needs access to the resources
3. **Try simpler commands first**: Start with "Get my user info"
4. **Wait between requests** - don't spam multiple commands quickly

### ❌ "Permission denied" or 403 errors

**Problem**: Outreach API rejects requests.

**Solutions**:
1. **Check your Outreach role** - you may need admin permissions
2. **Verify API scopes** in your Outreach app settings
3. **Contact Outreach admin** if you're not the account owner

### ❌ Slow responses or timeouts

**Problem**: Commands take too long or time out.

**Solutions**:
1. **Check internet connection**
2. **Try smaller requests** - use `limit: 10` for large lists
3. **Check Outreach API status** - service may be down
4. **Wait and retry** - may be temporary rate limiting

## 🆘 Still Stuck?

1. **Check the main README**: Full documentation and examples
2. **Open an issue**: [GitHub Issues](https://github.com/raphael656-GTM/mcp-outreach-server/issues)
3. **Provide details**: Include your config (without credentials) and error messages

## 📋 Debug Checklist

Before asking for help, try these:

- [ ] Restarted Claude Desktop completely
- [ ] Verified config file path and JSON syntax
- [ ] Tested with simple command like "Get user info"  
- [ ] Checked Outreach credentials are current
- [ ] Confirmed internet connection works
- [ ] Tried reinstalling the NPM package

---
**Most issues are solved by restarting Claude Desktop and double-checking credentials!**