# 🚀 Facebook Integration - Quick Start

## ✅ What I've Created For You

1. **facebook_api_client.py** - Facebook Graph API client
2. **facebook_watcher.py** - Monitors posts and comments every 5 minutes
3. **facebook_poster.py** - Publishes approved posts every 15 minutes
4. **test_facebook.py** - Test script to verify your setup
5. **.env.example** - Template for your credentials
6. **Example post** - Ready to test in /Pending_Approval/

---

## 🔑 Step 1: Verify Your .env File

You mentioned you already added your Facebook keys to `facebook/.env`.

**The .env file should be at:**
```
AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers/.env
```

**It should contain:**
```bash
FACEBOOK_PAGE_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxx
```

**To verify:**
```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers
cat .env | grep FACEBOOK
```

---

## 🧪 Step 2: Test Your Connection

```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers

# Run the test script
uv run python test_facebook.py
```

**Expected output:**
```
============================================================
Facebook API Integration Test
============================================================

✅ Environment variables loaded
   Page ID: 1234567890...
   Token: EAAxxxxxxxxxx...

✅ Facebook API client initialized

------------------------------------------------------------
Test 1: Fetching recent posts
------------------------------------------------------------
✅ Successfully fetched 5 posts

Post 1:
  ID: 123456789_987654321
  Message: Your recent post content...
  Created: 2026-03-21T10:30:00+0000
  Engagement:
    👍 Likes: 15
    💬 Comments: 3
    🔄 Shares: 2
  Link: https://facebook.com/...

🎉 Facebook integration is ready to use!
```

---

## 🎯 Step 3: How Auto-Posting Works

### Create a Post

I've already created an example post for you at:
```
AI_Employee_Vault/Pending_Approval/FACEBOOK_POST_example_20260321.md
```

### Approve the Post

```bash
# Move to Approved folder
mv "AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/AI_Employee_Vault/Pending_Approval/FACEBOOK_POST_example_20260321.md" \
   "AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/AI_Employee_Vault/Approved/"
```

### Test Posting Manually (Before PM2)

```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers

# Run poster once
uv run python src/watchers/facebook_poster.py ../AI_Employee_Vault
```

**Expected output:**
```
2026-03-21 22:21:00 - FacebookPoster - INFO - Publishing post from FACEBOOK_POST_example_20260321.md
2026-03-21 22:21:01 - FacebookAPIClient - INFO - Posted to Facebook: 123456789_987654321
2026-03-21 22:21:01 - FacebookPoster - INFO - ✅ Posted successfully and moved to Done: FACEBOOK_POST_example_20260321.md
2026-03-21 22:21:01 - FacebookPoster - INFO -    Post ID: 123456789_987654321
```

---

## 🔍 Step 4: How Comment Detection Works

### Test Watcher Manually

```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers

# Run watcher once
uv run python src/watchers/facebook_watcher.py ../AI_Employee_Vault
```

**What happens:**
1. Fetches your 5 most recent posts
2. Checks each post for comments
3. Creates action files for new comments in `/Needs_Action/`

**Expected output:**
```
2026-03-21 22:21:00 - FacebookWatcher - INFO - Starting watcher...
2026-03-21 22:21:01 - FacebookWatcher - INFO - Found 2 new items
2026-03-21 22:21:01 - FacebookWatcher - INFO - Created action file: FACEBOOK_COMMENT_John_Doe_20260321_222100.md
2026-03-21 22:21:01 - FacebookWatcher - INFO - Created action file: FACEBOOK_COMMENT_Jane_Smith_20260321_222101.md
```

### Check Action Files

```bash
ls AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/AI_Employee_Vault/Needs_Action/FACEBOOK_*
```

**Example action file content:**
```markdown
---
type: facebook_comment
post_id: 123456789_987654321
comment_id: 987654321_123456789
from: John Doe
received: 2026-03-21T22:21:00Z
priority: medium
status: pending
source: facebook_watcher
---

## New Comment

**From**: John Doe

**Comment**:
This looks amazing! Can you tell me more about pricing?

## Suggested Actions

- [ ] Review comment context
- [ ] Determine if response is needed
- [ ] Draft appropriate reply
- [ ] Create approval request if needed
- [ ] Reply via Facebook API
- [ ] Log interaction in Dashboard.md
- [ ] Move to /Done when complete
```

---

## 🚀 Step 5: Start Services with PM2

Once testing is successful, start the automated services:

