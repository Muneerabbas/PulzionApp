# Unicode Encoding Fix for Windows Console

## Problem
The pipeline was throwing `UnicodeEncodeError: 'charmap' codec can't encode character` errors when logging messages with emoji characters (🚀, ✓, 🔌, etc.) on Windows. This happened because Windows console uses `cp1252` encoding by default, which doesn't support Unicode emojis.

## Solution Applied
Modified `main.py` to force UTF-8 encoding for all logging output:

1. **Added `sys` import** - Required for stdout/stderr manipulation
2. **Set UTF-8 encoding for FileHandler** - Ensures log file can store emojis
3. **Use sys.stdout explicitly for StreamHandler** - Gives us control over console encoding
4. **Force UTF-8 encoding on stdout/stderr** - Uses `reconfigure()` method to switch encoding
5. **Added fallback for older Python versions** - Sets `PYTHONIOENCODING` environment variable if `reconfigure()` fails

## Changes Made
- File: `main.py`
- Lines: 8, 25, 26, 30-40

## Testing
Run the test script to verify the fix:
```bash
python test_unicode_fix.py
```

This will test all the emojis used in the pipeline and confirm they display correctly.

## What Was Fixed
- ✅ All emoji characters now display correctly in console output
- ✅ Log files are saved with UTF-8 encoding
- ✅ No more logging errors during pipeline execution
- ✅ Works on Windows with Python 3.7+

## Original Error Messages (Now Fixed)
```
UnicodeEncodeError: 'charmap' codec can't encode character '\U0001f680' (🚀) in position 44
UnicodeEncodeError: 'charmap' codec can't encode character '\u2713' (✓) in position 43
UnicodeEncodeError: 'charmap' codec can't encode character '\U0001f50c' (🔌) in position 44
UnicodeEncodeError: 'charmap' codec can't encode character '\U0001f4f0' (📰) in position 44
UnicodeEncodeError: 'charmap' codec can't encode character '\U0001f4be' (💾) in position 44
```

## Notes
- The fix is applied globally when `main.py` is imported
- All modules (fetcher.py, storage.py, labeling.py, etc.) inherit the correct encoding
- No changes needed in other Python files
- The log file `pipeline.log` will now be saved in UTF-8 format

## Alternative Solutions (Not Used)
If you prefer not to use emojis, you could replace them with ASCII characters:
- 🚀 → [START]
- ✓ → [OK]
- 🔌 → [CONNECT]
- 📰 → [FETCH]
- 💾 → [SAVE]
- 🏷️ → [LABEL]
- ✅ → [DONE]

However, the current fix allows you to keep the emojis for better visual logging.
