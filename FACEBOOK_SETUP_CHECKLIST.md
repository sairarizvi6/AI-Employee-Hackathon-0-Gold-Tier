# ✅ Facebook Integration - Setup Checklist

## 📋 Pre-Flight Checklist

Use this checklist to verify your Facebook integration is ready to go!

---

## 🔑 Step 1: Verify Credentials

### Check .env File Location

```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers
ls -la .env
```

**Expected:** File exists ✅

### Check .env Content

```bash
cat .env | grep FACEBOOK
```

**Expected output:**
```
FACEBOOK_PAGE_ID=123456789012345
FACEBOOK_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Checklist:**
- [ ] .env file exists in watchers directory
- [ ] FACEBOOK_PAGE_ID is set (numeric ID)
- [ ] FACEBOOK_ACCESS_TOKEN is set (starts with EAA)
- [ ] No spaces around = sign
- [ ] No quotes around values

---

## 🧪 Step 2: Test Connection

### Run Test Script

```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers
uv run python test_facebook.py
```

**Expected output:**
```
============================================================
Facebook API Integration Test
============================================================

✅ Environment variables loaded
✅ Facebook API client initialized
✅ Successfully fetched X posts
🎉 Facebook integration is ready to use!
```

**Checklist:**
- [ ] Test script runs without errors
- [ ] Environment variables loaded successfully
- [ ] API client initialized
- [ ] Posts fetched successfully
- [ ] No authentication errors

**If you see errors:**
- ❌ "Invalid OAuth access token" → Token expired, get new one
- ❌ "FACEBOOK_PAGE_ID must be set" → Check .env file
- ❌ "Connection error" → Check internet connection

---

## 📝 Step 3: Verify Files Created

### Check Python Files

```bash
ls -la src/watchers/facebook*.py
```

**Expected files:**
- [ ] facebook_api_client.py (API client)
- [ ] facebook_watcher.py (Comment detector)
- [ ] facebook_poster.py (Auto-poster)

### Check Example Post

```bash
ls -la ../AI_Employee_Vault/Pending_Approval/FACEBOOK_POST_*.md
```

**Expected:**
- [ ] FACEBOOK_POST_example_20260321.md exists

---

## 🔍 Step 4: Test Watcher (Comment Detection)

### Run Watcher Once

```bash
uv run python src/watchers/facebook_watcher.py ../AI_Employee_Vault
```

**Expected output:**
```
2026-03-21 22:54:00 - FacebookWatcher - INFO - Starting watcher...
2026-03-21 22:54:01 - FacebookWatcher - INFO - Checking for updates...
2026-03-21 22:54:02 - FacebookWatcher - INFO - Found X new items
```

**Checklist:**
- [ ] Watcher starts without errors
- [ ] Connects to Facebook API
- [ ] Fetches posts successfully
- [ ] Creates action files if comments found
- [ ] No crashes or exceptions

### Check for Action Files

```bash
ls ../AI_Employee_Vault/Needs_Action/FACEBOOK_*.md
```

**If you have comments on recent posts:**
- [ ] Action files created for new comments
- [ ] Files have correct naming format
- [ ] Content includes comment details

---

## 📤 Step 5: Test Poster (Auto-Publishing)

### Move Example Post to Approved

```bash
mv ../AI_Employee_Vault/Pending_Approval/FACEBOOK_POST_example_20260321.md \
   ../AI_Employee_Vault/Approved/
```

**Checklist:**
- [ ] File moved successfully
- [ ] File is in /Approved/ folder

### Run Poster Once

```bash
uv run python src/watchers/facebook_poster.py ../AI_Employee_Vault
```

**Expected output:**
```
2026-03-21 22:54:00 - FacebookPoster - INFO - Publishing post from FACEBOOK_POST_example_20260321.md
2026-03-21 22:54:01 - FacebookAPIClient - INFO - Posted to Facebook: 123456789_987654321
2026-03-21 22:54:01 - FacebookPoster - INFO - ✅ Posted successfully and moved to Done
```

**Checklist:**
- [ ] Poster runs without errors
- [ ] Post published to Facebook
- [ ] File moved to /Done/
- [ ] Log created in /Logs/

### Verify on Facebook

1. Go to your Facebook page
2. Check for the new post

**Checklist:**
- [ ] Post is visible on Facebook page
- [ ] Content matches what you wrote
- [ ] Link is attached (if you included one)
- [ ] Post timestamp is recent

### Check Logs

```bash
cat ../AI_Employee_Vault/Logs/facebook_posts_$(date +%Y%m%d).json
```

**Expected:**
```json
[
  {
    "success": true,
    "post_id": "123456789_987654321",
    "message": "Post published successfully",
    "timestamp": "2026-03-21T22:54:01.000Z",
    "file": "FACEBOOK_POST_example_20260321.md"
  }
]
```

**Checklist:**
- [ ] Log file created
- [ ] Contains post details
- [ ] Success status is true
- [ ] Post ID is present

---

## 🚀 Step 6: Start Automated Services

### Install PM2 (if not already installed)

```bash
npm install -g pm2
```

**Checklist:**
- [ ] PM2 installed successfully
- [ ] `pm2 --version` shows version number

### Start Facebook Watcher

```bash
pm2 start "uv run python src/watchers/facebook_watcher.py ../AI_Employee_Vault" \
  --name facebook-watcher