```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers

# Start Facebook Watcher (runs continuously, checks every 5 min)
pm2 start "uv run python src/watchers/facebook_watcher.py ../AI_Employee_Vault" \
  --name facebook-watcher

# Start Facebook Poster (runs every 15 minutes)
pm2 start "uv run python src/watchers/facebook_poster.py ../AI_Employee_Vault" \
  --name facebook-poster \
  --cron "*/15 * * * *"

# Save configuration
pm2 save

# Check status
pm2 status
```

**Expected output:**
```
┌─────┬──────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                 │ status  │ restart │ uptime   │
├─────┼──────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ facebook-watcher     │ online  │ 0       │ 2s       │
│ 1   │ facebook-poster      │ online  │ 0       │ 1s       │
└─────┴──────────────────────┴─────────┴─────────┴──────────┘
```

---

## 📊 Step 6: Monitor Your System

### Check Logs

```bash
# View watcher logs
pm2 logs facebook-watcher --lines 50

# View poster logs
pm2 logs facebook-poster --lines 50

# View all logs
pm2 logs --lines 20
```

### Check Post Logs

```bash
# View today's post log
cat AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/AI_Employee_Vault/Logs/facebook_posts_20260321.json
```

**Example log:**
```json
[
  {
    "success": true,
    "post_id": "123456789_987654321",
    "message": "Post published successfully",
    "timestamp": "2026-03-21T22:21:00.000Z",
    "file": "FACEBOOK_POST_example_20260321.md",
    "content_preview": "🚀 Exciting announcement! We're revolutionizing business automation with AI!..."
  }
]
```

### Check Action Files

```bash
# New comments
ls AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/AI_Employee_Vault/Needs_Action/FACEBOOK_COMMENT_*

# High engagement posts
ls AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/AI_Employee_Vault/Needs_Action/FACEBOOK_ENGAGEMENT_*

# Completed posts
ls AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/AI_Employee_Vault/Done/FACEBOOK_POST_*
```

---

## 🎯 How It All Works Together

### Auto-Posting Flow

```
1. You create: /Pending_Approval/FACEBOOK_POST_announcement.md
                ↓
2. You approve: Move to /Approved/
                ↓
3. Poster runs: Every 15 minutes
                ↓
4. API call:    client.post_message(content, link)
                ↓
5. Published:   Post appears on your Facebook page
                ↓
6. Logged:      Result saved to /Logs/facebook_posts_YYYYMMDD.json
                ↓
7. Archived:    File moved to /Done/
```

### Comment Detection Flow

```
1. Watcher runs: Every 5 minutes
                ↓
2. API call:     client.get_posts(limit=5)
                ↓
3. For each post: client.get_post_comments(post_id)
                ↓
4. New comment:  Check if comment_id is new
                ↓
5. Action file:  Create in /Needs_Action/
                ↓
6. You review:   Read comment and decide response
                ↓
7. Reply:        Use client.reply_to_comment() or create approval
```

---

## 🔧 Troubleshooting

### Issue: "FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN must be set"

**Check .env location:**
```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers
ls -la .env
cat .env
```

**Should show:**
```
FACEBOOK_PAGE_ID=123456789
FACEBOOK_ACCESS_TOKEN=EAAxxxxx...
```

### Issue: "Invalid OAuth access token"

**Your token expired. Get a new one:**
1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app
3. Click "Generate Access Token"
4. Grant permissions
5. Copy new token to .env

### Issue: No comments detected

**Verify:**
1. Do your posts have comments? Check Facebook directly
2. Run watcher manually: `uv run python src/watchers/facebook_watcher.py ../AI_Employee_Vault`
3. Check logs: `pm2 logs facebook-watcher`

### Issue: Posts not publishing

**Verify:**
1. File is in `/Approved/` folder
2. Filename starts with `FACEBOOK_POST_`
3. Has `## Post Content` section
4. Run manually: `uv run python src/watchers/facebook_poster.py ../AI_Employee_Vault`

---

## 📝 Summary

**You now have:**
✅ Facebook API client (facebook_api_client.py)
✅ Comment detector (facebook_watcher.py) - runs every 5 min
✅ Auto-poster (facebook_poster.py) - runs every 15 min
✅ Test script (test_facebook.py)
✅ Example post ready to test
✅ Complete documentation

**Next steps:**
1. ✅ Verify your .env file has correct keys
2. ✅ Run test: `uv run python test_facebook.py`
3. ✅ Test posting manually
4. ✅ Start PM2 services
5. ✅ Monitor logs and action files

**Your Facebook integration is ready! 🎉**

---

*Created: 2026-03-21 22:21:51*
*Status: Ready to Deploy*
