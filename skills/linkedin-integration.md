---
name: linkedin-integration
description: Monitor LinkedIn, create posts, and generate sales leads
version: 1.0.0
---

# LinkedIn Integration Skill

This skill enables the AI Employee to monitor LinkedIn messages, automatically post content to generate sales leads, and track engagement metrics.

## Purpose

Automates LinkedIn presence for business development by:
- Monitoring LinkedIn messages and connection requests
- Creating and scheduling posts about business offerings
- Generating sales leads through strategic content
- Tracking engagement and lead quality

## Architecture

Uses Playwright-based browser automation to:
- Monitor LinkedIn inbox for messages
- Create and publish posts
- Track post engagement (likes, comments, shares)
- Extract lead information from interactions

## Prerequisites

1. **Python Dependencies**:
   ```bash
   cd watchers
   uv add playwright
   uv run playwright install chromium
   ```

2. **LinkedIn Session**:
   - First run requires manual login
   - Session persists in `linkedin_session/` folder
   - Keep session folder secure (add to .gitignore)

3. **Configuration**:
   - Define posting schedule in Company_Handbook.md
   - Set content themes in Business_Goals.md
   - Configure engagement thresholds

## Implementation

### LinkedIn Watcher

```python
# watchers/src/watchers/linkedin_watcher.py
from playwright.sync_api import sync_playwright
from base_watcher import BaseWatcher
from pathlib import Path
from datetime import datetime
import json

class LinkedInWatcher(BaseWatcher):
    def __init__(self, vault_path: str, session_path: str):
        super().__init__(vault_path, check_interval=120)  # Check every 2 minutes
        self.session_path = Path(session_path)
        self.processed_items = set()

    def check_for_updates(self) -> list:
        """Check LinkedIn for new messages and connection requests"""
        items = []

        with sync_playwright() as p:
            browser = p.chromium.launch_persistent_context(
                str(self.session_path),
                headless=True,
                args=['--no-sandbox']
            )

            page = browser.pages[0] if browser.pages else browser.new_page()
            page.goto('https://www.linkedin.com/messaging/', timeout=60000)

            try:
                # Wait for messaging to load
                page.wait_for_selector('[data-control-name="view_message"]', timeout=30000)

                # Get unread messages
                unread_convos = page.query_selector_all('.msg-conversation-listitem--unread')

                for convo in unread_convos[:5]:  # Process top 5
                    try:
                        convo.click()
                        page.wait_for_timeout(2000)

                        # Get sender name
                        sender_elem = page.query_selector('.msg-entity-lockup__entity-title')
                        sender = sender_elem.inner_text() if sender_elem else 'Unknown'

                        # Get message text
                        messages = page.query_selector_all('.msg-s-event-listitem__body')
                        if messages:
                            latest_msg = messages[-1].inner_text()
                            msg_id = f"linkedin_msg_{hash(sender + latest_msg)}"

                            if msg_id not in self.processed_items:
                                items.append({
                                    'type': 'message',
                                    'from': sender,
                                    'text': latest_msg,
                                    'timestamp': datetime.now().isoformat(),
                                    'id': msg_id
                                })
                                self.processed_items.add(msg_id)

                    except Exception as e:
                        self.logger.error(f'Error processing conversation: {e}')
                        continue

                # Check connection requests
                page.goto('https://www.linkedin.com/mynetwork/invitation-manager/', timeout=30000)
                page.wait_for_timeout(3000)

                invitations = page.query_selector_all('[data-control-name="accept"]')

                for inv in invitations[:3]:  # Process top 3
                    try:
                        # Get inviter info
                        card = inv.locator('xpath=ancestor::li')
                        name_elem = card.query_selector('.invitation-card__name')
                        headline_elem = card.query_selector('.invitation-card__occupation')

                        if name_elem:
                            name = name_elem.inner_text()
                            headline = headline_elem.inner_text() if headline_elem else 'No headline'
                            inv_id = f"linkedin_inv_{hash(name)}"

                            if inv_id not in self.processed_items:
                                items.append({
                                    'type': 'connection_request',
                                    'from': name,
                                    'headline': headline,
                                    'timestamp': datetime.now().isoformat(),
                                    'id': inv_id
                                })
                                self.processed_items.add(inv_id)

                    except Exception as e:
                        self.logger.error(f'Error processing invitation: {e}')
                        continue

            except Exception as e:
                self.logger.error(f'LinkedIn check failed: {e}')

            browser.close()

        return items

    def create_action_file(self, item) -> Path:
        """Create action file for LinkedIn activity"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        if item['type'] == 'message':
            filename = f"LINKEDIN_MSG_{item['from'].replace(' ', '_')}_{timestamp}.md"
            content = f"""---
type: linkedin_message
from: {item['from']}
received: {item['timestamp']}
priority: medium
status: pending
source: linkedin_watcher
---

## Message Content

{item['text']}

## Suggested Actions

- [ ] Review sender's profile for context
- [ ] Determine if this is a sales lead
- [ ] Draft appropriate response
- [ ] Create approval request if needed
- [ ] Send reply via LinkedIn
- [ ] Log interaction in Dashboard.md
- [ ] Move to /Done when complete

## Response Guidelines

Check Company_Handbook.md for LinkedIn communication guidelines.
If this appears to be a sales inquiry, flag as high priority.
"""

        else:  # connection_request
            filename = f"LINKEDIN_CONNECT_{item['from'].replace(' ', '_')}_{timestamp}.md"
            content = f"""---
type: linkedin_connection
from: {item['from']}
headline: {item['headline']}
received: {item['timestamp']}
priority: low
status: pending
source: linkedin_watcher
---

## Connection Request

**Name**: {item['from']}
**Headline**: {item['headline']}

## Suggested Actions

- [ ] Review profile to assess relevance
- [ ] Check if they match target customer profile
- [ ] Accept or decline connection
- [ ] If accepted, send welcome message
- [ ] Add to CRM/contact list
- [ ] Move to /Done when complete

## Evaluation Criteria

Review Business_Goals.md for target customer profile.
Accept if:
- Relevant industry/role
- Potential customer or partner
- Valuable network connection

Decline if:
- Spam/irrelevant
- Competitor research
- No clear business value
"""

        filepath = self.needs_action / filename
        filepath.write_text(content, encoding='utf-8')
        self.logger.info(f'Created action file: {filename}')

        return filepath


# Main execution
if __name__ == '__main__':
    import sys

    if len(sys.argv) < 3:
        print('Usage: python linkedin_watcher.py <vault_path> <session_path>')
        sys.exit(1)

    vault_path = sys.argv[1]
    session_path = sys.argv[2]

    watcher = LinkedInWatcher(vault_path, session_path)
    watcher.run()
```

