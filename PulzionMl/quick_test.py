"""
Quick test script to verify the pipeline works end-to-end.
Tests with a small sample of 2 topics.
"""

import asyncio
import logging
from datetime import datetime

import config
from fetcher import fetch_articles
from storage import ArticleStorage
from labeling import ArticleLabeler
from embeddings import EmbeddingGenerator
from analyzer import ArticleAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format=config.LOG_FORMAT
)

logger = logging.getLogger(__name__)


async def quick_test():
    """Run a quick test with minimal data."""
    print("="*80)
    print("🧪 QUICK PIPELINE TEST")
    print("   Testing with 2 topics: 'AI' and 'cryptocurrency'")
    print("="*80)
    print()
    
    try:
        # Test topics
        test_topics = ["artificial intelligence", "cryptocurrency"]
        
        # 1. Fetch
        print("1️⃣  Fetching articles...")
        articles = await fetch_articles(test_topics)
        print(f"   ✓ Fetched {len(articles)} articles")
        
        if not articles:
            print("   ❌ No articles fetched. Check your API key and internet connection.")
            return False
        
        # Show sample article
        print(f"\n   Sample article:")
        print(f"   Title: {articles[0]['title']}")
        print(f"   Source: {articles[0]['source']}")
        print()
        
        # 2. Storage
        print("2️⃣  Testing database storage...")
        storage = ArticleStorage()
        result = storage.save_articles(articles[:5])  # Save only 5 for testing
        print(f"   ✓ Saved {result['inserted']} new articles")
        print()
        
        # 3. Labeling
        print("3️⃣  Testing article labeling...")
        labeler = ArticleLabeler()
        labeled = labeler.label_articles_batch(articles[:3], multi_label=True)  # Test 3
        print(f"   ✓ Labeled {len([a for a in labeled if a.get('categories')])} articles")
        if labeled and labeled[0].get('categories'):
            print(f"   Categories: {labeled[0]['categories']}")
        print()
        
        # 4. Embeddings
        print("4️⃣  Testing embedding generation...")
        generator = EmbeddingGenerator()
        embedded = generator.generate_embeddings_batch(articles[:3], show_progress=False)
        print(f"   ✓ Generated {len([a for a in embedded if a.get('embedding')])} embeddings")
        if embedded and embedded[0].get('embedding_dim'):
            print(f"   Embedding dimension: {embedded[0]['embedding_dim']}")
        print()
        
        # 5. Analysis
        print("5️⃣  Testing article analysis...")
        analyzer = ArticleAnalyzer()
        analyzed = analyzer.analyze_articles_batch(articles[:3])
        kw_count = len([a for a in analyzed if a.get('keywords')])
        sent_count = len([a for a in analyzed if a.get('sentiment')])
        print(f"   ✓ Extracted keywords: {kw_count} articles")
        print(f"   ✓ Analyzed sentiment: {sent_count} articles")
        if analyzed and analyzed[0].get('keywords'):
            print(f"   Sample keywords: {analyzed[0]['keywords'][:5]}")
            print(f"   Sample sentiment: {analyzed[0].get('sentiment', 'N/A')}")
        print()
        
        # 6. Database retrieval
        print("6️⃣  Testing database retrieval...")
        retrieved = storage.get_articles(limit=3)
        print(f"   ✓ Retrieved {len(retrieved)} articles from database")
        
        # Statistics
        stats = storage.get_statistics()
        print(f"   Total articles in DB: {stats.get('total_articles', 0)}")
        print()
        
        storage.close()
        
        # Success!
        print("="*80)
        print("✅ ALL TESTS PASSED!")
        print("="*80)
        print()
        print("Your pipeline is ready to use. Run the full pipeline with:")
        print("   python main.py")
        print()
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(quick_test())
    exit(0 if success else 1)
