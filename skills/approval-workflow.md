---
name: approval-workflow
description: Human-in-the-loop approval workflow for sensitive actions
version: 1.0.0
---

# Approval Workflow Skill

This skill implements the human-in-the-loop (HITL) pattern for sensitive actions that require explicit human approval before execution.

## Purpose

Prevents the AI Employee from taking risky or irreversible actions without human oversight. All sensitive operations create approval request files that must be manually moved to the /Approved folder.

## When to Use

Use this skill for:
- Sending emails to new contacts
- Making payments over threshold amounts
- Posting to social media
- Deleting or modifying important files
- Any action that could have significant consequences

## Approval Request Format

All approval requests follow this structure:

```markdown
---
type: approval_request
action: [email_send|payment|social_post|file_delete]
created: [ISO timestamp]
expires: [ISO timestamp - 24 hours default]
status: pending
priority: [low|medium|high|critical]
---

## Action Details
[Specific details about what will be done]

## Context
[Why this action is needed]

## To Approve
Move this file to /Approved folder

## To Reject
Move this file to /Rejected folder
```

## Usage Examples

### Example 1: Email to New Contact

When Claude needs to send an email to someone not in the known contacts list:

```
Create approval request for sending email to new_client@example.com with subject "Project Proposal" and body content
```

This creates: `/Pending_Approval/EMAIL_new_client_2026-02-25.md`

### Example 2: Payment Request

When a payment needs to be made:

```
Create approval request for payment of $500 to Client A for Invoice #1234
```

This creates: `/Pending_Approval/PAYMENT_Client_A_2026-02-25.md`

### Example 3: Social Media Post

When posting to LinkedIn:

```
Create approval request for LinkedIn post about new product launch
```

This creates: `/Pending_Approval/LINKEDIN_POST_2026-02-25.md`

## Approval Thresholds

### Auto-Approve (No approval needed)
- Emails to known contacts (in Company_Handbook.md)
- Payments under $50 to recurring payees
- Reading/analyzing data
- Creating draft content

### Requires Approval
- Emails to new contacts
- Payments $50-$500
- Social media posts
- File modifications outside /Needs_Action

### Always Requires Approval
- Payments over $500
- Bulk email sends
- Account deletions
- API key changes
- Any destructive operations

## Workflow Steps

1. **Detection**: Claude identifies a sensitive action is needed
2. **Request Creation**: Create approval file in /Pending_Approval
3. **Human Review**: User reviews the request file
4. **Decision**: User moves file to /Approved or /Rejected
5. **Execution**: Orchestrator detects approved file and triggers action
6. **Logging**: Action result logged to /Logs
7. **Completion**: File moved to /Done

## Security Features

- **Expiration**: Approval requests expire after 24 hours
- **Audit Trail**: All approvals logged with timestamp and user
- **No Auto-Approval**: System never bypasses approval for flagged actions
- **Clear Context**: Each request includes full context for informed decision

## Integration with Other Skills

This skill works with:
- **vault-manager**: For file operations
- **email-sender**: For email actions
- **linkedin-integration**: For social posts
- **payment-handler**: For financial transactions

## Commands

### Create Approval Request
```
Create approval request for [action_type] with details: [details]
```

### Check Pending Approvals
```
List all files in /Pending_Approval and summarize what's waiting
```

### Process Approved Actions
```
Check /Approved folder and execute approved actions
```

### Review Rejected Actions
```
Check /Rejected folder and log why actions were rejected
```

## Error Handling

- If approval expires: Move to /Rejected with reason "Expired"
- If action fails after approval: Log error, notify human
- If approval file is malformed: Move to /Rejected with reason "Invalid format"

## Best Practices

1. Always provide clear context in approval requests
2. Include relevant data (amounts, recipients, content)
3. Set appropriate expiration times
4. Log all approval decisions
5. Never bypass approval for convenience
6. Review approval thresholds monthly