### LinkedIn Post Generator

```python
# watchers/src/watchers/linkedin_poster.py
from playwright.sync_api import sync_playwright
from pathlib import Path
from datetime import datetime
import json

class LinkedInPoster:
    def __init__(self, session_path: str, vault_path: str):
        self.session_path = Path(session_path)
        self.vault_path = Path(vault_path)
        self.approved_folder = self.vault_path / 'Approved'
        self.logs_folder = self.vault_path / 'Logs'

    def post_to_linkedin(self, post_content: str, post_id: str) -> dict:
        """Post content to LinkedIn"""
        result = {
            'success': False,
            'post_id': post_id,
            'timestamp': datetime.now().isoformat(),
            'error': None
        }

        with sync_playwright() as p:
            browser = p.chromium.launch_persistent_context(
                str(self.session_path),
                headless=True
            )

            try:
                page = browser.pages[0] if browser.pages else browser.new_page()
                page.goto('https://www.linkedin.com/feed/', timeout=60000)
                page.wait_for_timeout(3000)

                # Click "Start a post" button
                start_post = page.query_selector('[data-control-name="share_to_linkedin"]')
                if start_post:
                    start_post.click()
                    page.wait_for_timeout(2000)

                    # Enter post content
                    editor = page.query_selector('.ql-editor')
                    if editor:
                        editor.fill(post_content)
                        page.wait_for_timeout(1000)

                        # Click Post button
                        post_button = page.query_selector('[data-control-name="share.post"]')
                        if post_button:
                            post_button.click()
                            page.wait_for_timeout(3000)

                            result['success'] = True
                            result['message'] = 'Post published successfully'
                        else:
                            result['error'] = 'Post button not found'
                    else:
                        result['error'] = 'Editor not found'
                else:
                    result['error'] = 'Start post button not found'

            except Exception as e:
                result['error'] = str(e)

            browser.close()

        # Log result
        log_file = self.logs_folder / f'linkedin_posts_{datetime.now().strftime("%Y%m%d")}.json'
        logs = []
        if log_file.exists():
            logs = json.loads(log_file.read_text())
        logs.append(result)
        log_file.write_text(json.dumps(logs, indent=2))

        return result

    def process_approved_posts(self):
        """Check for approved posts and publish them"""
        for file in self.approved_folder.glob('LINKEDIN_POST_*.md'):
            try:
                content = file.read_text(encoding='utf-8')

                # Extract post content (between ## Post Content and next ##)
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

                if post_content:
                    result = self.post_to_linkedin(post_content, file.stem)

                    if result['success']:
                        # Move to Done
                        done_file = self.vault_path / 'Done' / file.name
                        file.rename(done_file)
                        print(f'Posted and moved to Done: {file.name}')
                    else:
                        print(f'Failed to post {file.name}: {result["error"]}')

            except Exception as e:
                print(f'Error processing {file.name}: {e}')


if __name__ == '__main__':
    import sys

    if len(sys.argv) < 3:
        print('Usage: python linkedin_poster.py <session_path> <vault_path>')
        sys.exit(1)

    session_path = sys.argv[1]
    vault_path = sys.argv[2]

    poster = LinkedInPoster(session_path, vault_path)
    poster.process_approved_posts()
```

