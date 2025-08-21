# MCP Outreach Server

A Model Context Protocol (MCP) server that provides Claude with direct integration to Outreach.io's sales engagement platform.

## Features

- **Prospect Management**: Create, search, update, and tag prospects
- **Sequence Operations**: Manage sequences and prospect enrollments
- **Account Management**: Create and search company accounts
- **Mailbox Access**: List available mailboxes for sending
- **OAuth 2.0 Authentication**: Secure token-based authentication
- **Comprehensive Error Handling**: Proper error handling for rate limits and authentication

## Prerequisites

- Node.js v18 or higher
- Outreach.io account with API access
- OAuth 2.0 application registered in Outreach

## Quick Start

### 1. Set Up Outreach OAuth Application

1. Log into your Outreach account as an admin
2. Navigate to **Settings → Integrations → API Access**
3. Click **Create New App** or **Register Application**
4. Fill in the details:
   - **Application Name**: "MCP Integration"
   - **Redirect URI**: `http://localhost:3000/callback`
   - **Application Type**: "Private" or "Internal"
5. Select required scopes:
   - `accounts.all` - Account management
   - `prospects.all` - Prospect management
   - `sequences.all` - Sequence operations
   - `sequenceStates.all` - Sequence enrollment
   - `mailboxes.all` - Mailbox access
   - `tags.all` - Tag management
   - `users.all` - User information
6. Save and copy your **Client ID** and **Client Secret**

### 2. Install and Configure

```bash
# Clone/download the project
git clone <repository-url>
cd mcp-outreach-server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` with your OAuth credentials:
```bash
OUTREACH_CLIENT_ID=your_client_id_here
OUTREACH_CLIENT_SECRET=your_client_secret_here
OUTREACH_REDIRECT_URI=http://localhost:3000/callback
OUTREACH_API_BASE_URL=https://api.outreach.io/api/v2
MCP_SERVER_NAME=outreach-mcp
MCP_SERVER_PORT=3000
```

### 3. Get OAuth Refresh Token

```bash
# Run OAuth setup (opens browser automatically)
npm run setup
```

This will:
- Open your browser to authorize with Outreach
- Save the refresh token to your `.env` file
- Display success confirmation

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