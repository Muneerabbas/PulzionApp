# 🔑 Multiple API Keys Guide

This guide explains how to configure and use multiple NewsAPI keys for automatic fallback and increased rate limits.

## Why Use Multiple API Keys?

**NewsAPI Free Tier Limits:**
- 100 requests per day
- 1,000 results per day

**With Multiple Keys:**
- Automatic fallback when one key hits rate limit
- Effectively multiplies your daily limits
- No interruption in article fetching
- Better resilience to API errors

## How It Works

The pipeline automatically:
1. Uses the first API key
2. Detects rate limit errors (429), authentication failures (401, 403)
3. Rotates to the next available key
4. Retries the failed request with the new key
5. Logs all key rotations for transparency

## Setup Instructions

### Step 1: Get Additional API Keys

1. Go to https://newsapi.org/register
2. Sign up with different email addresses (use aliases if needed)
3. Get multiple free API keys

### Step 2: Add Keys to Configuration

Edit `config.py`:

```python
# Multiple API keys for automatic fallback
NEWS_API_KEYS = [
    "5d4f2e276bf24a6f8b89f8a823948485",  # Primary key
    "abc123def456ghi789jkl012mno345pqr",  # Backup key 1
    "xyz987wvu654tsr321qpo098nml765kji",  # Backup key 2
    # Add as many as you need
]
```

### Step 3: Run the Pipeline

That's it! The pipeline will automatically use all keys with fallback.

## Monitoring Key Usage

The logs will show which key is being used:

```
INFO - Fetching articles for topic: 'AI' [Key #1]
WARNING - API key error (429) for 'AI' - attempting key rotation
WARNING - Rotating API key: ...f8a823948485 -> ...ghi789jkl012
INFO - Fetching articles for topic: 'AI' [Key #2]
✓ Received 20 articles for 'AI'
```

## Best Practices

### 1. Use 3-5 API Keys

For running the full pipeline (30+ topics):
- 1 key = ~100 requests (might hit limit)
- 3 keys = ~300 requests (recommended)
- 5 keys = ~500 requests (covers full pipeline)

### 2. Monitor Key Health

Check logs regularly to see which keys are being used and rotated.

### 3. Stagger Key Creation

If creating multiple keys:
- Use different email addresses
- Create them on different days
- Avoid patterns that might trigger API provider detection

### 4. Test Individual Keys

Before adding keys to config, test them individually:

```python
import requests

api_key = "your_test_key_here"
url = f"https://newsapi.org/v2/everything?q=test&apiKey={api_key}"
response = requests.get(url)

if response.status_code == 200:
    print("✓ Key is valid!")
else:
    print(f"✗ Key error: {response.status_code}")
```

## Advanced Configuration

### Temporary Key Disabling

Comment out keys you want to temporarily disable:

```python
NEWS_API_KEYS = [
    "5d4f2e276bf24a6f8b89f8a823948485",
    # "abc123def456ghi789jkl012mno345pqr",  # Temporarily disabled
    "xyz987wvu654tsr321qpo098nml765kji",
]
```

### Environment Variables

For security, use environment variables:

```python
# In config.py
import os

NEWS_API_KEYS = [
    os.getenv("NEWS_API_KEY_1", "5d4f2e276bf24a6f8b89f8a823948485"),
    os.getenv("NEWS_API_KEY_2", ""),
    os.getenv("NEWS_API_KEY_3", ""),
]

# Filter out empty keys
NEWS_API_KEYS = [key for key in NEWS_API_KEYS if key]
```

Then set environment variables:

```powershell
# Windows PowerShell
$env:NEWS_API_KEY_1 = "your_first_key"
$env:NEWS_API_KEY_2 = "your_second_key"
$env:NEWS_API_KEY_3 = "your_third_key"
```

## Troubleshooting

### "No API keys configured"

**Problem:** Empty NEWS_API_KEYS list

**Solution:** Add at least one valid API key to config.py

### "All API keys have failed"

**Problem:** All keys are rate-limited or invalid

**Solutions:**
1. Wait 24 hours for rate limits to reset
2. Add more keys
3. Check if keys are still valid at https://newsapi.org/account

### Keys rotating too frequently

**Problem:** Keys hitting limits quickly

**Solutions:**
1. Reduce concurrent requests in config:
   ```python
   MAX_CONCURRENT_REQUESTS = 2  # Lower from 5
   ```
2. Process fewer topics at once
3. Add more API keys

### Key rotation not working

**Check:**
1. Multiple keys are in NEWS_API_KEYS list
2. Keys are properly formatted (no extra spaces)
3. Log level is set to INFO to see rotation messages

## Rate Limit Calculator

With 30 topics + top headlines:
- **1 key**: ~31 requests ✅ Well within limit
- **3 keys**: ~93 requests ✅ Plenty of headroom
- **5 keys**: ~155 requests ✅ Maximum resilience

But if one key is rate-limited during peak times, having multiple keys ensures uninterrupted operation.

## Security Tips

1. **Never commit API keys to Git**
   - Use environment variables
   - Add `.env` to `.gitignore`
   - Use config files that are gitignored

2. **Rotate keys periodically**
   - Get fresh keys every few months
   - Remove compromised keys immediately

3. **Monitor for unauthorized usage**
   - Check NewsAPI dashboard regularly
   - Watch for unexpected request patterns

## Example Scenarios

### Scenario 1: Development (1 key)
```python
NEWS_API_KEYS = [
    "5d4f2e276bf24a6f8b89f8a823948485",
]
```
Good for testing with limited topics.

### Scenario 2: Production (3 keys)
```python
NEWS_API_KEYS = [
    "5d4f2e276bf24a6f8b89f8a823948485",
    "abc123def456ghi789jkl012mno345pqr",
    "xyz987wvu654tsr321qpo098nml765kji",
]
```
Recommended for daily/weekly full pipeline runs.

### Scenario 3: High Volume (5+ keys)
```python
NEWS_API_KEYS = [
    "key1", "key2", "key3", "key4", "key5",
]
```
For continuous operation or multiple daily runs.

## FAQ

**Q: Can I mix free and paid API keys?**  
A: Yes! The pipeline works with any valid NewsAPI key.

**Q: Will it slow down the pipeline?**  
A: No. Key rotation happens only on errors and is nearly instantaneous.

**Q: Do I need to restart after adding keys?**  
A: Yes, restart the pipeline to load new keys from config.py.

**Q: Can I see which articles were fetched with which key?**  
A: The logs show which key was active for each request. Each article doesn't track its source key.

---

**Happy fetching with multiple API keys! 🚀**
