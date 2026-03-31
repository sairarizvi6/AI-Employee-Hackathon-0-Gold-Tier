# 🚀 Gold Tier Setup Guide

## Quick Start (30 Minutes)

This guide will get your Gold Tier AI Employee up and running in 30 minutes.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Docker Desktop installed and running
- [ ] Node.js v24+ installed
- [ ] Python 3.13+ installed
- [ ] Claude Code installed and configured
- [ ] Git installed
- [ ] 20GB free disk space
- [ ] Stable internet connection

---

## Step-by-Step Setup

### 1. Start Odoo (5 minutes)

```bash
# Navigate to project root
cd AI-Employee-Hackathon-0-Gold-Tier

# Start Odoo with Docker Compose
docker-compose up -d

# Wait for initialization (2-3 minutes)
# Check logs
docker-compose logs -f odoo
# Press Ctrl+C when you see "odoo.service.server: HTTP service (werkzeug) running on"
```

**Configure Odoo**:
1. Open browser: http://localhost:8069
2. Click "Create Database"
3. Fill in:
   - Database Name: `odoo`
   - Email: `admin@example.com`
   - Password: `admin`
   - Language: English
   - Country: Your country
   - Demo data: Uncheck
4. Click "Create Database"
5. Wait 2-3 minutes for setup

**Install Required Modules**:
1. Go to Apps menu
2. Remove "Apps" filter
3. Install:
   - Accounting
   - Invoicing
   - Contacts
   - Sales

### 2. Setup MCP Servers (5 minutes)

**Odoo MCP Server**:
```bash
cd odoo-mcp-server
npm install
cp .env.example .env

# Edit .env (use your favorite editor)
# Set:
# ODOO_URL=http://localhost:8069
# ODOO_DB=odoo
# ODOO_USERNAME=admin
# ODOO_PASSWORD=admin
```

**Email MCP Server** (if not already done):
```bash
cd ../AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/email-mcp-server
npm install
```

### 3. Configure Claude Code (3 minutes)

**Windows**: Edit `%USERPROFILE%\.claude\mcp_settings.json`
**Mac/Linux**: Edit `~/.claude/mcp_settings.json`

```json
{
  "mcpServers": {
    "email": {
      "command": "node",
      "args": ["C:/absolute/path/to/email-mcp-server/index.js"],
      "env": {
        "GMAIL_CREDENTIALS": "C:/path/to/credentials.json"
      }
    },
    "odoo": {
      "command": "node",
      "args": ["C:/absolute/path/to/odoo-mcp-server/index.js"],
      "env": {
        "ODOO_URL": "http://localhost:8069",
        "ODOO_DB": "odoo",
        "ODOO_USERNAME": "admin",
        "ODOO_PASSWORD": "admin"
      }
    }
  }
}
```

**Important**: Use absolute paths, not relative!

### 4. Install Python Dependencies (2 minutes)

```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers
uv sync
```

### 5. Setup Social Media Sessions (10 minutes)

**Create session folders**:
```bash
mkdir -p facebook_session instagram_session twitter_session
```

**Facebook Login**:
```bash
# Edit src/watchers/facebook_watcher.py
# Line ~35: Change headless=True to headless=False

uv run python src/watchers/facebook_watcher.py ../AI_Employee_Vault facebook_session

# Browser opens:
# 1. Login to Facebook
# 2. Complete any security checks
# 3. Wait for feed to load
# 4. Press Ctrl+C

# Change back to headless=True
```

**Instagram Login**:
```bash
# Edit src/watchers/instagram_watcher.py
# Line ~35: Change headless=True to headless=False

uv run python src/watchers/instagram_watcher.py ../AI_Employee_Vault instagram_session

# Browser opens:
# 1. Login to Instagram
# 2. Complete any security checks
# 3. Wait for feed to load
# 4. Press Ctrl+C

# Change back to headless=True
```

**Twitter Login**:
```bash
# Edit src/watchers/twitter_watcher.py
# Line ~35: Change headless=True to headless=False

uv run python src/watchers/twitter_watcher.py ../AI_Employee_Vault twitter_session

# Browser opens:
# 1. Login to Twitter/X
# 2. Complete any security checks
# 3. Wait for feed to load
# 4. Press Ctrl+C

# Change back to headless=True
```

### 6. Install PM2 (1 minute)

```bash
npm install -g pm2
```

### 7. Start All Services (4 minutes)

