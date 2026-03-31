# Email Auto-Sender Service

Automatically detects and sends approved emails from the `/Approved` folder.

## Overview

The Email Auto-Sender is a standalone service that watches the `/Approved` folder for email approval files and automatically sends them via Gmail API.

## Features

- **Automatic Detection**: Watches `/Approved` folder for new .md files
- **Smart Parsing**: Extracts email details from frontmatter or content
- **Gmail Integration**: Sends emails via Gmail API
- **Automatic Logging**: Logs all sent emails to `/Logs`
- **File Management**: Moves processed files to `/Done`
- **Error Handling**: Logs errors and keeps failed files for review

## Installation

Dependencies are already installed:
```bash
npm install chokidar gray-matter
```

## Usage

### Start the Auto-Sender Service

```bash
cd email-mcp-server
node auto-sender.js
```

Or using npm script:
```bash
npm run auto-sender
```

### Run in Background with PM2

```bash
pm2 start "node auto-sender.js" --name email-auto-sender --cwd email-mcp-server
pm2 save
```

## Email Approval File Format

### Option 1: Frontmatter Only

```markdown
---
type: email_approval
action: send_email
approved: true
to: client@example.com
subject: Invoice for January 2026
cc: manager@example.com
body: |
  Hi Client,

  Please find attached your invoice for January 2026.

  Best regards,
  Your Company
---
```

### Option 2: Frontmatter + Content

```markdown
---
type: email_approval
action: send_email
approved: true
to: client@example.com
subject: Invoice for January 2026
---

Hi Client,

Please find attached your invoice for January 2026.

Amount: $1,500
Due Date: March 7, 2026

Best regards,
Your Company
```

### Option 3: Content Only (with headers)

```markdown
---
type: email_approval
action: send_email
approved: true
---

To: client@example.com
Subject: Invoice for January 2026
CC: manager@example.com

Hi Client,

Please find attached your invoice for January 2026.

Best regards,
Your Company
```

## Workflow

1. **Create Approval File**: Claude creates email approval in `/Pending_Approval`
2. **Human Review**: Review the email content
3. **Approve**: Move file to `/Approved` folder
4. **Auto-Send**: Auto-sender detects file and sends email
5. **Log**: Result logged to `/Logs`
6. **Archive**: File moved to `/Done`

## Example Workflow

### Step 1: Claude Creates Approval Request

```bash
# In Claude Code
"Create an email approval for sending invoice to client@example.com"
```

Claude creates: `/Pending_Approval/EMAIL_APPROVAL_invoice_client_20260225.md`

### Step 2: Human Reviews and Approves

```bash
# Review the file
cat AI_Employee_Vault/Pending_Approval/EMAIL_APPROVAL_invoice_client_20260225.md

# Approve by moving to Approved folder
mv AI_Employee_Vault/Pending_Approval/EMAIL_APPROVAL_invoice_client_20260225.md AI_Employee_Vault/Approved/
```

### Step 3: Auto-Sender Processes

```
📧 Processing: EMAIL_APPROVAL_invoice_client_20260225.md
   To: client@example.com
   Subject: Invoice for January 2026
✅ Email sent successfully!
   Message ID: 18d4f2e3a1b2c3d4
   Moved to: /Done/EMAIL_APPROVAL_invoice_client_20260225.md
```

## Logging

### Success Log

```json
{
  "timestamp": "2026-02-25T21:58:50.194Z",
  "action": "email_sent",
  "file": "EMAIL_APPROVAL_invoice_client_20260225.md",
  "to": "client@example.com",
  "subject": "Invoice for January 2026",
  "messageId": "18d4f2e3a1b2c3d4",
  "status": "success"
}
```

### Error Log

```json
{
  "timestamp": "2026-02-25T21:58:50.194Z",
  "action": "email_failed",
  "file": "EMAIL_APPROVAL_test_20260225.md",
  "to": "invalid@email",
  "subject": "Test",
  "error": "Invalid recipient address",
  "status": "failed"
}
```

## Configuration

### Environment Variables

```bash
# Optional - defaults to these paths
export GMAIL_TOKEN_PATH="/path/to/token.json"
export GMAIL_CREDENTIALS_PATH="/path/to/credentials.json"
export VAULT_PATH="/path/to/AI_Employee_Vault"
```

### Folder Structure

```
AI_Employee_Vault/
├── Pending_Approval/    # Human reviews here
├── Approved/            # Auto-sender watches this
├── Done/                # Processed files moved here
├── Logs/                # Email logs stored here
└── Templates/           # Email templates
```

## Monitoring

### Check Service Status

```bash
# If running with PM2
pm2 status email-auto-sender
pm2 logs email-auto-sender

# If running directly
# Check console output
```

### View Logs

```bash
# View recent email logs
ls -lt AI_Employee_Vault/Logs/email_*.json | head -10

# View specific log
cat AI_Employee_Vault/Logs/email_sent_2026-02-25T21-58-50-194Z.json
```

## Troubleshooting

### Auto-sender not detecting files

- Check that service is running: `pm2 status email-auto-sender`
- Verify folder path is correct
- Check file permissions on /Approved folder
- Ensure files have .md extension

### Emails not sending

- Check Gmail API credentials are valid
- Verify token.json exists and is valid
- Check email format in approval file
- Review error logs in /Logs folder

### Files not moving to /Done

- Check file permissions on /Done folder
- Verify frontmatter has `approved: true`
- Check that email was sent successfully

## Integration with Claude Code

Claude can create approval files automatically:

```
"Create an email approval for client@example.com with subject 'Invoice' and body 'Please find attached invoice'"
```

Claude will:
1. Create file in `/Pending_Approval`
2. Format with proper frontmatter
3. Wait for human approval
4. Auto-sender handles the rest

## Security

- **OAuth Authentication**: Uses secure OAuth 2.0 tokens
- **Human Approval Required**: No emails sent without approval
- **Audit Trail**: All emails logged with timestamps
- **Error Handling**: Failed sends logged but not retried automatically

## Performance

- **File Detection**: ~2 seconds after file appears
- **Processing Time**: ~1-2 seconds per email
- **Concurrent Processing**: Prevents duplicate sends
- **Resource Usage**: Minimal CPU/memory footprint

## Comparison: Manual vs Auto-Sender

| Feature | Manual Process | Auto-Sender |
|---------|---------------|-------------|
| Detection | Manual check | Automatic |
| Processing | Run script manually | Automatic |
| Logging | Manual | Automatic |
| File Management | Manual move | Automatic |
| Error Handling | Manual retry | Logged for review |
| Speed | Slow | Instant |

## Next Steps

1. Start the auto-sender service
2. Create a test approval file
3. Move it to /Approved
4. Verify email is sent
5. Check logs in /Logs
6. Integrate with Claude workflows

---

**Status**: Ready to Use ✅
**Dependencies**: chokidar, gray-matter, googleapis
**Date**: 2026-02-25
