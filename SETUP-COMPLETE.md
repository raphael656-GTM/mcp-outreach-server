# 🎉 Complete MCP Outreach Server Setup Guide

## ✅ What This MCP Server Provides

**Full Outreach Sequence Management from Claude:**
- Create sequences
- Create sequence steps (email, call, task)
- Create email templates with HTML content
- Link templates to sequence steps
- Add prospects to sequences
- Manage all Outreach data through Claude

## 🔐 Required OAuth Scopes

Your Outreach OAuth app needs **ALL** these scopes:

```
mailboxes.all
prospects.all
sequences.all
sequenceSteps.all
sequenceStates.all
templates.all
sequenceTemplates.all
users.all
```

## 🚀 Setup Steps

### 1. Create Outreach OAuth App
1. Go to Outreach → Settings → Integrations → API Access
2. Create New App with name "MCP Integration"
3. Set Redirect URI: `https://your-railway-app.railway.app/callback`
4. Add **ALL 8 scopes** listed above
5. Copy Client ID and Client Secret

### 2. Install MCP Server
```bash
git clone https://github.com/yourusername/mcp-outreach-server.git
cd mcp-outreach-server
npm install
cp .env.example .env
```

### 3. Configure Environment
Edit `.env`:
```env
OUTREACH_CLIENT_ID=your_client_id
OUTREACH_CLIENT_SECRET=your_client_secret
OUTREACH_REDIRECT_URI=https://your-railway-app.railway.app/callback
```

### 4. Get OAuth Refresh Token
```bash
node get-auth-url.js
# Visit the URL, authorize, copy the code
node exchange-new-code.js YOUR_CODE_HERE
```

### 5. Configure Claude Desktop
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "outreach": {
      "command": "node",
      "args": ["/full/path/to/mcp-outreach-server/src/index.js"],
      "env": {
        "OUTREACH_CLIENT_ID": "your_client_id",
        "OUTREACH_CLIENT_SECRET": "your_client_secret", 
        "OUTREACH_REFRESH_TOKEN": "your_refresh_token_from_env_file",
        "OUTREACH_API_BASE_URL": "https://api.outreach.io/api/v2"
      }
    }
  }
}
```

### 6. Test in Claude
Restart Claude Desktop and try:
- "Create a new sequence called 'Product Demo'"
- "Create an email template with subject 'Hello {{prospect.firstName}}'"
- "Add an email step to sequence ID 123"
- "Link template ID 456 to sequence step ID 789"

## 🔧 Available Tools

**Sequence Management:**
- `create_sequence` - Create new sequences
- `get_sequences` - List all sequences
- `find_sequence` - Find sequence by name
- `create_sequence_step` - Add steps to sequences
- `get_sequence_steps` - View sequence steps

**Template Management:**
- `create_sequence_template` - Create email templates
- `get_sequence_templates` - List all templates
- `find_sequence_template` - Find template by name
- `update_sequence_template` - Edit templates
- `link_template_to_step` - Connect templates to steps

**Prospect Management:**
- `create_prospect` - Add new prospects
- `search_prospects` - Find prospects
- `add_prospect_to_sequence` - Enroll prospects

**Other Tools:**
- `get_mailboxes` - List available mailboxes
- `health_check` - Test API connection

## 🎯 Example Workflows

**Create Complete Sequence:**
1. "Create a sequence called 'Welcome Series'"
2. "Create an email template called 'Welcome Email' with subject 'Welcome {{prospect.firstName}}!'"
3. "Add an email step to sequence ID [sequence_id]"
4. "Link template ID [template_id] to sequence step ID [step_id]"
5. "Add prospect john@example.com to sequence ID [sequence_id]"

**Template Variables:**
Use Outreach variables in templates:
- `{{prospect.firstName}}` - Prospect's first name
- `{{prospect.lastName}}` - Prospect's last name  
- `{{prospect.company}}` - Company name
- `{{sender.firstName}}` - Your name

## 🔒 Security Notes

- Keep Client Secret secure
- Refresh tokens auto-renew
- All API calls are authenticated
- Follows Outreach rate limits

## 🐛 Troubleshooting

**"Unauthorized OAuth Scope" error:**
- Add the missing scope to your Outreach OAuth app
- Re-authorize with the new scope
- Update your refresh token

**"Template linking failed":**
- Ensure you have `sequenceTemplates.all` scope
- Template linking creates a sequenceTemplate resource

**Claude doesn't see the server:**
- Check absolute paths in Claude config
- Restart Claude Desktop after config changes
- Verify environment variables

## 🎉 Success!

You now have complete Outreach sequence management through Claude! Your team can create sophisticated email sequences entirely through conversation.