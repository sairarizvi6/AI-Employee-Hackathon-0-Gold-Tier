---
name: plan-generator
description: Generate structured Plan.md files for multi-step tasks with reasoning and checkboxes
version: 1.0.0
---

# Plan Generator Skill

This skill implements Claude's reasoning loop to break down complex tasks into actionable plans with clear steps and checkboxes.

## Purpose

Transforms vague or complex requests into structured, executable plans that can be tracked and completed systematically. Essential for the AI Employee to handle multi-step workflows autonomously.

## When to Use

Use this skill when:
- A task requires multiple steps to complete
- The approach needs to be documented before execution
- Human review of the strategy is needed
- Task complexity requires breaking down into subtasks
- Coordination between multiple actions is required

## Plan File Format

All plans follow this structure:

```markdown
---
type: plan
created: [ISO timestamp]
updated: [ISO timestamp]
status: [draft|in_progress|completed|blocked]
priority: [low|medium|high|critical]
estimated_time: [minutes]
requires_approval: [true|false]
---

## Objective
[Clear statement of what needs to be accomplished]

## Context
[Background information, why this task exists]

## Analysis
[Claude's reasoning about the task]
- Key considerations
- Potential challenges
- Dependencies identified

## Steps
- [ ] Step 1: [Actionable task with clear outcome]
- [ ] Step 2: [Next task]
- [ ] Step 3: [Subsequent task]
- [ ] Step 4: [Final task]

## Success Criteria
- [How to know the task is complete]
- [Expected outcomes]

## Risks & Mitigations
- Risk: [Potential issue]
  - Mitigation: [How to handle it]

## Resources Needed
- [Files, APIs, or tools required]

## Notes
[Additional context or observations]
```

## Usage Examples

### Example 1: Email Response Plan

Input: "Client A sent an email asking for invoice and project update"

Creates: `/Plans/PLAN_client_a_response_2026-02-25.md`

```markdown
---
type: plan
created: 2026-02-25T15:14:00Z
status: draft
priority: high
estimated_time: 30
requires_approval: true
---

## Objective
Respond to Client A with invoice and project status update

## Context
Client A emailed requesting January invoice and asking about Project Alpha progress

## Analysis
- Invoice needs to be generated from /Accounting/Rates.md
- Project status available in /Done folder
- Client A is known contact (no approval needed for email)
- Invoice amount over $100 (requires approval)

## Steps
- [ ] Calculate invoice amount from time logs
- [ ] Generate invoice PDF in /Accounting/Invoices
- [ ] Draft project status summary from completed tasks
- [ ] Create approval request for invoice send
- [ ] Wait for approval
- [ ] Send email with invoice and update
- [ ] Log transaction in /Accounting
- [ ] Move task to /Done

## Success Criteria
- Email sent with invoice attached
- Project update included
- Transaction logged
- Client A marked as contacted in Dashboard

## Risks & Mitigations
- Risk: Invoice amount calculation error
  - Mitigation: Cross-reference with Business_Goals.md rates
- Risk: Missing project details
  - Mitigation: Review all /Done tasks from past 30 days

## Resources Needed
- /Accounting/Rates.md
- /Done folder (past 30 days)
- Email MCP server
- Invoice template

## Notes
Client A typically responds within 24 hours. Follow up if no response by 2026-02-27.
```

### Example 2: Weekly Business Audit Plan

Input: "Generate Monday morning CEO briefing"

Creates: `/Plans/PLAN_weekly_audit_2026-02-25.md`

