---
name: vault-manager
description: Manage AI Employee Vault - read from and write to Obsidian vault folders
version: 1.0.0
---

# Vault Manager Skill

This skill helps Claude Code interact with the AI Employee Obsidian vault efficiently.

## Usage

Use this skill to:
- Read files from the vault
- Write updates to Dashboard.md
- Move files between folders (Needs_Action → Done)
- Create new action items
- Update task status

## Commands

### Read Dashboard
```
Read the current dashboard status
```

### Process Needs_Action
```
Check /Needs_Action folder and process pending items
```

### Update Dashboard
```
Update Dashboard.md with new activity
```

### Move to Done
```
Move completed task files to /Done folder
```

## Vault Structure

- `/Needs_Action` - New items requiring attention
- `/Done` - Completed tasks
- `/Plans` - Task plans and strategies
- `/Pending_Approval` - Items awaiting human approval
- `/Approved` - Human-approved actions
- `/Rejected` - Rejected actions
- `/Logs` - System logs
- `/Accounting` - Financial records
- `/Briefings` - Weekly/monthly reports

## Examples

**Example 1: Check for new tasks**
```
Read all files in AI_Employee_Vault/Needs_Action and summarize what needs attention
```

**Example 2: Complete a task**
```
Move EMAIL_20260222_*.md from Needs_Action to Done and update Dashboard.md
```

**Example 3: Create approval request**
```
Create an approval request in Pending_Approval for sending an email to a new contact
```