```

**Expected output:**
```
[PM2] Starting facebook-watcher
[PM2] Done.
```

**Checklist:**
- [ ] Watcher started successfully
- [ ] Status shows "online"

### Start Facebook Poster

```bash
pm2 start "uv run python src/watchers/facebook_poster.py ../AI_Employee_Vault" \
  --name facebook-poster \
  --cron "*/15 * * * *"
```

**Expected output:**
```
[PM2] Starting facebook-poster
[PM2] Done.
```

**Checklist:**
- [ ] Poster started successfully
- [ ] Cron schedule set (every 15 minutes)
- [ ] Status shows "online"

### Save PM2 Configuration

```bash
pm2 save
pm2 startup
```

**Follow the instructions shown to enable auto-start on boot**

**Checklist:**
- [ ] PM2 configuration saved
- [ ] Startup script configured
- [ ] Services will restart on reboot

### Check Status

```bash
pm2 status
```

**Expected output:**
```
┌─────┬──────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                 │ status  │ restart │ uptime   │
├─────┼──────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ facebook-watcher     │ online  │ 0       │ 10s      │
│ 1   │ facebook-poster      │ online  │ 0       │ 5s       │
└─────┴──────────────────────┴─────────┴─────────┴──────────┘
```

**Checklist:**
- [ ] Both services show "online"
- [ ] Restart count is low (0-2)
- [ ] Uptime is increasing

---

## 📊 Step 7: Monitor Services

### Check Logs

```bash
# View watcher logs
pm2 logs facebook-watcher --lines 20

# View poster logs
pm2 logs facebook-poster --lines 20

# View all logs
pm2 logs --lines 50
```

**Checklist:**
- [ ] Logs show regular activity
- [ ] No error messages
- [ ] Watcher checking every 5 minutes
- [ ] Poster running every 15 minutes

### Monitor for 30 Minutes

Wait 30 minutes and check:

```bash
pm2 status
pm2 logs --lines 50
```

**Checklist:**
- [ ] Services still running
- [ ] No crashes or restarts
- [ ] Watcher has run 6 times (every 5 min)
- [ ] Poster has run 2 times (every 15 min)

---

## 🎯 Step 8: Create Your First Real Post

### Create Post File

```bash
cat > ../AI_Employee_Vault/Pending_Approval/FACEBOOK_POST_first_real_20260321.md << 'EOF'
---
type: approval_request
action: facebook_post
link: https://yourwebsite.com
created: 2026-03-21T22:54:00Z
priority: medium
status: pending
---

## Post Content

🎉 Exciting news from our team!

We're thrilled to announce [your announcement here]

Learn more: [link below]

#YourHashtags #Business #Innovation

## To Approve
Move this file to /Approved folder

## To Reject
Move this file to /Rejected folder
EOF
```

**Checklist:**
- [ ] Post file created
- [ ] Content customized for your business
- [ ] Link updated (or removed if not needed)
- [ ] Hashtags relevant to your industry

### Review and Approve

```bash
# Review the post
cat ../AI_Employee_Vault/Pending_Approval/FACEBOOK_POST_first_real_20260321.md

# Approve it
mv ../AI_Employee_Vault/Pending_Approval/FACEBOOK_POST_first_real_20260321.md \
   ../AI_Employee_Vault/Approved/
```

**Checklist:**
- [ ] Post content reviewed
- [ ] No typos or errors
- [ ] Moved to /Approved/

### Wait for Publication

Within 15 minutes, the poster will publish it.

**Monitor:**
```bash
# Watch logs
pm2 logs facebook-poster --lines 20

