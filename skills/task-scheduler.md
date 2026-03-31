---
name: task-scheduler
description: Schedule and automate periodic tasks using cron or Task Scheduler
version: 1.0.0
---

# Task Scheduler Skill

This skill enables the AI Employee to run scheduled tasks automatically using cron (Linux/Mac) or Task Scheduler (Windows) for periodic operations.

## Purpose

Automates recurring tasks such as:
- Daily CEO briefings
- Weekly business audits
- Periodic data backups
- Scheduled social media posts
- Regular vault maintenance
- Automated report generation

## Architecture

Uses platform-specific scheduling:
- **Linux/Mac**: cron jobs
- **Windows**: Task Scheduler
- **Cross-platform**: Python schedule library as fallback

## Prerequisites

1. **For Windows**:
   - Task Scheduler (built-in)
   - PowerShell access

2. **For Linux/Mac**:
   - cron daemon (usually pre-installed)
   - Bash access

3. **Python Scheduler (Optional)**:
   ```bash
   cd watchers
   uv add schedule
   ```

## Implementation

### Python Scheduler (Cross-Platform)

```python
# watchers/src/watchers/task_scheduler.py
import schedule
import time
import subprocess
from pathlib import Path
from datetime import datetime
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('TaskScheduler')

class TaskScheduler:
    def __init__(self, vault_path: str):
        self.vault_path = Path(vault_path)
        self.scheduled_tasks_file = self.vault_path / 'Config' / 'scheduled_tasks.json'

    def run_claude_task(self, task_name: str, prompt: str):
        """Execute a Claude Code task"""
        logger.info(f'Running scheduled task: {task_name}')

        try:
            # Create task file in vault
            task_file = self.vault_path / 'Scheduled_Tasks' / f'{task_name}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.md'
            task_file.parent.mkdir(exist_ok=True)

            task_content = f"""---
type: scheduled_task
task_name: {task_name}
created: {datetime.now().isoformat()}
status: pending
---

## Task Prompt

{prompt}

## Execution Log

Task triggered by scheduler at {datetime.now().isoformat()}
"""
            task_file.write_text(task_content, encoding='utf-8')

            # Trigger Claude Code via orchestrator
            result = subprocess.run(
                ['python', 'orchestrator.py', '--process-scheduled-tasks'],
                cwd=self.vault_path.parent / 'watchers',
                capture_output=True,
                text=True,
                timeout=300
            )

            logger.info(f'Task {task_name} completed with status: {result.returncode}')
            return result.returncode == 0

        except Exception as e:
            logger.error(f'Error running task {task_name}: {e}')
            return False

    def schedule_daily_briefing(self):
        """Schedule daily CEO briefing at 8:00 AM"""
        def job():
            self.run_claude_task(
                'daily_briefing',
                'Generate Monday morning CEO briefing. Read Business_Goals.md, analyze /Done tasks from past 7 days, calculate revenue from /Accounting, identify bottlenecks, and create briefing in /Briefings folder.'
            )

        schedule.every().day.at("08:00").do(job)
        logger.info('Scheduled: Daily briefing at 08:00')

    def schedule_weekly_audit(self):
        """Schedule weekly business audit on Sundays at 20:00"""
        def job():
            self.run_claude_task(
                'weekly_audit',
                'Perform weekly business audit. Review all transactions, check subscription costs, analyze task completion rates, compare against Business_Goals.md targets, and generate comprehensive report.'
            )

        schedule.every().sunday.at("20:00").do(job)
        logger.info('Scheduled: Weekly audit on Sundays at 20:00')

    def schedule_linkedin_posts(self):
        """Schedule LinkedIn post checks every 4 hours"""
        def job():
            self.run_claude_task(
                'linkedin_post_check',
                'Check /Approved folder for LinkedIn posts ready to publish. Use linkedin-integration skill to post approved content.'
            )

        schedule.every(4).hours.do(job)
        logger.info('Scheduled: LinkedIn post check every 4 hours')

    def schedule_vault_cleanup(self):
        """Schedule vault cleanup daily at 23:00"""
        def job():
            self.run_claude_task(
                'vault_cleanup',
                'Clean up vault: archive old files from /Done (>30 days) to /Archive, compress old logs, remove expired approval requests, update Dashboard.md statistics.'
            )

        schedule.every().day.at("23:00").do(job)
        logger.info('Scheduled: Vault cleanup at 23:00')

    def schedule_backup(self):
        """Schedule daily backup at 02:00 AM"""
        def job():
            logger.info('Running vault backup')
            try:
                backup_dir = self.vault_path.parent / 'Backups'
                backup_dir.mkdir(exist_ok=True)

                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_file = backup_dir / f'vault_backup_{timestamp}.tar.gz'

                subprocess.run(
                    ['tar', '-czf', str(backup_file), '-C', str(self.vault_path.parent), self.vault_path.name],
                    check=True
                )

                logger.info(f'Backup created: {backup_file}')

                # Keep only last 7 backups
                backups = sorted(backup_dir.glob('vault_backup_*.tar.gz'))
                for old_backup in backups[:-7]:
                    old_backup.unlink()
                    logger.info(f'Removed old backup: {old_backup}')

            except Exception as e:
                logger.error(f'Backup failed: {e}')

        schedule.every().day.at("02:00").do(job)
        logger.info('Scheduled: Daily backup at 02:00')

    def run(self):
        """Start the scheduler"""
        logger.info('Starting Task Scheduler')

        # Register all scheduled tasks
        self.schedule_daily_briefing()
        self.schedule_weekly_audit()
        self.schedule_linkedin_posts()
        self.schedule_vault_cleanup()
        self.schedule_backup()

        # Run scheduler loop
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute


if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print('Usage: python task_scheduler.py <vault_path>')
        sys.exit(1)

    vault_path = sys.argv[1]
    scheduler = TaskScheduler(vault_path)
    scheduler.run()
```

