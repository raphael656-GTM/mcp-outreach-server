- Remember these steps that you give me which might be wrong... 🚀 MCP Outreach Server Deployment Steps

  1. Set up Outreach OAuth Application

  - Log into Outreach as admin
  - Navigate to Settings → Integrations → API Access
  - Click "Create New App"
  - Set Application Name: "MCP Integration"
  - Set Redirect URI: http://localhost:3000/callback
  - Select Application Type: "Private" or "Internal"
  - Add required scopes:
    - accounts.all
    - prospects.all
    - sequences.all
    - sequenceStates.all
    - mailboxes.all
    - tags.all
    - users.all
  - Save and copy Client ID and Client Secret

  2. Configure Environment Variables

  - Run: cp .env.example .env
  - Edit .env file with your OAuth credentials:
    - Replace OUTREACH_CLIENT_ID=your_client_id_here
    - Replace OUTREACH_CLIENT_SECRET=your_client_secret_here
    - Keep other settings as default

  3. Get OAuth Refresh Token

  - Run: npm run setup
  - Browser will open automatically
  - Log into Outreach and authorize the app
  - Confirm refresh token is saved to .env

  4. Test Server Locally

  - Run: npm start
  - Verify no errors in console
  - Test with debug mode: DEBUG=true npm start
  - Run syntax check: node --check src/index.js

  5. Configure Claude Desktop

  - Get refresh token from .env file
  - Edit Claude config file:
    - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
    - Windows: %APPDATA%\Claude\claude_desktop_config.json
  - Add MCP server configuration with your actual credentials
  - Use full absolute path to src/index.js

  6. Test in Claude Desktop

  - Quit Claude Desktop completely
  - Restart Claude Desktop
  - Test health check: "Check the health of the Outreach server"
  - Test basic commands:
    - "Get a list of available sequences"
    - "Search for accounts containing 'test'"
    - "Get all available mailboxes"

  7. Troubleshooting (if needed)

  - Check server logs with DEBUG=true npm start
  - Re-run OAuth setup if authentication fails
  - Verify Claude Desktop config file syntax
  - Confirm all file paths are absolute
  - Test individual file syntax

  ✅ Success criteria: All test commands work in Claude without errors and return Outreach data.
- Outreach requires the URL has to include https protocol. For example: https://your.url