## Setup Instructions

### Step 1: Create Session Folder

```bash
mkdir -p watchers/linkedin_session
echo "linkedin_session/" >> .gitignore
```

### Step 2: First Run (Manual Login)

```bash
cd watchers
# Run with headless=False first time
uv run python src/watchers/linkedin_watcher.py ../AI_Employee_Vault linkedin_session
```

- Browser opens, login to LinkedIn
- Wait for feed to load
- Press Ctrl+C to stop
- Session is now saved

### Step 3: Run Watcher in Background

```bash
pm2 start "uv run python src/watchers/linkedin_watcher.py ../AI_Employee_Vault linkedin_session" --name linkedin-watcher
```

### Step 4: Schedule Post Publisher

```bash
# Run every 15 minutes to check for approved posts
pm2 start "uv run python src/watchers/linkedin_poster.py linkedin_session ../AI_Employee_Vault" --name linkedin-poster --cron "*/15 * * * *"
```

## Usage Examples

### Example 1: Create LinkedIn Post for Lead Generation

**User Request**: "Create LinkedIn posts to generate sales leads"

**Claude Action**:
1. Reads Business_Goals.md for value propositions
2. Creates 3 post drafts in /Plans
3. Creates approval requests in /Pending_Approval

**Approval File**: `/Pending_Approval/LINKEDIN_POST_product_launch_20260225.md`

```markdown
---
type: approval_request
action: linkedin_post
created: 2026-02-25T15:16:00Z
priority: medium
status: pending
---

## Post Content

🚀 Excited to share how we're helping businesses automate their workflows with AI!

Our latest solution reduces manual data entry by 85% and saves teams 20+ hours per week.

Key benefits:
✅ Local-first architecture (your data stays yours)
✅ Human-in-the-loop for critical decisions
✅ Seamless integration with existing tools

Interested in learning how AI can transform your operations? Let's connect! 👇

#AI #Automation #BusinessEfficiency #DigitalTransformation

## To Approve
Move this file to /Approved folder

## To Reject
Move this file to /Rejected folder
```