### Windows Task Scheduler Setup

```powershell
# setup_windows_scheduler.ps1
# Run as Administrator

$VaultPath = "D:\AI-Employee-Hackathon-0\AI_Employee_Vault"
$WatchersPath = "D:\AI-Employee-Hackathon-0\watchers"

# Daily CEO Briefing at 8:00 AM
$Action = New-ScheduledTaskAction -Execute "uv" -Argument "run python src/watchers/task_scheduler.py $VaultPath" -WorkingDirectory $WatchersPath
$Trigger = New-ScheduledTaskTrigger -Daily -At 8:00AM
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable
Register-ScheduledTask -TaskName "AI_Employee_Daily_Briefing" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Generate daily CEO briefing"

# Weekly Audit on Sundays at 8:00 PM
$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 8:00PM
Register-ScheduledTask -TaskName "AI_Employee_Weekly_Audit" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Perform weekly business audit"

# LinkedIn Post Check every 4 hours
$Trigger = New-ScheduledTaskTrigger -Once -At 12:00AM -RepetitionInterval (New-TimeSpan -Hours 4) -RepetitionDuration (New-TimeSpan -Days 365)
Register-ScheduledTask -TaskName "AI_Employee_LinkedIn_Posts" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Check and publish LinkedIn posts"

# Vault Cleanup daily at 11:00 PM
$Trigger = New-ScheduledTaskTrigger -Daily -At 11:00PM
Register-ScheduledTask -TaskName "AI_Employee_Vault_Cleanup" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Clean up and archive old vault files"

# Daily Backup at 2:00 AM
$Trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
Register-ScheduledTask -TaskName "AI_Employee_Backup" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Backup vault data"

Write-Host "All scheduled tasks created successfully!"
Write-Host "View tasks: Get-ScheduledTask | Where-Object {$_.TaskName -like 'AI_Employee*'}"
```

### Linux/Mac Cron Setup

