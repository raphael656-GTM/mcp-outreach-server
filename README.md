# MCP Outreach Server

[![npm version](https://badge.fury.io/js/%40raphaelberrebi%2Fmcp-outreach-server.svg)](https://www.npmjs.com/package/@raphaelberrebi/mcp-outreach-server)

A comprehensive **Model Context Protocol (MCP) server** for Outreach API integration with **76 tools** covering all **33 Outreach API scopes**.

Use natural language to manage your entire Outreach workflow through Claude Desktop - from prospects and sequences to tasks and analytics.

## ✨ Features

- 🎯 **Complete Outreach API coverage** - All 33 scopes with 76+ tools
- 🤖 **Natural language interface** - Talk to your Outreach data through Claude
- ⚡ **Fast & reliable** - Built on proven simple architecture  
- 🔒 **Secure OAuth** - Your credentials stay with you
- 📦 **Easy installation** - One command setup

## 🚀 Quick Start

### 1. Install Node.js (if you don't have it)
**Download Node.js**: https://nodejs.org/en/download  
Choose "LTS" version and follow the installer for your operating system.

**Verify installation**:
```bash
node --version
npm --version
```

### 2. Install the Server
```bash
npm install -g @raphaelberrebi/mcp-outreach-server
```

### 3. Get Your Outreach Credentials

You'll need these from your Outreach account:
- `OUTREACH_CLIENT_ID` 
- `OUTREACH_CLIENT_SECRET`
- `OUTREACH_REFRESH_TOKEN`

[**→ Get Outreach API credentials**](https://api.outreach.io/api/v2/docs#authentication)

### 4. Configure Claude Desktop

Add this to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "outreach": {
      "command": "mcp-outreach-server",
      "env": {
        "OUTREACH_CLIENT_ID": "your_client_id_here",
        "OUTREACH_CLIENT_SECRET": "your_client_secret_here",
        "OUTREACH_REFRESH_TOKEN": "your_refresh_token_here"
      }
    }
  }
}
```

### 5. Restart Claude Desktop

Restart Claude Desktop completely, and you're ready to go!

## 💬 Usage Examples

Once installed, you can use natural language with Claude:

```
"Show me my Outreach sequences"
"Create a new sequence called 'Q4 Follow-up'"
"Find prospects from Acme Corp"
"Add John Doe to the Q4 Follow-up sequence"
"Show me today's tasks"
"Create a call task for prospect ID 123"
"List my email templates"
"Get current user information"
```

## 🛠️ Available Tools

**Accounts** (4 tools)
- List, get, create, update accounts

**Prospects** (5 tools)  
- List, get, create, update, search prospects

**Sequences** (5 tools)
- List, get, create, update, delete sequences

**Sequence Steps** (4 tools)
- List, create, update, delete sequence steps

**Tasks** (3 tools)
- List, create, update tasks

**Templates** (3 tools)
- List, get, create email templates

**And 52+ more tools** covering:
- Calls, Opportunities, Users, Mailboxes
- Snippets, Personas, Phone Numbers
- Audit logs, Batches, Content Categories
- Email addresses, Favorites, Job roles
- And all other Outreach API scopes

[**→ See complete tool list**](./TOOLS.md)

## 🔄 Alternative Installation (Without Node.js)

If you prefer not to install Node.js, you can run the server remotely:

### **Option 1: Use a Remote Server**
Contact us for hosted MCP server access - no local installation required.

### **Option 2: Docker Installation** (Coming Soon)
```bash
docker run -d --name outreach-mcp \
  -e OUTREACH_CLIENT_ID="your_id" \
  -e OUTREACH_CLIENT_SECRET="your_secret" \
  -e OUTREACH_REFRESH_TOKEN="your_token" \
  @raphaelberrebi/mcp-outreach-server
```

### **Option 3: Download Binary** (Coming Soon)
Pre-compiled binaries for Windows, Mac, and Linux (no Node.js required).

## 🔧 Troubleshooting

### **"Server not found"**
- Make sure you've restarted Claude Desktop completely
- Check that the configuration file path is correct
- Verify the JSON syntax in your config

### **"Authentication failed"**  
- Double-check your Outreach credentials
- Make sure your refresh token hasn't expired
- Verify you have proper API permissions in Outreach

### **"Tool not working"**
- Ensure you're using natural language (not technical commands)
- Try: "List my sequences" instead of "list_sequences"
- Check that you have the required permissions in Outreach

## 📚 Documentation

- [**Quick Installation**](./INSTALLATION-SIMPLE.md) - Step-by-step setup guide
- [**Troubleshooting**](./TROUBLESHOOTING-SIMPLE.md) - Common issues and solutions  
- [**Complete Deployment Guide**](https://github.com/raphael656-GTM/mcp-outreach-server/blob/main/DEPLOYMENT-GUIDE-COMPLETE.md) - Self-hosting options
- [**Full Documentation**](https://github.com/raphael656-GTM/mcp-outreach-server) - GitHub repository

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) first.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/@raphaelberrebi/mcp-outreach-server)
- [GitHub Repository](https://github.com/raphael656-GTM/mcp-outreach-server)
- [Outreach API Documentation](https://api.outreach.io/api/v2/docs)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

**Questions?** Open an [issue](https://github.com/raphael656-GTM/mcp-outreach-server/issues) or check our [documentation](./docs/).