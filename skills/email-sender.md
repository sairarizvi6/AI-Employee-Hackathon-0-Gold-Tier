---
name: email-sender
description: Send emails using MCP server integration
version: 1.0.0
---

# Email Sender Skill

This skill enables the AI Employee to send emails through an MCP (Model Context Protocol) server, providing a secure and controlled way to handle outbound email communications.

## Purpose

Provides email sending capabilities with:
- Integration with Gmail API via MCP
- Draft creation and review workflow
- Approval requirements for sensitive emails
- Attachment handling
- Email logging and tracking

## Architecture

Uses MCP server to:
- Authenticate with Gmail API
- Send emails with attachments
- Create drafts for review
- Track sent emails
- Handle errors gracefully

## Prerequisites

1. **Gmail API Setup**:
   ```bash
   # Enable Gmail API in Google Cloud Console
   # Download credentials.json
   # Place in watchers/ folder (add to .gitignore)
   ```

2. **MCP Server Installation**:
   ```bash
   npm install -g @modelcontextprotocol/server-gmail
   # Or use a custom MCP server
   ```

3. **Claude Code MCP Configuration**:
   ```json
   // ~/.claude/mcp_settings.json
   {
     "mcpServers": {
       "gmail": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-gmail"],
         "env": {
           "GMAIL_CREDENTIALS_PATH": "/path/to/credentials.json",
           "GMAIL_TOKEN_PATH": "/path/to/token.json"
         }
       }
     }
   }
   ```

## MCP Server Implementation

### Custom Email MCP Server

```javascript
// email-mcp-server/index.js
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = process.env.GMAIL_TOKEN_PATH || 'token.json';
const CREDENTIALS_PATH = process.env.GMAIL_CREDENTIALS_PATH || 'credentials.json';

class EmailMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'email-sender',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.gmail = null;
  }

  async authorize() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
      oAuth2Client.setCredentials(token);
    } else {
      throw new Error('Token not found. Run authorization flow first.');
    }

    this.gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
  }

  setupToolHandlers() {
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'send_email',
          description: 'Send an email via Gmail',
          inputSchema: {
            type: 'object',
            properties: {
              to: {
                type: 'string',
                description: 'Recipient email address',
              },
              subject: {
                type: 'string',
                description: 'Email subject',
              },
              body: {
                type: 'string',
                description: 'Email body (plain text or HTML)',
              },
              cc: {
                type: 'string',
                description: 'CC recipients (comma-separated)',
              },
              bcc: {
                type: 'string',
                description: 'BCC recipients (comma-separated)',
              },
              attachments: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of file paths to attach',
              },
            },
            required: ['to', 'subject', 'body'],
          },
        },
        {
          name: 'create_draft',
          description: 'Create a draft email in Gmail',
          inputSchema: {
            type: 'object',
            properties: {
              to: { type: 'string' },
              subject: { type: 'string' },
              body: { type: 'string' },
            },
            required: ['to', 'subject', 'body'],
          },
        },
      ],
    }));

    this.server.setRequestHandler('tools/call', async (request) => {
      if (!this.gmail) {
        await this.authorize();
      }

      switch (request.params.name) {
        case 'send_email':
          return await this.sendEmail(request.params.arguments);
        case 'create_draft':
          return await this.createDraft(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async sendEmail({ to, subject, body, cc, bcc, attachments }) {
    try {
      const email = [
        `To: ${to}`,
        cc ? `Cc: ${cc}` : '',
        bcc ? `Bcc: ${bcc}` : '',
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body,
      ]
        .filter(Boolean)
        .join('\n');

      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              messageId: result.data.id,
              to,
              subject,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
        isError: true,
      };
    }
  }

  async createDraft({ to, subject, body }) {
    try {
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body,
      ].join('\n');

      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const result = await this.gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedEmail,
          },
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              draftId: result.data.id,
              to,
              subject,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Email MCP server running on stdio');
  }
}

const server = new EmailMCPServer();
server.run().catch(console.error);
```

### Package Configuration

```json
// email-mcp-server/package.json
{
  "name": "email-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "email-mcp-server": "./index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "googleapis": "^140.0.0"
  }
}
```

## Setup Instructions

### Step 1: Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Download `credentials.json`

### Step 2: Install MCP Server

```bash
# Create MCP server directory
mkdir -p email-mcp-server
cd email-mcp-server

# Copy the index.js and package.json from above
npm install

# Make executable
chmod +x index.js

# Link globally
npm link
```

### Step 3: Authorize Gmail Access

```bash
# Run authorization flow (one-time)
node authorize.js
# Follow prompts to authorize and save token.json
```

### Step 4: Configure Claude Code

Add to `~/.claude/mcp_settings.json`:

```json
{
  "mcpServers": {
    "email": {
      "command": "email-mcp-server",
      "env": {
        "GMAIL_CREDENTIALS_PATH": "/absolute/path/to/credentials.json",
        "GMAIL_TOKEN_PATH": "/absolute/path/to/token.json"
      }
    }
  }
}
```

### Step 5: Test MCP Server

```bash
# Start Claude Code and test
claude

# In Claude Code:
# "Use the email MCP to send a test email to yourself"
```

## Usage Examples

### Example 1: Send Email After Approval

**Scenario**: Invoice approved, send to client

**Approval File**: `/Approved/EMAIL_invoice_client_a_20260225.md`