**Start Watchers**:
```bash
# Gmail Watcher
pm2 start "uv run python src/watchers/gmail_watcher.py ../AI_Employee_Vault ../credentials.json" --name gmail-watcher --cwd watchers

# LinkedIn Watcher
pm2 start "uv run python src/watchers/linkedin_watcher.py ../AI_Employee_Vault linkedin_session" --name linkedin-watcher --cwd watchers

# Facebook Watcher
pm2 start "uv run python src/watchers/facebook_watcher.py ../AI_Employee_Vault facebook_session" --name facebook-watcher --cwd watchers

# Instagram Watcher
pm2 start "uv run python src/watchers/instagram_watcher.py ../AI_Employee_Vault instagram_session" --name instagram-watcher --cwd watchers

# Twitter Watcher
pm2 start "uv run python src/watchers/twitter_watcher.py ../AI_Employee_Vault twitter_session" --name twitter-watcher --cwd watchers
```

**Start Posters**:
```bash
# LinkedIn Poster (every 15 minutes)
pm2 start "uv run python src/watchers/linkedin_poster.py linkedin_session ../AI_Employee_Vault" --name linkedin-poster --cron "*/15 * * * *" --cwd watchers

# Facebook Poster (every 15 minutes)
pm2 start "uv run python src/watchers/facebook_poster.py facebook_session ../AI_Employee_Vault" --name facebook-poster --cron "*/15 * * * *" --cwd watchers

# Instagram Poster (every 15 minutes)
pm2 start "uv run python src/watchers/instagram_poster.py instagram_session ../AI_Employee_Vault" --name instagram-poster --cron "*/15 * * * *" --cwd watchers

# Twitter Poster (every 10 minutes)
pm2 start "uv run python src/watchers/twitter_poster.py twitter_session ../AI_Employee_Vault" --name twitter-poster --cron "*/10 * * * *" --cwd watchers
```

**Start CEO Briefing Generator**:
```bash
# Every Sunday at 8 PM
pm2 start "uv run python src/watchers/ceo_briefing_generator.py ../AI_Employee_Vault" --name ceo-briefing --cron "0 20 * * 0" --cwd watchers
```

**Save Configuration**:
```bash
pm2 save
pm2 startup
# Follow the instructions shown
```

---

## Verification (5 minutes)

### Check All Services

```bash
# Check PM2 processes
pm2 status

# Should show all processes running:
# ✓ gmail-watcher
# ✓ linkedin-watcher
# ✓ facebook-watcher
# ✓ instagram-watcher
# ✓ twitter-watcher
# ✓ linkedin-poster
# ✓ facebook-poster
# ✓ instagram-poster
# ✓ twitter-poster
# ✓ ceo-briefing
```

```bash
# Check Odoo
curl http://localhost:8069
# Should return HTML

# Check Docker
docker-compose ps
# Should show odoo_app and odoo_db running
```

### Test Claude Code Integration

```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/AI_Employee_Vault
claude
```

**Test commands**:
```
> List my Odoo invoices
> Create a draft invoice for Test Customer with $100 consulting service
> What social media posts were made today?
> Generate a CEO briefing for this week
```

---

## Common Issues & Solutions

### Issue: Docker won't start
**Solution**:
- Ensure Docker Desktop is running
- Check if port 8069 is available: `netstat -an | grep 8069`
- Restart Docker Desktop

### Issue: PM2 processes keep restarting
**Solution**:
- Check logs: `pm2 logs <process-name> --lines 50`
- Verify Python dependencies: `cd watchers && uv sync`
- Check session folders exist

### Issue: Social media login fails
**Solution**:
- Delete session folder: `rm -rf <platform>_session`
- Try login again with headless=False
- Check for 2FA requirements
- Verify account isn't locked

### Issue: MCP servers not connecting
**Solution**:
- Verify absolute paths in mcp_settings.json
- Check .env files have correct credentials
- Restart Claude Code: `claude --restart`
- Test MCP server manually: `node odoo-mcp-server/index.js`

### Issue: Odoo database creation fails
**Solution**:
- Wait longer (can take 3-5 minutes)
- Check Docker logs: `docker-compose logs odoo`
- Restart containers: `docker-compose restart`
- Check disk space: `df -h`

---

## Configuration Files

### Business_Goals.md

Edit `AI_Employee_Vault/Business_Goals.md`:

```markdown
---
last_updated: 2026-03-21
review_frequency: weekly
---

## Q1 2026 Objectives

### Revenue Target
- Monthly goal: $10,000
- Weekly goal: $2,500

### Key Metrics
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Weekly Revenue | $2,500 | < $2,000 |
| Invoice Payment Rate | > 90% | < 80% |
| Social Engagement | > 200/week | < 100/week |
| Task Completion | > 20/week | < 10/week |

### Active Projects
1. Project Alpha - Due Apr 15 - Budget $5,000
2. Project Beta - Due May 30 - Budget $8,000
```