**After Approval**: Poster script publishes to LinkedIn and logs result

### Example 2: Respond to LinkedIn Message

**LinkedIn Message**: "Hi, I saw your post about AI automation. Can you share pricing for your services?"

**Created File**: `/Needs_Action/LINKEDIN_MSG_John_Smith_20260225_151600.md`

**Claude Action**:
1. Reads Business_Goals.md for pricing
2. Creates response plan
3. Drafts reply message
4. Creates approval request (new contact)

### Example 3: Connection Request Evaluation

**Connection Request**: "Sarah Johnson - VP of Operations at Tech Corp"

**Created File**: `/Needs_Action/LINKEDIN_CONNECT_Sarah_Johnson_20260225_151600.md`

**Claude Action**:
1. Evaluates against target customer profile
2. Recommends accept (relevant role/company)
3. Drafts welcome message
4. Creates approval request

## Post Content Strategy

### Content Themes (from Business_Goals.md)

1. **Value Proposition Posts**: Highlight key benefits
2. **Case Study Posts**: Share success stories
3. **Educational Posts**: Teach concepts related to your offering
4. **Engagement Posts**: Ask questions, start discussions
5. **Behind-the-Scenes**: Show your process/team

### Posting Schedule

- **Monday**: Motivational/industry insights
- **Wednesday**: Educational content
- **Friday**: Case studies/results

### Best Practices

- Keep posts 150-200 words
- Include 3-5 relevant hashtags
- Add clear call-to-action
- Use emojis sparingly (2-3 per post)
- Tag relevant companies/people when appropriate

## Engagement Tracking

### Metrics to Monitor

```markdown
# /Logs/linkedin_engagement_2026-02.md

## Post Performance

| Date | Post Topic | Likes | Comments | Shares | Leads |
|------|-----------|-------|----------|--------|-------|
| 02-25 | AI Automation | 45 | 8 | 3 | 2 |
| 02-22 | Case Study | 67 | 12 | 5 | 4 |
| 02-20 | Industry Trends | 34 | 5 | 1 | 1 |

## Lead Quality

- High: 3 (decision makers, relevant industry)
- Medium: 2 (interested but need nurturing)
- Low: 2 (general interest, not qualified)
```

## Security & Compliance

### LinkedIn Terms of Service

- Don't automate connection requests excessively
- Limit posts to 1-2 per day maximum
- Don't scrape data beyond your own activity
- Respect rate limits (2-minute check intervals)

### Session Security

- Never commit `linkedin_session/` to git
- Rotate session monthly
- Use 2FA on LinkedIn account
- Monitor for unusual activity

### Privacy

- Don't store message content long-term
- Respect connection privacy
- Follow GDPR/data protection laws
- Include automation disclosure in profile

## Integration with Other Skills

Works with:
- **plan-generator**: Creates content calendars
- **approval-workflow**: Requires approval for all posts
- **vault-manager**: Manages action files
- **email-sender**: Can escalate to email for serious leads

## Monitoring & Debugging

### Check Status

```bash
pm2 status linkedin-watcher
pm2 logs linkedin-watcher --lines 50
```

### Common Issues

**Issue**: Session expired
- **Solution**: Delete session folder, re-login

**Issue**: Posts not publishing
- **Solution**: Check /Logs for errors, verify approval file format

**Issue**: Messages not detected
- **Solution**: Verify LinkedIn inbox is accessible, check selectors

## Future Enhancements (Gold Tier)

- Sentiment analysis on messages
- Auto-response to common questions
- Lead scoring based on profile data
- A/B testing for post content
- Integration with CRM systems
- Analytics dashboard in Obsidian