# Check if moved to Done
ls ../AI_Employee_Vault/Done/FACEBOOK_POST_first_real_20260321.md
```

**Checklist:**
- [ ] Post published within 15 minutes
- [ ] File moved to /Done/
- [ ] Log entry created
- [ ] Post visible on Facebook

---

## 🔍 Step 9: Test Comment Detection

### Add a Comment on Facebook

1. Go to your Facebook page
2. Find a recent post
3. Add a test comment: "Testing comment detection!"

### Wait 5 Minutes

The watcher runs every 5 minutes.

### Check for Action File

```bash
ls ../AI_Employee_Vault/Needs_Action/FACEBOOK_COMMENT_*.md
```

**Checklist:**
- [ ] Action file created within 5 minutes
- [ ] File contains your test comment
- [ ] Comment details are correct

### Review Action File

```bash
cat ../AI_Employee_Vault/Needs_Action/FACEBOOK_COMMENT_*.md
```

**Checklist:**
- [ ] Comment author name is correct
- [ ] Comment text is accurate
- [ ] Post ID and comment ID present
- [ ] Timestamp is recent

---

## ✅ Final Verification

### System Health Check

```bash
pm2 status
pm2 logs --lines 50
```

**Checklist:**
- [ ] All services online
- [ ] No error messages
- [ ] Regular activity in logs
- [ ] Low restart counts

### File Structure Check

```bash
# Check all folders exist
ls -la ../AI_Employee_Vault/Pending_Approval/
ls -la ../AI_Employee_Vault/Approved/
ls -la ../AI_Employee_Vault/Needs_Action/
ls -la ../AI_Employee_Vault/Done/
ls -la ../AI_Employee_Vault/Logs/
```

**Checklist:**
- [ ] All folders exist
- [ ] Permissions are correct
- [ ] Files are being created/moved properly

### Facebook Page Check

Visit your Facebook page and verify:

**Checklist:**
- [ ] Recent posts are visible
- [ ] Posts have correct content
- [ ] Links are working
- [ ] Engagement is being tracked

---

## 🎉 Success Criteria

Your Facebook integration is fully operational when:

### Auto-Posting ✅
- [ ] Posts in /Approved/ are published within 15 minutes
- [ ] Published posts appear on Facebook page
- [ ] Files are moved to /Done/ after publishing
- [ ] Logs are created in /Logs/

### Comment Detection ✅
- [ ] New comments detected within 5 minutes
- [ ] Action files created in /Needs_Action/
- [ ] Comment details are accurate
- [ ] No duplicate detections

### System Reliability ✅
- [ ] Services run continuously without crashes
- [ ] PM2 shows "online" status
- [ ] Logs show regular activity
- [ ] No authentication errors

### Monitoring ✅
- [ ] Can view logs with `pm2 logs`
- [ ] Can check status with `pm2 status`
- [ ] Log files are being created
- [ ] Action files are being processed

---

## 🆘 Troubleshooting Quick Reference

### Service Won't Start
```bash
pm2 delete facebook-watcher
pm2 delete facebook-poster
# Then start again from Step 6
```

### Authentication Errors
```bash
# Get new access token from:
# https://developers.facebook.com/tools/explorer/
# Update .env file
# Restart services:
pm2 restart all
```

### No Comments Detected
```bash
# Run watcher manually to see errors:
uv run python src/watchers/facebook_watcher.py ../AI_Employee_Vault
```

### Posts Not Publishing
```bash
# Run poster manually to see errors:
uv run python src/watchers/facebook_poster.py ../AI_Employee_Vault
```

### Check Logs for Errors
```bash
pm2 logs facebook-watcher --err --lines 50
pm2 logs facebook-poster --err --lines 50
```

---

## 📚 Documentation Reference

- **FACEBOOK_SETUP_GUIDE.md** - Complete setup instructions
- **FACEBOOK_QUICK_START.md** - Quick reference guide
- **FACEBOOK_COMPLETE_SUMMARY.md** - How it all works
- **FACEBOOK_VISUAL_GUIDE.md** - Visual flow diagrams
- **FACEBOOK_SETUP_CHECKLIST.md** - This file

---

## 🎯 Next Steps After Setup

Once everything is working:

1. **Create a posting schedule**
   - Plan content for the week
   - Create post files in advance
   - Move to /Approved/ when ready

2. **Monitor engagement**
   - Check /Needs_Action/ daily for comments
   - Respond to customer inquiries
   - Track high-engagement posts

3. **Optimize timing**
   - Adjust poster frequency if needed
   - Change watcher interval based on activity
   - Review Business_Goals.md weekly

4. **Expand automation**
   - Add more social platforms
   - Integrate with CRM
   - Create automated responses

---

**🎉 Congratulations! Your Facebook integration is complete! 🎉**

**Current Status:** Ready for Production ✅

**Date:** 2026-03-21 22:54:38
**Version:** 2.0.0 (Graph API)
**Method:** Official Facebook Graph API

---

*Print this checklist and check off items as you complete them!*
