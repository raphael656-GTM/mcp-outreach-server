# MCP Outreach Server

An MCP (Model Context Protocol) server for integrating with Outreach.io API. This server enables you to manage sequences, prospects, and accounts programmatically through natural language interactions.

## Features

- **Sequence Management**: Create sequences, add steps, and manage sequence configurations
- **Prospect Management**: Load prospects from accounts and add them to sequences
- **Account Search**: Search for accounts by name or domain
- **Batch Operations**: Add multiple prospects to sequences at once

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd mcp-outreach-server
```

2. Install dependencies:
```bash
npm install
```

3. Set up your Outreach API credentials (choose one method):

### Method 1: OAuth 2.0 (Recommended)

a. Register an OAuth app in Outreach:
   - Log into Outreach as an admin
   - Go to Settings → Integrations → Developer
   - Click "Create New App"
   - Set Redirect URI to: `http://localhost:3000/callback`
   - Note your Client ID and Client Secret

b. Configure OAuth credentials:
```bash
cp .env.oauth.example .env
```

Edit `.env` and add your OAuth credentials:
```
OUTREACH_CLIENT_ID=your_oauth_client_id_here
OUTREACH_CLIENT_SECRET=your_oauth_client_secret_here
OUTREACH_REDIRECT_URI=http://localhost:3000/callback
```

### Method 2: Personal Access Token (Legacy)

a. Get your personal access token:
   - Log in to your Outreach account
   - Navigate to Settings > API > Personal Access Tokens
   - Click "Create Token"
   - Select the required scopes:
     - `sequences.all`
     - `prospects.all`
     - `accounts.read`
     - `sequenceStates.all`
     - `sequenceSteps.all`
     - `mailboxes.read`

b. Configure token:
```bash
cp .env.example .env
```

Edit `.env` and add your token:
```
OUTREACH_API_TOKEN=your_outreach_api_token_here
```

4. Build the TypeScript code:
```bash
npm run build
```

## Usage with Claude Desktop

1. Add the server to your Claude Desktop configuration:

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

### For OAuth (Recommended):
```json
{
  "mcpServers": {
    "outreach": {
      "command": "node",
      "args": ["/path/to/mcp-outreach-server/dist/index.js"],
      "env": {
        "OUTREACH_CLIENT_ID": "your_oauth_client_id_here",
        "OUTREACH_CLIENT_SECRET": "your_oauth_client_secret_here",
        "OUTREACH_REDIRECT_URI": "http://localhost:3000/callback"
      }
    }
  }
}
```

### For Personal Access Token:
```json
{
  "mcpServers": {
    "outreach": {
      "command": "node",
      "args": ["/path/to/mcp-outreach-server/dist/index.js"],
      "env": {
        "OUTREACH_API_TOKEN": "your_outreach_api_token_here"
      }
    }
  }
}
```

2. Restart Claude Desktop

3. **First-time OAuth setup**: If using OAuth, the first time you use the server, it will:
   - Open your browser to authorize the app
   - Ask you to log into Outreach and approve access
   - Store the tokens locally in `~/.mcp-outreach/token.json`
   - Automatically refresh tokens as needed

## Available Tools

### create_sequence
Create a new sequence in Outreach.

Parameters:
- `name` (required): Name of the sequence
- `description`: Description of the sequence
- `enabled`: Whether the sequence is enabled (default: true)
- `shareType`: Share type - private, read_only, or shared (default: private)

### list_sequences
List all sequences in your Outreach account.

Parameters:
- `limit`: Number of sequences to return (default: 50)
- `offset`: Offset for pagination (default: 0)

### search_accounts
Search for accounts by name or domain.

Parameters:
- `query` (required): Search query (name or domain)
- `limit`: Number of accounts to return (default: 20)

### get_account_prospects
Get prospects from a specific account.

Parameters:
- `accountId`: ID of the account
- `accountName`: Name of the account (alternative to accountId)
- `limit`: Number of prospects to return (default: 100)

### add_prospects_to_sequence
Add prospects to a sequence.

Parameters:
- `sequenceId` (required): ID of the sequence
- `prospectIds` (required): Array of prospect IDs to add
- `mailboxId`: ID of the mailbox to use for sending

### create_sequence_step
Add a step to a sequence.

Parameters:
- `sequenceId` (required): ID of the sequence
- `order` (required): Order of the step in the sequence
- `interval`: Days to wait before this step (default: 1)
- `stepType` (required): Type of step - auto_email, manual_email, call, task, or linkedin_send_message
- `subject`: Email subject (for email steps)
- `body`: Content of the step

## Example Workflows

### Create a sequence and add prospects

1. Create a new sequence:
```
"Create a new sequence called 'Q1 Outreach Campaign' with description 'Targeting enterprise accounts'"
```

2. Search for an account:
```
"Search for accounts with domain acme.com"
```

3. Load prospects from the account:
```
"Get all prospects from account ID 12345"
```

4. Add prospects to the sequence:
```
"Add prospect IDs [1001, 1002, 1003] to sequence ID 5678"
```

### Build a multi-step email sequence

1. Create the sequence:
```
"Create a sequence called 'Product Demo Follow-up'"
```

2. Add email steps:
```
"Add an auto_email step to sequence 5678 with subject 'Thanks for your interest' that sends immediately"
"Add another auto_email step that waits 3 days with subject 'Quick follow-up'"
```

## Development

To run in development mode:
```bash
npm run dev
```

To build:
```bash
npm run build
```

## API Rate Limits

Please be aware of Outreach API rate limits:
- Standard rate limit: 10,000 requests per hour
- Bulk operations may have additional limits

The server implements error handling for rate limit responses.

## Troubleshooting

### Authentication Errors
- Ensure your API token is valid and has the required scopes
- Check that the token is properly set in your environment

### Connection Issues
- Verify your network connection
- Check if the Outreach API endpoint is accessible

### Permission Errors
- Ensure your API token has the necessary permissions for the operations you're trying to perform
- Some operations may require admin privileges in Outreach

## License

MIT