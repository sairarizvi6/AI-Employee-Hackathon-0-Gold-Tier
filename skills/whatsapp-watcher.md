---
name: whatsapp-watcher
description: Monitor WhatsApp Web for urgent messages and create action items
version: 1.0.0
---

# WhatsApp Watcher Skill

This skill monitors WhatsApp Web for important messages and automatically creates action items in the vault when urgent keywords are detected.

## Purpose

Provides real-time monitoring of WhatsApp communications, enabling the AI Employee to respond to urgent client requests, support inquiries, and business communications without manual intervention.

## Architecture

Uses Playwright-based browser automation to:
- Monitor WhatsApp Web in headless mode
- Detect unread messages with priority keywords
- Extract message content and sender information
- Create structured action files in /Needs_Action

## Prerequisites

1. **Python Dependencies**:
   ```bash
   cd watchers
   uv add playwright
   uv run playwright install chromium
   ```

2. **WhatsApp Web Session**:
   - First run requires QR code scan
   - Session persists in `whatsapp_session/` folder
   - Keep session folder secure (add to .gitignore)

3. **Configuration**:
   - Define priority keywords in Company_Handbook.md
   - Set check interval (default: 30 seconds)
   - Configure vault path

## Implementation

### Base Watcher Integration

```python
# watchers/src/watchers/whatsapp_watcher.py
from playwright.sync_api import sync_playwright
from base_watcher import BaseWatcher
from pathlib import Path
from datetime import datetime
import json

class WhatsAppWatcher(BaseWatcher):
    def __init__(self, vault_path: str, session_path: str):
        super().__init__(vault_path, check_interval=30)
        self.session_path = Path(session_path)
        self.keywords = [
            'urgent', 'asap', 'invoice', 'payment',
            'help', 'emergency', 'important', 'deadline',
            'quote', 'pricing', 'proposal', 'meeting'
        ]
        self.processed_messages = set()

    def check_for_updates(self) -> list:
        """Check WhatsApp Web for unread messages with keywords"""
        messages = []

        with sync_playwright() as p:
            # Launch persistent context to maintain session
            browser = p.chromium.launch_persistent_context(
                str(self.session_path),
                headless=True,
                args=['--no-sandbox']
            )

            page = browser.pages[0] if browser.pages else browser.new_page()
            page.goto('https://web.whatsapp.com', timeout=60000)

            # Wait for WhatsApp to load
            try:
                page.wait_for_selector('[data-testid="chat-list"]', timeout=30000)
            except:
                self.logger.error('WhatsApp Web failed to load')
                browser.close()
                return messages

            # Find unread chats
            unread_chats = page.query_selector_all('[aria-label*="unread"]')

            for chat in unread_chats[:10]:  # Limit to 10 most recent
                try:
                    # Click chat to open
                    chat.click()
                    page.wait_for_timeout(1000)

                    # Get chat name
                    chat_name_elem = page.query_selector('[data-testid="conversation-header"]')
                    chat_name = chat_name_elem.inner_text() if chat_name_elem else 'Unknown'

                    # Get unread messages
                    message_elems = page.query_selector_all('[data-testid="msg-container"]')

                    for msg_elem in message_elems[-5:]:  # Last 5 messages
                        text_elem = msg_elem.query_selector('.copyable-text')
                        if not text_elem:
                            continue

                        message_text = text_elem.inner_text().lower()
                        message_id = f"{chat_name}_{hash(message_text)}"

                        # Check if already processed
                        if message_id in self.processed_messages:
                            continue

                        # Check for keywords
                        if any(kw in message_text for kw in self.keywords):
                            messages.append({
                                'chat': chat_name,
                                'text': text_elem.inner_text(),
                                'timestamp': datetime.now().isoformat(),
                                'id': message_id
                            })
                            self.processed_messages.add(message_id)

                except Exception as e:
                    self.logger.error(f'Error processing chat: {e}')
                    continue

            browser.close()

        return messages

    def create_action_file(self, message) -> Path:
        """Create action file in Needs_Action folder"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"WHATSAPP_{message['chat'].replace(' ', '_')}_{timestamp}.md"

        content = f"""---
type: whatsapp_message
from: {message['chat']}
received: {message['timestamp']}
priority: high
status: pending
source: whatsapp_watcher
---

## Message Content

{message['text']}

## Suggested Actions

- [ ] Read and understand the request
- [ ] Check if this requires approval (use approval-workflow skill)
- [ ] Draft response
- [ ] Send reply via WhatsApp
- [ ] Log interaction in Dashboard.md
- [ ] Move to /Done when complete

## Context

This message was flagged as urgent based on keyword detection.
Review Company_Handbook.md for response guidelines.

## Response Template

```
Hi {message['chat']},

Thank you for your message. [Your response here]