```markdown
---
type: approval_request
action: email_send
to: client_a@example.com
subject: January 2026 Invoice - $1,500
approved: 2026-02-25T15:17:00Z
---

## Email Content

Hi Client A,

Please find attached your invoice for January 2026.

Amount: $1,500
Due Date: March 7, 2026

Payment instructions are included in the attached PDF.

Thank you for your business!

Best regards,
[Your Name]

## Attachment

/AI_Employee_Vault/Accounting/Invoices/2026-01_Client_A.pdf

## To Execute

Claude will use email MCP to send this email.
```

**Claude Action**:
```
Use email MCP send_email tool with:
- to: client_a@example.com
- subject: January 2026 Invoice - $1,500
- body: [email content from file]
- attachments: [invoice PDF path]

Log result to /Logs/email_sent_20260225.json
Move approval file to /Done
Update Dashboard.md
```

### Example 2: Create Draft for Review

**Scenario**: New contact, create draft first

```
Create email draft for new_contact@example.com with subject "Introduction" and body from /Plans/PLAN_new_contact_intro.md

Use email MCP create_draft tool
Log draft ID to /Logs
Notify user that draft is ready for review in Gmail
```

### Example 3: Bulk Email (Requires Special Approval)

**Scenario**: Send newsletter to 50 contacts

```
Create approval request for bulk email send
List all recipients in approval file
Require explicit "BULK_SEND_APPROVED" confirmation
Use rate limiting (1 email per 5 seconds)
Log all sends to /Logs/bulk_email_20260225.json
```

## Email Templates

### Template: Invoice Email

```markdown
# /AI_Employee_Vault/Templates/email_invoice.md

Subject: Invoice #{invoice_number} - ${amount}

Hi {client_name},

Please find attached your invoice for {period}.

**Invoice Details:**
- Invoice Number: {invoice_number}
- Amount: ${amount}
- Due Date: {due_date}

Payment instructions are included in the attached PDF.

Thank you for your business!

Best regards,
{sender_name}
```

### Template: Follow-up Email

```markdown
# /AI_Employee_Vault/Templates/email_followup.md

Subject: Following up on {topic}

Hi {recipient_name},

I wanted to follow up on {topic} from our previous conversation.

{custom_message}

Please let me know if you have any questions.

Best regards,
{sender_name}
```

## Approval Workflow Integration

### Known Contacts (Auto-Approve)

Define in `Company_Handbook.md`:

```markdown
## Known Email Contacts (Auto-Approve)

- client_a@example.com
- client_b@example.com
- partner@company.com
```

### New Contacts (Require Approval)

Any email to address not in known contacts list requires approval:

1. Claude creates approval request in /Pending_Approval
2. Human reviews and moves to /Approved
3. Claude sends email via MCP
4. Logs result and moves to /Done

### Approval Thresholds

- **Auto-approve**: Known contacts, routine updates
- **Require approval**: New contacts, sensitive content, attachments over 5MB
- **Always require**: Bulk sends, legal content, financial commitments

## Logging & Tracking

### Email Log Format

```json
// /Logs/email_sent_20260225.json
{
  "timestamp": "2026-02-25T15:17:30Z",
  "action": "email_send",
  "to": "client_a@example.com",
  "subject": "January 2026 Invoice - $1,500",
  "messageId": "18d4f2e3a1b2c3d4",
  "status": "sent",
  "approvedBy": "human",
  "approvalFile": "/Approved/EMAIL_invoice_client_a_20260225.md"
}
```

### Dashboard Update

```markdown
# Dashboard.md

## Recent Email Activity

- [2026-02-25 15:17] Sent invoice to Client A ($1,500)
- [2026-02-25 14:30] Draft created for new contact intro
- [2026-02-25 10:15] Follow-up sent to Client B
```

## Error Handling

### Common Errors

**Error**: Gmail API quota exceeded
- **Solution**: Implement rate limiting, retry after delay

**Error**: Invalid recipient address
- **Solution**: Validate email format before sending

**Error**: Attachment too large
- **Solution**: Compress or use cloud link instead

**Error**: Authentication expired
- **Solution**: Refresh token, re-authorize if needed

### Retry Logic

```python
# In orchestrator or watcher
def send_email_with_retry(email_data, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = mcp_send_email(email_data)
            if result['success']:
                return result
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # Exponential backoff
```

## Security Best Practices

1. **Never log email content** in plain text logs
2. **Encrypt credentials** at rest
3. **Use OAuth tokens**, not passwords
4. **Rotate tokens** every 90 days
5. **Monitor for suspicious activity** (unusual recipients, high volume)
6. **Implement rate limits** to prevent abuse
7. **Require approval** for sensitive emails

## Integration with Other Skills

Works with:
- **approval-workflow**: Manages email approval process
- **vault-manager**: Reads templates and contact lists
- **plan-generator**: Creates email campaign plans
- **linkedin-integration**: Escalates LinkedIn leads to email

## Monitoring

### Check MCP Server Status

```bash
# Test MCP connection
claude --test-mcp email

# View MCP logs
tail -f ~/.claude/logs/mcp_email.log
```

### Email Metrics

Track in `/Logs/email_metrics_2026-02.md`:

```markdown
## February 2026 Email Metrics

- Total sent: 45
- Invoices: 12
- Follow-ups: 18
- New contacts: 8
- Drafts created: 7
- Failed sends: 2 (both resolved)
```

## Future Enhancements (Gold Tier)

- Email template variables and personalization
- Scheduled email sending
- Email thread tracking and auto-replies
- Sentiment analysis on received emails
- Integration with CRM systems
- A/B testing for email campaigns
- Unsubscribe handling for newsletters