```markdown
---
type: plan
created: 2026-02-25T15:14:00Z
status: in_progress
priority: medium
estimated_time: 45
requires_approval: false
---

## Objective
Generate comprehensive weekly business briefing for CEO review

## Context
Weekly audit scheduled every Monday at 8 AM to summarize business performance

## Analysis
- Need to analyze /Done tasks from past 7 days
- Review /Accounting transactions for revenue
- Check /Needs_Action for bottlenecks
- Identify subscription costs from bank transactions
- Compare against Business_Goals.md targets

## Steps
- [ ] Read Business_Goals.md for current targets
- [ ] Scan /Done folder for completed tasks (past 7 days)
- [ ] Calculate revenue from /Accounting/Current_Month.md
- [ ] Identify delayed tasks (expected vs actual time)
- [ ] Analyze subscription patterns in transactions
- [ ] Generate proactive suggestions
- [ ] Write briefing to /Briefings/2026-02-25_Monday_Briefing.md
- [ ] Update Dashboard.md with briefing link

## Success Criteria
- Briefing includes revenue, completed tasks, bottlenecks
- Proactive suggestions provided
- Comparison to targets included
- File created in /Briefings

## Risks & Mitigations
- Risk: Incomplete transaction data
  - Mitigation: Note data gaps in briefing
- Risk: Misidentified subscriptions
  - Mitigation: Flag uncertain items for human review

## Resources Needed
- Business_Goals.md
- /Done folder
- /Accounting/Current_Month.md
- /Needs_Action folder

## Notes
This is a recurring task. Consider automating via cron after validation.
```

### Example 3: LinkedIn Post Campaign Plan

Input: "Create LinkedIn posts to generate sales leads"

Creates: `/Plans/PLAN_linkedin_campaign_2026-02-25.md`

```markdown
---
type: plan
created: 2026-02-25T15:14:00Z
status: draft
priority: medium
estimated_time: 60
requires_approval: true
---

## Objective
Create and schedule LinkedIn posts to generate business leads

## Context
Silver Tier requirement: Automatically post on LinkedIn about business to generate sales

## Analysis
- Need to review Business_Goals.md for key offerings
- Posts should highlight value propositions
- Requires approval before posting (social media policy)
- Should schedule 3-5 posts over next week
- Include call-to-action in each post

## Steps
- [ ] Read Business_Goals.md and Company_Handbook.md
- [ ] Identify 3 key value propositions
- [ ] Draft 3 LinkedIn posts (150-200 words each)
- [ ] Add relevant hashtags and CTAs
- [ ] Create approval requests in /Pending_Approval
- [ ] Wait for human approval
- [ ] Schedule posts via LinkedIn MCP
- [ ] Log scheduled posts in /Logs
- [ ] Move plan to /Done

## Success Criteria
- 3 posts drafted and approved
- Posts scheduled for different days/times
- Each post includes CTA
- Tracking enabled for engagement

## Risks & Mitigations
- Risk: Posts sound too promotional
  - Mitigation: Focus on value and education
- Risk: Wrong tone for audience
  - Mitigation: Review Company_Handbook.md voice guidelines

## Resources Needed
- Business_Goals.md
- Company_Handbook.md
- LinkedIn MCP server
- approval-workflow skill

## Notes
Monitor engagement after first post. Adjust strategy if needed.
```

## Plan Status Workflow

1. **draft**: Plan created, awaiting review
2. **in_progress**: Plan approved, execution started
3. **blocked**: Waiting on external dependency or approval
4. **completed**: All steps checked off, moved to /Done

## Integration with Task Execution

Plans work with the "Ralph Wiggum" loop pattern:

1. Plan created in /Plans
2. Claude reads plan and starts execution
3. Checks off steps as completed
4. If blocked, updates status and waits
5. When all steps complete, moves to /Done
6. Updates Dashboard.md with completion

## Commands

### Generate Plan
```
Create a plan for [task description] in /Plans folder
```

### Review Plan
```
Read plan [filename] and summarize current status
```

### Execute Plan
```
Execute plan [filename] step by step, checking off completed items
```

### Update Plan Status
```
Update plan [filename] status to [in_progress|blocked|completed]
```

## Best Practices

1. Break complex tasks into 5-10 clear steps
2. Make each step actionable and verifiable
3. Include time estimates for planning
4. Identify approval requirements upfront
5. Document risks and mitigations
6. Update plans as execution progresses
7. Archive completed plans to /Done

## Error Handling

- If step fails: Update plan with error note, mark as blocked
- If approval denied: Move plan to /Rejected with reason
- If plan becomes obsolete: Archive with "superseded" note
- If dependencies missing: Mark as blocked, list requirements
