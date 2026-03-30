# 🎨 Facebook Integration - Visual Flow Diagrams

## 📤 AUTO-POSTING FLOW (Every 15 Minutes)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOU (Human)                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │  Create Post File  │
                    │  in /Pending_      │
                    │  Approval/         │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │  Review & Approve  │
                    │  Move to /Approved/│
                    └────────┬───────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                    FACEBOOK POSTER (Automated)                     │
│                    Runs every 15 minutes                           │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Scan /Approved/    │
                    │ for FACEBOOK_      │
                    │ POST_*.md files    │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Extract Content    │
                    │ - Post text        │
                    │ - Optional link    │
                    └────────┬───────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                    FACEBOOK GRAPH API                              │
│                    https://graph.facebook.com/v19.0                │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ POST /feed         │
                    │ {                  │
                    │   message: "...",  │
                    │   link: "...",     │
                    │   access_token     │
                    │ }                  │
                    └────────┬───────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                    FACEBOOK PAGE                                   │
│                    Your post is now LIVE!                          │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Log Result         │
                    │ /Logs/facebook_    │
                    │ posts_YYYYMMDD.json│
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Move to /Done/     │
                    │ ✅ Complete!       │
                    └────────────────────┘
```

---

## 🔍 COMMENT DETECTION FLOW (Every 5 Minutes)

```
┌────────────────────────────────────────────────────────────────────┐
│                    FACEBOOK WATCHER (Automated)                    │
│                    Runs every 5 minutes                            │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                    FACEBOOK GRAPH API                              │
│                    GET /posts?limit=5                              │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Fetch 5 Recent     │
                    │ Posts              │
                    │                    │
                    │ Post 1 ─┐          │
                    │ Post 2  │          │
                    │ Post 3  │          │
                    │ Post 4  │          │
                    │ Post 5 ─┘          │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ For Each Post:     │
                    │ Check if comments  │
                    │ > 0                │
                    └────────┬───────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                    FACEBOOK GRAPH API                              │
│                    GET /post_id/comments?limit=10                  │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Get Comments       │
                    │                    │
                    │ Comment 1 ─┐       │
                    │ Comment 2  │       │
                    │ Comment 3  │       │
                    │ ...       ─┘       │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Check Each Comment │
                    │ Is comment_id NEW? │
                    │                    │
                    │ ✓ New → Process    │
                    │ ✗ Seen → Skip      │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Create Action File │
                    │ /Needs_Action/     │
                    │ FACEBOOK_COMMENT_  │
                    │ John_Doe_...md     │
                    └────────┬───────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                         YOU (Human)                                │
│                         Review Comment                             │
└────────────────────────────┬───────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Decide Action:     │
                    │                    │
                    │ 1. Reply via API   │
                    │ 2. Ignore          │
                    │ 3. Flag as lead    │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Reply (Optional)   │
                    │ client.reply_to_   │
                    │ comment()          │
                    └────────┬───────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │ Move to /Done/     │
                    │ ✅ Complete!       │
                    └────────────────────┘
```

---

## 🔄 COMPLETE SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FACEBOOK PAGE                               │
│                    (Your Business Page)                             │
└──────────────┬──────────────────────────────────┬───────────────────┘
               │                                  │
               │ Posts                            │ Comments
               │                                  │
               ▼                                  ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│   FACEBOOK POSTER        │      │   FACEBOOK WATCHER       │
│   (Every 15 min)         │      │   (Every 5 min)          │
│                          │      │                          │
│   Publishes approved     │      │   Detects new comments   │
│   posts from /Approved/  │      │   Creates action files   │
└──────────┬───────────────┘      └──────────┬───────────────┘
           │                                  │
           │                                  │
           ▼                                  ▼
┌──────────────────────────────────────────────────────────────┐
│              FACEBOOK GRAPH API v19.0                        │
│              https://graph.facebook.com                      │
│                                                              │
│   POST /feed              GET /posts                         │
│   POST /photos            GET /comments                      │
│   POST /comments          GET /insights                      │
└──────────┬───────────────────────────────────┬───────────────┘
           │                                   │
           │                                   │
           ▼                                   ▼
┌──────────────────────┐          ┌──────────────────────┐
│   /Approved/         │          │   /Needs_Action/     │
│   FACEBOOK_POST_*.md │          │   FACEBOOK_COMMENT_  │
│                      │          │   *.md               │
│   ↓                  │          │                      │
│   Published          │          │   ↓                  │
│   ↓                  │          │   You Review         │
│   /Done/             │          │   ↓                  │
│                      │          │   /Done/             │
└──────────────────────┘          └──────────────────────┘
           │                                   │
           │                                   │
           ▼                                   ▼
┌──────────────────────────────────────────────────────────────┐
│                    /Logs/                                    │
│   facebook_posts_YYYYMMDD.json                              │
│   - All published posts                                      │
│   - Success/failure status                                   │
│   - Timestamps                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 DATA FLOW EXAMPLE

### Scenario: Customer Comments on Your Post

```
TIME: 10:00 AM
┌─────────────────────────────────────────┐
│ Customer: "How much does this cost?"    │
│ Comments on your Facebook post          │
└─────────────────┬───────────────────────┘
                  │
