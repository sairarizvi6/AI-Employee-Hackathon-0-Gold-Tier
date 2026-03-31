# Facebook Integration - Complete Setup Guide

## 🎯 How It Works

### **Auto-Posting System**

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTO-POSTING FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. CREATE POST FILE
   ↓
   /Pending_Approval/FACEBOOK_POST_announcement.md

2. REVIEW & APPROVE
   ↓
   Move to /Approved/ folder

3. FACEBOOK POSTER (runs every 15 min)
   ↓
   - Scans /Approved/ for FACEBOOK_POST_*.md
   - Extracts content and link
   - Calls Facebook Graph API
   - Posts to your page

4. LOGGING
   ↓
   - Logs result to /Logs/facebook_posts_YYYYMMDD.json
   - Moves file to /Done/ if successful
```

### **Comment Detection System**

```
┌─────────────────────────────────────────────────────────────┐
│                 COMMENT DETECTION FLOW                      │
└─────────────────────────────────────────────────────────────┘

1. FACEBOOK WATCHER (runs every 5 min)
   ↓
   - Calls Facebook Graph API
   - Gets recent posts (last 5)
   - Gets comments on each post

2. NEW COMMENT DETECTED
   ↓
   - Checks if comment ID is new
   - Extracts: author, message, timestamp

3. CREATE ACTION FILE
   ↓
   /Needs_Action/FACEBOOK_COMMENT_John_Doe_20260321.md

4. YOU REVIEW
   ↓
   - Read the comment
   - Draft a reply
   - Create approval request

5. REPLY VIA API
   ↓
   - Use facebook_api_client.reply_to_comment()
   - Or create FACEBOOK_REPLY_*.md in /Approved/
```

---

## 📁 File Structure

Your `.env` file should be located at:
```
AI-Employee-Hackathon-0-Gold-Tier/
└── AI-Employee-Hackathon-0-Silver-tier/
    └── AI-Employee-Hackathon-0/
        └── AI-Employee-Hackathon-0-Silver-tier/
            └── watchers/
                ├── .env                    ← YOUR FACEBOOK KEYS HERE
                ├── src/
                │   └── watchers/
                │       ├── facebook_api_client.py
                │       ├── facebook_watcher.py
                │       └── facebook_poster.py
                └── pyproject.toml
```

---

## 🔑 Step 1: Verify Your .env File

Your `.env` file should contain:

```bash
# Facebook Configuration
FACEBOOK_PAGE_ID=your_page_id_here
FACEBOOK_ACCESS_TOKEN=your_long_lived_access_token_here
```

**To verify**:
```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers
cat .env
```

---

## 🛠️ Step 2: Create Facebook API Client

Create `src/watchers/facebook_api_client.py`:

```python
import requests
import logging
from typing import Dict, List, Optional