Best regards,
[Your name]
```
"""

        filepath = self.needs_action / filename
        filepath.write_text(content, encoding='utf-8')
        self.logger.info(f'Created action file: {filename}')

        return filepath

# Main execution
if __name__ == '__main__':
    import sys

    if len(sys.argv) < 3:
        print('Usage: python whatsapp_watcher.py <vault_path> <session_path>')
        sys.exit(1)

    vault_path = sys.argv[1]
    session_path = sys.argv[2]

    watcher = WhatsAppWatcher(vault_path, session_path)
    watcher.run()
```

## Setup Instructions

### Step 1: Create Session Folder

```bash
mkdir -p watchers/whatsapp_session
echo "whatsapp_session/" >> .gitignore
```

### Step 2: First Run (QR Code Scan)

```bash
cd watchers
uv run python src/watchers/whatsapp_watcher.py ../AI_Employee_Vault whatsapp_session
```

- Browser will open (non-headless first time)
- Scan QR code with your phone
- Wait for WhatsApp to load
- Press Ctrl+C to stop
- Session is now saved

### Step 3: Run in Background

```bash
# Using PM2 (recommended)
pm2 start "uv run python src/watchers/whatsapp_watcher.py ../AI_Employee_Vault whatsapp_session" --name whatsapp-watcher

# Or using nohup
nohup uv run python src/watchers/whatsapp_watcher.py ../AI_Employee_Vault whatsapp_session > whatsapp.log 2>&1 &
```

## Configuration

### Customize Keywords

Edit the keywords list in `whatsapp_watcher.py`:

```python
self.keywords = [
    'urgent', 'asap', 'invoice', 'payment',
    # Add your custom keywords
    'contract', 'signature', 'approval'
]
```

### Adjust Check Interval

```python
# Check every 60 seconds instead of 30
super().__init__(vault_path, check_interval=60)
```

## Usage Examples

### Example 1: Client Invoice Request

**WhatsApp Message**: "Hi, can you send me the invoice for January? Need it ASAP for accounting."

**Created File**: `/Needs_Action/WHATSAPP_Client_A_20260225_151430.md`

**Claude Action**:
1. Reads the action file
2. Uses plan-generator to create invoice plan
3. Uses approval-workflow for sending invoice
4. Logs completion in Dashboard.md

### Example 2: Urgent Support Request

**WhatsApp Message**: "URGENT: Website is down, clients can't access portal"

**Created File**: `/Needs_Action/WHATSAPP_Tech_Team_20260225_151430.md`

**Claude Action**:
1. Flags as critical priority
2. Creates immediate response plan
3. Notifies human via approval request
4. Logs incident in /Logs

### Example 3: Pricing Inquiry

**WhatsApp Message**: "What's your pricing for the premium package?"

**Created File**: `/Needs_Action/WHATSAPP_Potential_Client_20260225_151430.md`

**Claude Action**:
1. Reads Business_Goals.md for pricing
2. Drafts response with pricing details
3. Creates approval request (new contact)
4. Waits for approval before sending

## Security Considerations

### Session Security

- **Never commit** `whatsapp_session/` folder to git
- Store session folder outside vault if possible
- Rotate session monthly (logout and re-scan)
- Use encrypted disk for session storage

### Privacy

- Only process messages with explicit keywords
- Don't log full message history
- Respect WhatsApp Terms of Service
- Inform contacts about automation (in Company_Handbook.md)

### Rate Limiting

- Default 30-second check interval prevents rate limits
- Don't reduce below 15 seconds
- Monitor for WhatsApp Web blocks
- Have fallback to manual checking

## Monitoring & Debugging

### Check Watcher Status

```bash
# If using PM2
pm2 status whatsapp-watcher
pm2 logs whatsapp-watcher

# If using nohup
tail -f whatsapp.log
```

### Common Issues

**Issue**: QR code expired
- **Solution**: Delete session folder, run first-time setup again

**Issue**: WhatsApp Web not loading
- **Solution**: Check internet connection, verify Playwright installation

**Issue**: Messages not detected
- **Solution**: Verify keywords match, check message is unread

**Issue**: Session logged out
- **Solution**: Re-scan QR code, check session folder permissions

## Integration with Other Skills

Works with:
- **plan-generator**: Creates plans for complex WhatsApp requests
- **approval-workflow**: Requires approval for sensitive responses
- **vault-manager**: Manages action files and completion
- **email-sender**: Can escalate to email if needed

## Best Practices

1. **Keyword Tuning**: Start with broad keywords, refine based on false positives
2. **Response Time**: Aim to process urgent messages within 5 minutes
3. **Human Oversight**: Always require approval for new contacts
4. **Logging**: Log all detected messages for audit trail
5. **Testing**: Test with personal WhatsApp first before business use
6. **Backup**: Have manual WhatsApp monitoring as fallback

## Limitations

- Requires active internet connection
- WhatsApp Web session can expire
- Can't send messages (requires separate MCP server)
- Limited to text messages (no media processing)
- Subject to WhatsApp's automation policies

## Future Enhancements (Gold Tier)

- WhatsApp MCP server for sending replies
- Media file processing (images, documents)
- Group chat monitoring
- Sentiment analysis for priority detection
- Auto-response for common queries
