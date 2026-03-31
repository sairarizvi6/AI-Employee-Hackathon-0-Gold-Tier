---
type: email_approval
action: send_email
approved: true
to: recipient@example.com
subject: Test Email from Auto-Sender
---

# Email Approval Template

This is a template for email approval files that the auto-sender will process.

## Email Content

To: recipient@example.com
Subject: Test Email from Auto-Sender

Hello,

This is a test email sent automatically by the Email Auto-Sender service when this file is moved to the /Approved folder.

The auto-sender watches the /Approved folder and automatically:
1. Detects new .md files
2. Parses the frontmatter for email details
3. Sends the email via Gmail API
4. Logs the result to /Logs
5. Moves the file to /Done

Best regards,
AI Employee

---

## Instructions

To use this template:
1. Copy this file to /Pending_Approval
2. Edit the email details (to, subject, body)
3. Set approved: true in frontmatter
4. Move to /Approved folder
5. Auto-sender will process it automatically

## Frontmatter Fields

- `type`: Must be "email_approval"
- `action`: Must be "send_email"
- `approved`: Must be true to send
- `to`: Recipient email address (required)
- `subject`: Email subject (required)
- `cc`: CC recipients (optional)
- `bcc`: BCC recipients (optional)
- `body`: Can be in frontmatter or in content below
