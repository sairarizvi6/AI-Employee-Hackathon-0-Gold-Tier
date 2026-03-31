# Email MCP Server Setup Instructions

## Quick Setup

### 1. Install Dependencies (Already Done ✅)
```bash
cd email-mcp-server
npm install
```

### 2. Generate OAuth Token

You have two options:

#### Option A: Use authorize.js (Recommended)
```bash
cd email-mcp-server
node authorize.js
```
This will:
- Open a browser for OAuth authentication
- Prompt you to paste the authorization code
- Save token.json automatically

#### Option B: Reuse Python Token
If you already authenticated with the Python email sender, you still need to run the Node.js OAuth flow once because Python pickle tokens can't be converted to JSON.

### 3. Configure Claude Code

Add this to your Claude Code MCP configuration:

**Windows**: `%USERPROFILE%\.claude\claude_desktop_config.json`

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

### 4. Restart Claude Code

After adding the MCP configuration, restart Claude Code to load the email MCP server.

### 5. Test the MCP Server

In Claude Code, try:
```
Use the email MCP to send a test email to yourself at your@email.com with subject "Test from MCP" and body "This is a test email sent via the MCP server!"
```

## Usage Examples

### Send Email
```
Send an email to john@example.com with subject "Meeting Follow-up" and body "Thanks for the great meeting today! Looking forward to our next discussion."
```

### Create Draft
```
Create a draft email to jane@example.com with subject "Proposal Review" and body "Please review the attached proposal at your convenience."
```

### Send with CC/BCC
```
Send an email to client@example.com with subject "Project Update", CC manager@example.com, and body "Here's the latest project status..."
```

## Troubleshooting

### Error: credentials.json not found
- Make sure you have valid credentials.json from Google Cloud Console
- Check the path in the MCP configuration

### Error: Token not found
- Run `node authorize.js` to generate token.json
- Follow the OAuth flow in your browser

### Error: Permission denied
- Make sure Gmail API is enabled in Google Cloud Console
- Verify the OAuth scope includes `gmail.send`

### MCP server not showing up in Claude Code
- Check that claude_desktop_config.json is in the correct location
- Verify JSON syntax is valid
- Restart Claude Code completely

## Next Steps

1. Run `node authorize.js` to generate token.json
2. Add MCP configuration to claude_desktop_config.json
3. Restart Claude Code
4. Test sending an email via MCP

This replaces the direct Python email sending with a proper MCP server integration!