### Company_Handbook.md

Edit `AI_Employee_Vault/Company_Handbook.md`:

```markdown
---
last_updated: 2026-03-21
---

## Communication Guidelines

### Email
- Response time: < 24 hours
- Professional tone
- Always include signature

### Social Media
- Post 2-3 times per day
- Respond to comments within 2 hours
- Use brand voice: Professional but friendly

### Approvals Required
- Payments > $100
- New customer contracts
- Social posts mentioning competitors
- Email to new contacts

### Business Hours
- Monday-Friday: 9 AM - 6 PM
- Weekend: Emergency only
```

---

## Next Steps

### Day 1: Testing
- [ ] Send test email to yourself
- [ ] Create test invoice in Odoo
- [ ] Post test content to social media
- [ ] Review Dashboard.md
- [ ] Check all logs

### Week 1: Optimization
- [ ] Adjust watcher intervals
- [ ] Fine-tune approval thresholds
- [ ] Customize CEO briefing format
- [ ] Add custom business metrics
- [ ] Train on your specific workflows

### Month 1: Scaling
- [ ] Add more social accounts
- [ ] Integrate additional tools
- [ ] Expand automation coverage
- [ ] Measure ROI
- [ ] Document lessons learned

---

## Maintenance Schedule

### Daily (2 minutes)
```bash
pm2 status
pm2 logs --lines 20
```

### Weekly (15 minutes)
- Review CEO briefing
- Check error logs
- Archive old files
- Update Business_Goals.md

### Monthly (1 hour)
- Rotate credentials
- Update dependencies
- Backup Odoo database
- Review and optimize
- Update documentation

---

## Backup & Recovery

### Backup Odoo Database
```bash
# Backup
docker exec odoo_db pg_dump -U odoo odoo > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i odoo_db psql -U odoo odoo < backup_20260321.sql
```

### Backup Vault
```bash
# Create backup
tar -czf vault_backup_$(date +%Y%m%d).tar.gz AI_Employee_Vault/

# Restore
tar -xzf vault_backup_20260321.tar.gz
```

### Backup Sessions
```bash
# Backup all sessions
tar -czf sessions_backup_$(date +%Y%m%d).tar.gz *_session/

# Restore
tar -xzf sessions_backup_20260321.tar.gz
```

---

## Performance Tuning

### Optimize Watcher Intervals

Edit watcher files to adjust check intervals:

```python
# For high-priority (Gmail, Twitter)
check_interval=120  # 2 minutes

# For medium-priority (LinkedIn, Facebook)
check_interval=180  # 3 minutes

# For low-priority (Instagram)
check_interval=300  # 5 minutes
```

### Reduce Resource Usage

```bash
# Limit PM2 memory
pm2 start script.py --max-memory-restart 200M

# Reduce Docker resources
# Edit docker-compose.yml:
services:
  odoo:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
```

---

## Security Hardening

### Production Checklist

- [ ] Change Odoo admin password
- [ ] Use strong database passwords
- [ ] Enable 2FA on all social accounts
- [ ] Rotate API keys monthly
- [ ] Review access logs weekly
- [ ] Backup credentials securely
- [ ] Use HTTPS for Odoo (if exposed)
- [ ] Implement rate limiting
- [ ] Monitor for suspicious activity

### Environment Variables

Never commit these files:
```bash
echo ".env" >> .gitignore
echo "*_session/" >> .gitignore
echo "credentials.json" >> .gitignore
echo "token.json" >> .gitignore
```

---

## Support

### Getting Help

1. **Check Documentation**: Read skill .md files
2. **Check Logs**: `pm2 logs <process-name>`
3. **Test Manually**: Run watchers directly
4. **Join Weekly Meetings**: Wednesdays 10 PM
5. **Submit Issues**: GitHub repository

### Useful Commands

```bash
# Restart all processes
pm2 restart all

# Stop all processes
pm2 stop all

# Delete all processes
pm2 delete all

# View detailed logs
pm2 logs --lines 100

# Monitor in real-time
pm2 monit

# Check system resources
pm2 status
```

---

**🎉 Setup Complete! Your Gold Tier AI Employee is now running! 🎉**

**Next**: Open Claude Code and start automating your business!

```bash
cd AI_Employee_Vault
claude
```

Try: "Check my inbox and create a summary of urgent items"

---

*Setup Guide v1.0.0*
*Last Updated: 2026-03-21*