class FacebookAPIClient:
    """Facebook Graph API client for posting and monitoring"""

    def __init__(self, page_id: str, access_token: str):
        self.page_id = page_id
        self.access_token = access_token
        self.base_url = "https://graph.facebook.com/v19.0"
        self.logger = logging.getLogger(self.__class__.__name__)

    def post_message(self, message: str, link: Optional[str] = None) -> Dict:
        """Post a message to Facebook page"""
        url = f"{self.base_url}/{self.page_id}/feed"

        params = {
            "message": message,
            "access_token": self.access_token
        }

        if link:
            params["link"] = link

        try:
            response = requests.post(url, params=params)
            response.raise_for_status()
            result = response.json()

            self.logger.info(f"Posted to Facebook: {result.get('id')}")
            return {
                "success": True,
                "post_id": result.get("id"),
                "message": "Post published successfully"
            }

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error posting to Facebook: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_posts(self, limit: int = 10) -> List[Dict]:
        """Get recent posts from the page"""
        url = f"{self.base_url}/{self.page_id}/posts"

        params = {
            "fields": "id,message,created_time,permalink_url,likes.summary(true),comments.summary(true),shares",
            "limit": limit,
            "access_token": self.access_token
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            result = response.json()

            posts = []
            for post in result.get("data", []):
                posts.append({
                    "id": post.get("id"),
                    "message": post.get("message", ""),
                    "created_time": post.get("created_time"),
                    "permalink": post.get("permalink_url"),
                    "likes": post.get("likes", {}).get("summary", {}).get("total_count", 0),
                    "comments": post.get("comments", {}).get("summary", {}).get("total_count", 0),
                    "shares": post.get("shares", {}).get("count", 0)
                })

            return posts

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error getting posts: {e}")
            return []

    def get_post_comments(self, post_id: str, limit: int = 25) -> List[Dict]:
        """Get comments on a specific post"""
        url = f"{self.base_url}/{post_id}/comments"

        params = {
            "fields": "id,from,message,created_time,like_count",
            "limit": limit,
            "access_token": self.access_token
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            result = response.json()

            comments = []
            for comment in result.get("data", []):
                comments.append({
                    "id": comment.get("id"),
                    "from": comment.get("from", {}).get("name", "Unknown"),
                    "message": comment.get("message", ""),
                    "created_time": comment.get("created_time"),
                    "likes": comment.get("like_count", 0)
                })

            return comments

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error getting comments: {e}")
            return []

    def reply_to_comment(self, comment_id: str, message: str) -> Dict:
        """Reply to a comment"""
        url = f"{self.base_url}/{comment_id}/comments"

        params = {
            "message": message,
            "access_token": self.access_token
        }

        try:
            response = requests.post(url, params=params)
            response.raise_for_status()
            result = response.json()

            self.logger.info(f"Replied to comment: {result.get('id')}")
            return {
                "success": True,
                "comment_id": result.get("id")
            }

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Error replying to comment: {e}")
            return {
                "success": False,
                "error": str(e)
            }
```

---

## 🔍 Step 3: Create Facebook Watcher

Create `src/watchers/facebook_watcher.py`:

```python
from base_watcher import BaseWatcher
from facebook_api_client import FacebookAPIClient
from pathlib import Path
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

class FacebookWatcher(BaseWatcher):
    def __init__(self, vault_path: str):
        super().__init__(vault_path, check_interval=300)  # Check every 5 minutes

        page_id = os.getenv("FACEBOOK_PAGE_ID")
        access_token = os.getenv("FACEBOOK_ACCESS_TOKEN")

        if not page_id or not access_token:
            raise ValueError("FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN must be set in .env")

        self.client = FacebookAPIClient(page_id, access_token)
        self.processed_posts = set()
        self.processed_comments = set()

    def check_for_updates(self) -> list:
        """Check Facebook for post engagement and comments"""
        items = []

        # Get recent posts
        posts = self.client.get_posts(limit=5)

        for post in posts:
            post_id = post["id"]

            # Check for high engagement
            total_engagement = post["likes"] + post["comments"] + post["shares"]

            if total_engagement > 10 and post_id not in self.processed_posts:
                items.append({
                    "type": "engagement",
                    "post_id": post_id,
                    "message": post["message"][:100],
                    "likes": post["likes"],
                    "comments": post["comments"],
                    "shares": post["shares"],
                    "permalink": post["permalink"],
                    "timestamp": datetime.now().isoformat()
                })
                self.processed_posts.add(post_id)

            # Check for new comments
            if post["comments"] > 0:
                comments = self.client.get_post_comments(post_id, limit=10)

                for comment in comments:
                    comment_id = comment["id"]

                    if comment_id not in self.processed_comments:
                        items.append({
                            "type": "comment",
                            "post_id": post_id,
                            "comment_id": comment_id,
                            "from": comment["from"],
                            "message": comment["message"],
                            "timestamp": comment["created_time"]
                        })
                        self.processed_comments.add(comment_id)

        return items

    def create_action_file(self, item) -> Path:
        """Create action file for Facebook activity"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        if item['type'] == 'engagement':
            filename = f"FACEBOOK_ENGAGEMENT_{timestamp}.md"
            content = f"""---
type: facebook_engagement
post_id: {item['post_id']}
received: {item['timestamp']}
priority: medium
status: pending
source: facebook_watcher
likes: {item['likes']}
comments: {item['comments']}
shares: {item['shares']}
---

## Post Engagement Summary

**Post**: {item['message']}

**Metrics**:
- 👍 Likes: {item['likes']}
- 💬 Comments: {item['comments']}
- 🔄 Shares: {item['shares']}

**Link**: {item['permalink']}

## Suggested Actions

- [ ] Review comments for questions/leads
- [ ] Respond to high-value comments
- [ ] Analyze what made this post successful
- [ ] Consider similar content for future posts
- [ ] Update engagement log
- [ ] Move to /Done when complete

## Engagement Analysis

High engagement detected. Review Business_Goals.md to see if this aligns with target messaging.
"""

        else:  # comment
            filename = f"FACEBOOK_COMMENT_{item['from'].replace(' ', '_')}_{timestamp}.md"
            content = f"""---
type: facebook_comment
post_id: {item['post_id']}
comment_id: {item['comment_id']}
from: {item['from']}
received: {item['timestamp']}
priority: medium
status: pending
source: facebook_watcher
---

## New Comment

**From**: {item['from']}

**Comment**:
{item['message']}

## Suggested Actions

- [ ] Review comment context
- [ ] Determine if response is needed
- [ ] Draft appropriate reply
- [ ] Create approval request if needed
- [ ] Reply via Facebook API
- [ ] Log interaction in Dashboard.md
- [ ] Move to /Done when complete

## Response Guidelines

Check Company_Handbook.md for Facebook communication guidelines.
If this appears to be a sales inquiry, flag as high priority.
"""

        filepath = self.needs_action / filename
        filepath.write_text(content, encoding='utf-8')
        self.logger.info(f'Created action file: {filename}')

        return filepath


# Main execution
if __name__ == '__main__':
    import sys
    import logging

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    if len(sys.argv) < 2:
        print('Usage: python facebook_watcher.py <vault_path>')
        sys.exit(1)

    vault_path = sys.argv[1]

    watcher = FacebookWatcher(vault_path)
    watcher.run()
```

---

## 📤 Step 4: Create Facebook Poster

Create `src/watchers/facebook_poster.py`:

```python
from facebook_api_client import FacebookAPIClient
from pathlib import Path
from datetime import datetime
import json
import logging
import os
from dotenv import load_dotenv

load_dotenv()

class FacebookPoster:
    def __init__(self, vault_path: str):
        self.vault_path = Path(vault_path)
        self.approved_folder = self.vault_path / 'Approved'
        self.logs_folder = self.vault_path / 'Logs'
        self.logger = logging.getLogger(self.__class__.__name__)

        page_id = os.getenv("FACEBOOK_PAGE_ID")
        access_token = os.getenv("FACEBOOK_ACCESS_TOKEN")

        if not page_id or not access_token:
            raise ValueError("FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN must be set in .env")

        self.client = FacebookAPIClient(page_id, access_token)

    def process_approved_posts(self):
        """Check for approved posts and publish them"""
        for file in self.approved_folder.glob('FACEBOOK_POST_*.md'):
            try:
                content = file.read_text(encoding='utf-8')

                # Extract post content
                lines = content.split('\n')
                post_lines = []
                in_post = False

                for line in lines:
                    if '## Post Content' in line:
                        in_post = True
                        continue
                    if in_post and line.startswith('##'):
                        break
                    if in_post:
                        post_lines.append(line)

                post_content = '\n'.join(post_lines).strip()

                # Check for link
                import re
                link_match = re.search(r'link:\s*(.+)', content)
                link = link_match.group(1).strip() if link_match else None

                if post_content:
                    result = self.client.post_message(post_content, link)

                    # Log result
                    log_file = self.logs_folder / f'facebook_posts_{datetime.now().strftime("%Y%m%d")}.json'
                    logs = []
                    if log_file.exists():
                        logs = json.loads(log_file.read_text())

                    logs.append({
                        **result,
                        "timestamp": datetime.now().isoformat(),
                        "file": file.name
                    })
                    log_file.write_text(json.dumps(logs, indent=2))

                    if result['success']:
                        # Move to Done
                        done_file = self.vault_path / 'Done' / file.name
                        file.rename(done_file)
                        self.logger.info(f'Posted and moved to Done: {file.name}')
                    else:
                        self.logger.error(f'Failed to post {file.name}: {result["error"]}')

            except Exception as e:
                self.logger.error(f'Error processing {file.name}: {e}')


if __name__ == '__main__':
    import sys

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    if len(sys.argv) < 2:
        print('Usage: python facebook_poster.py <vault_path>')
        sys.exit(1)

    vault_path = sys.argv[1]

    poster = FacebookPoster(vault_path)
    poster.process_approved_posts()
```

---

## ✅ Step 5: Test Your Setup

### Test 1: Verify API Connection

```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers

# Create test script
cat > test_facebook.py << 'EOF'
from src.watchers.facebook_api_client import FacebookAPIClient
import os
from dotenv import load_dotenv

load_dotenv()

client = FacebookAPIClient(
    os.getenv("FACEBOOK_PAGE_ID"),
    os.getenv("FACEBOOK_ACCESS_TOKEN")
)

# Test getting posts
print("Testing Facebook API connection...")
posts = client.get_posts(limit=3)
print(f"✅ Found {len(posts)} posts")

for post in posts:
    print(f"\nPost: {post['message'][:50]}...")
    print(f"  Likes: {post['likes']}, Comments: {post['comments']}, Shares: {post['shares']}")
EOF

uv run python test_facebook.py
```

### Test 2: Test Comment Detection

```bash
# Run watcher once
uv run python src/watchers/facebook_watcher.py ../AI_Employee_Vault

# Check if action files were created
ls ../AI_Employee_Vault/Needs_Action/FACEBOOK_*
```

---

## 🚀 Step 6: Start Services with PM2

```bash
# Start Facebook Watcher (runs continuously, checks every 5 min)
pm2 start "uv run python src/watchers/facebook_watcher.py ../AI_Employee_Vault" \
  --name facebook-watcher \
  --cwd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers

# Start Facebook Poster (runs every 15 minutes)
pm2 start "uv run python src/watchers/facebook_poster.py ../AI_Employee_Vault" \
  --name facebook-poster \
  --cron "*/15 * * * *" \
  --cwd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers

# Save configuration
pm2 save

# Check status
pm2 status
```

---

## 📝 Step 7: Create Your First Post

Create file: `AI_Employee_Vault/Pending_Approval/FACEBOOK_POST_test_20260321.md`

```markdown
---
type: approval_request
action: facebook_post
link: https://yourwebsite.com
created: 2026-03-21T22:15:00Z
priority: medium
status: pending
---

## Post Content

🚀 Testing our new AI Employee automation system!

This post was automatically created and will be published to Facebook via the Graph API.

#AI #Automation #Testing

## To Approve
Move this file to /Approved folder

## To Reject
Move this file to /Rejected folder
```

**To post it**:
```bash
# Move to Approved folder
mv AI_Employee_Vault/Pending_Approval/FACEBOOK_POST_test_20260321.md \
   AI_Employee_Vault/Approved/

# Wait up to 15 minutes for poster to run, or trigger manually:
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers
uv run python src/watchers/facebook_poster.py ../AI_Employee_Vault
```

---

## 🔍 Monitoring

### Check Logs

```bash
# PM2 logs
pm2 logs facebook-watcher --lines 50
pm2 logs facebook-poster --lines 50

# Check post logs
cat AI_Employee_Vault/Logs/facebook_posts_20260321.json
```

### Check Action Files

```bash
# New comments
ls AI_Employee_Vault/Needs_Action/FACEBOOK_COMMENT_*

# High engagement posts
ls AI_Employee_Vault/Needs_Action/FACEBOOK_ENGAGEMENT_*
```

---

## 🎯 How Comments Are Detected

**Every 5 minutes, the watcher**:

1. Calls `client.get_posts(limit=5)` → Gets your 5 most recent posts
2. For each post with comments > 0:
   - Calls `client.get_post_comments(post_id, limit=10)`
   - Gets up to 10 most recent comments
3. Checks each comment ID against `processed_comments` set
4. If new comment found:
   - Creates action file in `/Needs_Action/`
   - Adds comment ID to `processed_comments` (won't process again)

**The action file includes**:
- Comment author name
- Comment text
- Post ID and comment ID
- Timestamp
- Suggested actions for you

---

## 🎯 How Auto-Posting Works

**Every 15 minutes, the poster**:

1. Scans `/Approved/` folder for files matching `FACEBOOK_POST_*.md`
2. For each file:
   - Reads content
   - Extracts text under `## Post Content` section
   - Looks for `link:` in frontmatter
   - Calls `client.post_message(content, link)`
3. Logs result to `/Logs/facebook_posts_YYYYMMDD.json`
4. If successful:
   - Moves file to `/Done/`
5. If failed:
   - Keeps file in `/Approved/`
   - Logs error

---

## 🔧 Troubleshooting

### Issue: "FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN must be set"

**Solution**: Check your `.env` file location and content:
```bash
cd AI-Employee-Hackathon-0-Silver-tier/AI-Employee-Hackathon-0/AI-Employee-Hackathon-0-Silver-tier/watchers
cat .env
```

Should show:
```
FACEBOOK_PAGE_ID=123456789
FACEBOOK_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
```

### Issue: "Invalid OAuth access token"

**Solution**: Your token expired. Generate a new long-lived token:
```bash
curl "https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"
```

### Issue: No comments detected

**Check**:
1. Do your posts actually have comments?
2. Check watcher logs: `pm2 logs facebook-watcher`
3. Test manually: `uv run python src/watchers/facebook_watcher.py ../AI_Employee_Vault`

### Issue: Posts not publishing

**Check**:
1. Is file in `/Approved/` folder?
2. Does filename start with `FACEBOOK_POST_`?
3. Check poster logs: `pm2 logs facebook-poster`
4. Test manually: `uv run python src/watchers/facebook_poster.py ../AI_Employee_Vault`

---

## 📊 Rate Limits

Facebook Graph API limits:
- **200 calls/hour per user**
- **4800 calls/day per app**

Our usage:
- Watcher: 12 calls/hour (every 5 min) = 288/day ✅
- Poster: 4 calls/hour (every 15 min) = 96/day ✅
- **Total**: ~384 calls/day (well within limits)

---

## ✅ Summary

**You now have**:
1. ✅ Facebook API client with posting and monitoring
2. ✅ Watcher that detects comments every 5 minutes
3. ✅ Poster that publishes approved posts every 15 minutes
4. ✅ Action files created for all new comments
5. ✅ Comprehensive logging

**Next steps**:
1. Verify your `.env` file has correct keys
2. Create the 3 Python files above
3. Test the connection
4. Start PM2 services
5. Create your first post!

---

*Last Updated: 2026-03-21*
*Version: 2.0.0*
*Method: Facebook Graph API*
