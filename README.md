# Email MCP Server

MCP server for sending emails via Gmail API.

## Installation

```bash
cd email-mcp-server
npm install
```

## Configuration

The server uses the same Gmail credentials as your Python watchers:

- **Credentials**: `../credentials.json` (from Google Cloud Console)
- **Token**: `token.json` (generated after OAuth flow)

## Usage with Claude Code

Add to your Claude Code MCP configuration file:

**Windows**: `%USERPROFILE%\.claude\claude_desktop_config.json`
**Mac/Linux**: `~/.claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "email": {
      "command": "node",
      "args": ["D:\\AI-Employee-Hackathon-0\\email-mcp-server\\index.js"],
      "env": {
        "GMAIL_CREDENTIALS_PATH": "D:\\AI-Employee-Hackathon-0\\credentials.json",
        "GMAIL_TOKEN_PATH": "D:\\AI-Employee-Hackathon-0\\email-mcp-server\\token.json"
      }
    }
  }
}
```

## First Time Setup

1. Make sure you have valid `credentials.json` from Google Cloud Console
2. Run the Python email sender once to generate the OAuth token:
   ```bash
   cd watchers
   python email_sender.py ../credentials.json
   ```
3. Copy the generated `token_send.pickle` and convert to JSON format, or use the token.json if generated
4. Restart Claude Code to load the MCP server

## Available Tools

### send_email
Send an email via Gmail API.

**Parameters:**
- `to` (required): Recipient email address
- `subject` (required): Email subject
- `body` (required): Email body (HTML or plain text)
- `cc` (optional): CC recipients (comma-separated)
- `bcc` (optional): BCC recipients (comma-separated)

**Example:**
```
Use the email MCP to send an email to john@example.com with subject "Meeting Follow-up" and body "Thanks for the meeting today!"
```

### create_draft
Create a draft email in Gmail for review.

**Parameters:**
- `to` (required): Recipient email address
- `subject` (required): Email subject
- `body` (required): Email body (HTML or plain text)

**Example:**
```
Use the email MCP to create a draft email to jane@example.com with subject "Proposal" and body "Please review the attached proposal."
```

## Testing

Test the MCP server directly:

```bash
cd email-mcp-server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node index.js
```

## Troubleshooting

**Error: Token not found**
- Run the Python email sender first to generate OAuth token
- Make sure GMAIL_TOKEN_PATH points to valid token file

**Error: Invalid credentials**
- Check that credentials.json is valid
- Verify Gmail API is enabled in Google Cloud Console

**Error: Permission denied**
- Make sure Gmail API scope includes `gmail.send`
- Re-run OAuth flow if needed