TIME: 10:05 AM    ▼
┌─────────────────────────────────────────┐
│ Facebook Watcher runs (every 5 min)    │
│ - Fetches recent posts                  │
│ - Finds new comment                     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Action file created:                    │
│ /Needs_Action/FACEBOOK_COMMENT_         │
│ Customer_Name_20260321_100500.md        │
│                                         │
│ Content:                                │
│ - From: Customer Name                   │
│ - Message: "How much does this cost?"   │
│ - Post ID: 123456789_987654321          │
│ - Comment ID: 987654321_123456789       │
└─────────────────┬───────────────────────┘
                  │
TIME: 10:10 AM    ▼
┌─────────────────────────────────────────┐
│ YOU review the comment                  │
│ - Read customer question                │
│ - Draft response                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Reply via API:                          │
│ client.reply_to_comment(                │
│   "987654321_123456789",                │
│   "Thanks for asking! Our pricing..."   │
│ )                                       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Customer sees your reply on Facebook    │
│ ✅ Engagement complete!                 │
└─────────────────────────────────────────┘
```

---

## 🎯 TIMING DIAGRAM

```
Time    Watcher         Poster          Your Actions
────────────────────────────────────────────────────────
10:00   Check posts     -               -
10:05   Check posts     -               -
10:10   Check posts     -               -
10:15   Check posts     Publish posts   -
10:20   Check posts     -               Create post file
10:25   Check posts     -               Move to /Approved/
10:30   Check posts     Publish posts   ✅ Post goes live!
10:35   Check posts     -               -
10:40   Check posts     -               -
10:45   Check posts     Publish posts   -
10:50   Check posts     -               Comment arrives
10:55   Check posts     -               -
        ↓ Detects!
11:00   Check posts     Publish posts   Review comment
        Creates action
        file
11:05   Check posts     -               Reply to comment
```

---

## 🔐 AUTHENTICATION FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR .env FILE                           │
│                                                             │
│   FACEBOOK_PAGE_ID=123456789012345                         │
│   FACEBOOK_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxx               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              FacebookAPIClient.__init__()                   │
│                                                             │
│   self.page_id = os.getenv("FACEBOOK_PAGE_ID")            │
│   self.access_token = os.getenv("FACEBOOK_ACCESS_TOKEN")  │
│   self.base_url = "https://graph.facebook.com/v19.0"      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    API REQUESTS                             │
│                                                             │
│   Every request includes:                                  │
│   params = {                                               │
│     "access_token": self.access_token,                     │
│     ...other params                                        │
│   }                                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              FACEBOOK GRAPH API                             │
│                                                             │
│   Validates token                                          │
│   Checks permissions                                       │
│   Executes request                                         │
│   Returns result                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 RATE LIMIT TRACKING

```
Facebook API Limits:
├─ 200 calls/hour per user
└─ 4800 calls/day per app

Your Usage:
├─ Watcher: 12 calls/hour (every 5 min)
│   └─ 288 calls/day
├─ Poster: 4 calls/hour (every 15 min)
│   └─ 96 calls/day
└─ Total: ~384 calls/day

Safety Margin: 4800 - 384 = 4416 calls/day remaining ✅

Percentage Used: 8% (very safe!)
```

---

## 🎯 FILE NAMING CONVENTIONS

```
Posts:
├─ FACEBOOK_POST_announcement_20260321.md
├─ FACEBOOK_POST_product_launch_20260321.md
└─ FACEBOOK_POST_weekly_update_20260321.md

Comments:
├─ FACEBOOK_COMMENT_John_Doe_20260321_100500.md
├─ FACEBOOK_COMMENT_Jane_Smith_20260321_103000.md
└─ FACEBOOK_COMMENT_Customer_Name_20260321_110000.md

Engagement:
├─ FACEBOOK_ENGAGEMENT_20260321_100500.md
└─ FACEBOOK_ENGAGEMENT_20260321_150000.md

Logs:
├─ facebook_posts_20260321.json
├─ facebook_posts_20260322.json
└─ facebook_posts_20260323.json
```

---

## ✅ QUICK REFERENCE

### Start Services
```bash
pm2 start facebook-watcher
pm2 start facebook-poster
```

### Check Status
```bash
pm2 status
pm2 logs facebook-watcher --lines 20
pm2 logs facebook-poster --lines 20
```

### Manual Testing
```bash
# Test connection
uv run python test_facebook.py

# Test watcher
uv run python src/watchers/facebook_watcher.py ../AI_Employee_Vault

# Test poster
uv run python src/watchers/facebook_poster.py ../AI_Employee_Vault
```

### File Locations
```
.env file:
  watchers/.env

Python files:
  watchers/src/watchers/facebook_api_client.py
  watchers/src/watchers/facebook_watcher.py
  watchers/src/watchers/facebook_poster.py

Vault folders:
  AI_Employee_Vault/Pending_Approval/
  AI_Employee_Vault/Approved/
  AI_Employee_Vault/Needs_Action/
  AI_Employee_Vault/Done/
  AI_Employee_Vault/Logs/
```

---

**🎉 Your Facebook integration is fully documented and ready to use! 🎉**

*Created: 2026-03-21 22:38:44*
*All visual diagrams and flows explained*