```bash
# setup_cron.sh
#!/bin/bash

VAULT_PATH="/path/to/AI_Employee_Vault"
WATCHERS_PATH="/path/to/watchers"

# Create cron jobs file
cat > /tmp/ai_employee_cron << EOF
# AI Employee Scheduled Tasks

# Daily CEO Briefing at 8:00 AM
0 8 * * * cd $WATCHERS_PATH && uv run python src/watchers/task_scheduler.py $VAULT_PATH --task daily_briefing >> /tmp/ai_employee_briefing.log 2>&1

# Weekly Audit on Sundays at 8:00 PM
0 20 * * 0 cd $WATCHERS_PATH && uv run python src/watchers/task_scheduler.py $VAULT_PATH --task weekly_audit >> /tmp/ai_employee_audit.log 2>&1

# LinkedIn Post Check every 4 hours
0 */4 * * * cd $WATCHERS_PATH && uv run python src/watchers/task_scheduler.py $VAULT_PATH --task linkedin_posts >> /tmp/ai_employee_linkedin.log 2>&1

# Vault Cleanup daily at 11:00 PM
0 23 * * * cd $WATCHERS_PATH && uv run python src/watchers/task_scheduler.py $VAULT_PATH --task vault_cleanup >> /tmp/ai_employee_cleanup.log 2>&1

# Daily Backup at 2:00 AM
0 2 * * * cd $WATCHERS_PATH && uv run python src/watchers/task_scheduler.py $VAULT_PATH --task backup >> /tmp/ai_employee_backup.log 2>&1

EOF

# Install cron jobs
crontab /tmp/ai_employee_cron
echo "Cron jobs installed successfully!"
echo "View with: crontab -l"
```

## Setup Instructions

### Option 1: Python Scheduler (Recommended for Development)

```bash
cd watchers
uv add schedule

# Run scheduler in background
pm2 start "uv run python src/watchers/task_scheduler.py ../AI_Employee_Vault" --name task-scheduler

# Or using nohup
nohup uv run python src/watchers/task_scheduler.py ../AI_Employee_Vault > scheduler.log 2>&1 &
```

### Option 2: Windows Task Scheduler

```powershell
# Run PowerShell as Administrator
cd D:\AI-Employee-Hackathon-0

# Edit paths in setup_windows_scheduler.ps1
# Then run:
.\setup_windows_scheduler.ps1

# Verify tasks
Get-ScheduledTask | Where-Object {$_.TaskName -like 'AI_Employee*'}
```

### Option 3: Linux/Mac Cron

```bash
# Edit paths in setup_cron.sh
chmod +x setup_cron.sh
./setup_cron.sh

# Verify cron jobs
crontab -l
```

## Scheduled Task Definitions

### Daily CEO Briefing (8:00 AM)

**Purpose**: Start each day with business overview

**Actions**:
- Read Business_Goals.md for targets
- Analyze completed tasks from past 7 days
- Calculate revenue from /Accounting
- Identify bottlenecks and delays
- Generate briefing in /Briefings folder
- Update Dashboard.md

**Output**: `/Briefings/YYYY-MM-DD_Daily_Briefing.md`

### Weekly Business Audit (Sunday 8:00 PM)

**Purpose**: Comprehensive weekly review

**Actions**:
- Review all transactions for the week
- Analyze subscription costs
- Check task completion rates
- Compare against Business_Goals.md targets
- Identify optimization opportunities
- Generate detailed report

**Output**: `/Briefings/YYYY-MM-DD_Weekly_Audit.md`

### LinkedIn Post Check (Every 4 hours)

**Purpose**: Publish approved LinkedIn posts

**Actions**:
- Check /Approved folder for LINKEDIN_POST_* files
- Use linkedin-integration skill to publish
- Log results to /Logs
- Move completed posts to /Done

**Output**: Posts published to LinkedIn

### Vault Cleanup (Daily 11:00 PM)

**Purpose**: Maintain vault organization

**Actions**:
- Archive files from /Done older than 30 days
- Compress old log files
- Remove expired approval requests
- Update Dashboard.md statistics
- Generate cleanup report

**Output**: `/Logs/vault_cleanup_YYYY-MM-DD.json`

### Daily Backup (2:00 AM)

**Purpose**: Protect against data loss

**Actions**:
- Create compressed backup of entire vault
- Store in /Backups folder
- Keep only last 7 backups
- Log backup status

**Output**: `/Backups/vault_backup_YYYYMMDD_HHMMSS.tar.gz`

## Custom Task Configuration

### Define Custom Schedule

Create `/AI_Employee_Vault/Config/scheduled_tasks.json`:

```json
{
  "tasks": [
    {
      "name": "monthly_report",
      "schedule": "0 9 1 * *",
      "description": "Generate monthly business report",
      "prompt": "Create comprehensive monthly report including revenue, expenses, completed projects, and goals progress. Save to /Reports folder.",
      "enabled": true
    },
    {
      "name": "client_followup",
      "schedule": "0 10 * * 1",
      "description": "Check for clients needing follow-up",
      "prompt": "Review /Done folder for completed projects. Identify clients who haven't been contacted in 14+ days. Create follow-up tasks in /Needs_Action.",
      "enabled": true
    },
    {
      "name": "invoice_reminders",
      "schedule": "0 9 * * *",
      "description": "Send reminders for overdue invoices",
      "prompt": "Check /Accounting for invoices past due date. Create reminder emails in /Pending_Approval for invoices overdue by 7+ days.",
      "enabled": true
    }
  ]
}
```

### Cron Schedule Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)

Examples:
0 8 * * *       - Daily at 8:00 AM
0 */4 * * *     - Every 4 hours
0 9 * * 1       - Every Monday at 9:00 AM
0 0 1 * *       - First day of month at midnight
*/15 * * * *    - Every 15 minutes
```

## Monitoring Scheduled Tasks

### Check Task Status

```bash
# Python scheduler (PM2)
pm2 status task-scheduler
pm2 logs task-scheduler

# Windows Task Scheduler
Get-ScheduledTask -TaskName "AI_Employee*" | Get-ScheduledTaskInfo

# Linux/Mac Cron
grep CRON /var/log/syslog | tail -20
```

### Task Execution Logs

```markdown
# /Logs/scheduled_tasks_2026-02-25.json

{
  "date": "2026-02-25",
  "tasks": [
    {
      "name": "daily_briefing",
      "scheduled_time": "08:00:00",
      "actual_time": "08:00:03",
      "status": "completed",
      "duration_seconds": 45,
      "output_file": "/Briefings/2026-02-25_Daily_Briefing.md"
    },
    {
      "name": "linkedin_posts",
      "scheduled_time": "12:00:00",
      "actual_time": "12:00:01",
      "status": "completed",
      "duration_seconds": 12,
      "posts_published": 2
    }
  ]
}
```

## Error Handling

### Failed Task Recovery

```python
def run_with_retry(task_func, max_retries=3):
    """Run task with retry logic"""
    for attempt in range(max_retries):
        try:
            return task_func()
        except Exception as e:
            logger.error(f'Task failed (attempt {attempt + 1}): {e}')
            if attempt == max_retries - 1:
                # Send notification
                notify_human(f'Task failed after {max_retries} attempts: {e}')
                raise
            time.sleep(60 * (attempt + 1))  # Exponential backoff
```

### Missed Task Handling

```python
# In scheduler
schedule.every().day.at("08:00").do(job).tag('daily-briefing')

# Check for missed runs
last_run = get_last_run_time('daily-briefing')
if datetime.now() - last_run > timedelta(hours=25):
    logger.warning('Daily briefing missed, running now')
    job()
```

## Integration with Other Skills

Works with:
- **plan-generator**: Creates scheduled task plans
- **approval-workflow**: Some scheduled tasks may need approval
- **vault-manager**: Manages scheduled task files
- **email-sender**: Can send scheduled emails
- **linkedin-integration**: Schedules social posts

## Best Practices

1. **Stagger Tasks**: Don't schedule multiple heavy tasks at same time
2. **Off-Peak Hours**: Run intensive tasks during low-activity periods
3. **Logging**: Always log task execution for debugging
4. **Notifications**: Alert on task failures
5. **Testing**: Test schedules in development first
6. **Monitoring**: Regularly review task execution logs
7. **Maintenance**: Update schedules as business needs change

## Security Considerations

- **Permissions**: Ensure scheduler has minimal required permissions
- **Credentials**: Don't hardcode credentials in task scripts
- **Logging**: Don't log sensitive data in task logs
- **Isolation**: Run tasks in isolated environment when possible

## Future Enhancements (Gold Tier)

- Dynamic schedule adjustment based on workload
- Task dependency management
- Parallel task execution
- Task priority queuing
- Web dashboard for schedule management
- Slack/email notifications for task completion
- Task performance analytics
