"""
Test script to verify Unicode emoji handling in logs.
Run this to confirm the fix works before running the full pipeline.
"""

import logging
import sys

# Apply the same fix as main.py
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("test_unicode.log", encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

# Force UTF-8 encoding for stdout/stderr on Windows
try:
    if sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr.reconfigure(encoding='utf-8')
except (AttributeError, OSError):
    import os
    os.environ['PYTHONIOENCODING'] = 'utf-8'

logger = logging.getLogger(__name__)

# Test all the emojis used in the pipeline
def test_unicode_logging():
    """Test that all Unicode characters log correctly."""
    print("Testing Unicode emoji logging...")
    print(f"Current stdout encoding: {sys.stdout.encoding}")
    print(f"Current stderr encoding: {sys.stderr.encoding}")
    print()
    
    # Test each emoji from the pipeline
    logger.info("🚀 NEWS ARTICLE PIPELINE STARTED")
    logger.info("🔌 Connecting to database...")
    logger.info("✓ Connected to MongoDB")
    logger.info("📰 STAGE 1: FETCHING ARTICLES")
    logger.info("✓ Received 20 articles")
    logger.info("💾 STAGE 2: STORING ARTICLES")
    logger.info("✓ Saved articles - New: 540, Updated: 0")
    logger.info("🏷️  STAGE 3: LABELING ARTICLES")
    logger.info("✅ PIPELINE COMPLETED SUCCESSFULLY")
    logger.info("📊 SUMMARY STATISTICS:")
    logger.info("⏱️  TIMING BREAKDOWN:")
    logger.info("⚡ Average processing speed: 10.5 articles/second")
    
    print()
    print("✅ All Unicode emojis logged successfully!")
    print("If you can see all emojis above without errors, the fix is working.")

if __name__ == "__main__":
    test_unicode_logging()
