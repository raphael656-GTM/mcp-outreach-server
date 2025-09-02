# User Setup Guide - Company Outreach MCP

**For employees/users connecting to company's centralized Outreach MCP server**

## ⚡ Quick Setup (5 minutes)

### Prerequisites
- ✅ Claude Desktop installed
- ✅ Node.js installed ([download here](https://nodejs.org/en/download) if needed)
- ❌ **NO Outreach API access required**
- ❌ **NO personal credentials needed**

### Step 1: Create Project Folder
```bash
# Create a new folder for the Outreach MCP proxy
mkdir outreach-mcp-proxy
cd outreach-mcp-proxy
```

### Step 2: Create Required Files

#### **Create `package.json`**

**Mac/Linux:**
```bash
# Create package.json file
cat > package.json << 'EOF'
{
  "name": "outreach-mcp-proxy",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.3",
    "axios": "^1.11.0"
  }
}
EOF
```

**Windows (Command Prompt):**
```cmd
echo {> package.json
echo   "name": "outreach-mcp-proxy",>> package.json
echo   "version": "1.0.0",>> package.json
echo   "type": "module",>> package.json
echo   "dependencies": {>> package.json
echo     "@modelcontextprotocol/sdk": "^1.17.3",>> package.json
echo     "axios": "^1.11.0">> package.json
echo   }>> package.json
echo }>> package.json
```

**Windows (PowerShell):**
```powershell
@"
{
  "name": "outreach-mcp-proxy",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.3",
    "axios": "^1.11.0"
  }
}
"@ | Out-File -FilePath "package.json" -Encoding UTF8
```

#### **Create `outreach-mcp-proxy.js`**

**Option 1: Use Text Editor (All Platforms)**
1. Open your favorite text editor (Notepad, VS Code, TextEdit, etc.)
2. Copy and paste the code below
3. Save as `outreach-mcp-proxy.js` in your `outreach-mcp-proxy` folder

**Option 2: Command Line (Mac/Linux only)**
```bash
# Create the proxy script
cat > outreach-mcp-proxy.js << 'EOF'
#!/usr/bin/env node

/**
 * MCP Outreach Proxy - Connects to centralized company server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const COMPANY_SERVER_URL = process.env.OUTREACH_SERVER_URL || 'REPLACE_WITH_YOUR_COMPANY_SERVER_URL';

class OutreachMCPProxy {
  constructor() {
    this.server = new Server({
      name: 'outreach-mcp-proxy',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.setupHandlers();
  }

  setupHandlers() {
    // Forward tools list request to company server
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        const response = await axios.post(`${COMPANY_SERVER_URL}/mcp`, {
          method: 'tools/list'
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      } catch (error) {
        console.error('Failed to fetch tools from company server:', error.message);
        throw new Error(`Company MCP server unavailable: ${error.message}`);
      }
    });

    // Forward tool calls to company server  
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const response = await axios.post(`${COMPANY_SERVER_URL}/mcp`, {
          method: 'tools/call',
          params: request.params
        }, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      } catch (error) {
        console.error('Failed to execute tool on company server:', error.message);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Company server error: ${error.message}`,
              details: 'Contact your admin if this persists'
            }, null, 2)
          }]
        };
      }
    });

    // Error handling
    this.server.onerror = (error) => {
      console.error('MCP Proxy error:', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`MCP Outreach Proxy connected to: ${COMPANY_SERVER_URL}`);
  }
}

// Start the proxy
const proxy = new OutreachMCPProxy();
proxy.run().catch(console.error);
EOF

# Make the script executable
chmod +x outreach-mcp-proxy.js
```

**IMPORTANT FOR BOTH OPTIONS**: 
- Ask your admin for the company server URL 
- Replace `REPLACE_WITH_YOUR_COMPANY_SERVER_URL` in the script with the actual URL
- If using text editor, make sure the file is saved as `.js` (not `.txt`)

### Step 3: Install Dependencies
```bash
# Install required packages
npm install
```

### Step 4: Get Your Current Directory Path
```bash
# Get the full path to your proxy script (you'll need this for Claude config)
pwd
# Copy this path - you'll need it in the next step
# Example output: /Users/yourname/outreach-mcp-proxy
```

### Step 5: Configure Claude Desktop

**Find your config file:**
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Add this configuration:**
```json
{
  "mcpServers": {
    "outreach": {
      "command": "node",
      "args": ["/FULL/PATH/FROM/STEP4/outreach-mcp-proxy.js"],
      "env": {
        "OUTREACH_SERVER_URL": "ASK_YOUR_ADMIN_FOR_THIS_URL"
      }
    }
  }
}
```

**IMPORTANT**: 
- Replace `/FULL/PATH/FROM/STEP4/` with the path you copied in Step 4
- Replace `ASK_YOUR_ADMIN_FOR_THIS_URL` with your company's actual server URL
- Example: If Step 4 showed `/Users/john/outreach-mcp-proxy`, then use `/Users/john/outreach-mcp-proxy/outreach-mcp-proxy.js`

### Step 6: Restart Claude Desktop
Completely quit and restart Claude Desktop.

### Step 7: Test
Try: **"Show me my Outreach sequences"**

## ✅ That's It!

You now have access to all **76 Outreach tools** through your company's centralized server.

## 🔧 Troubleshooting

### "Server unavailable" or connection errors
- Check with your admin that the company server is running
- Verify you have the correct server URL
- Make sure you're connected to the company network (if required)

### "Command not found" errors  
- Make sure Node.js is installed: `node --version`
- Check that the file path in your config is correct
- Try using absolute paths instead of relative paths

### "No tools available"
- Restart Claude Desktop completely
- Check that your config file is valid JSON
- Contact your admin for support

## 💬 Usage Examples

Once connected, you can use natural language:
- `"List my Outreach sequences"`
- `"Show prospects from Acme Corp"`
- `"Create a new sequence called 'Q4 Follow-up'"`
- `"Add John Doe to sequence ID 123"`
- `"Show me my recent tasks"`
- `"Get my user information"`

## 🆘 Need Help?

Contact your admin or IT support if you encounter issues. Include:
- Your operating system
- Error messages (if any)
- Screenshot of your Claude Desktop config

---

**You're connecting to YOUR company's Outreach data through a centralized server managed by your admin.**