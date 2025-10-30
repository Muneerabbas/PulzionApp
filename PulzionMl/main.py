"""
Main orchestration script for the news article pipeline.
Coordinates all modules and provides comprehensive logging and timing.
"""

import asyncio
import logging
import sys
import time
from datetime import datetime
from typing import Dict, List

import config
from fetcher import fetch_articles
from storage import ArticleStorage
from labeling import ArticleLabeler
from embeddings import EmbeddingGenerator
from analyzer import ArticleAnalyzer

# Configure logging with UTF-8 encoding to handle emojis on Windows
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT,
    handlers=[
        logging.FileHandler(config.LOG_FILE, encoding='utf-8'),
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


class PipelineStats:
    """Track pipeline statistics."""
    
    def __init__(self):
        self.start_time = None
        self.end_time = None
        self.articles_fetched = 0
        self.articles_stored = 0
        self.articles_updated = 0
        self.articles_labeled = 0
        self.embeddings_generated = 0
        self.keywords_extracted = 0
        self.sentiments_analyzed = 0
        self.stage_times = {}
    
    def start(self):
        """Start timing."""
        self.start_time = time.time()
        logger.info("="*80)
        logger.info("🚀 NEWS ARTICLE PIPELINE STARTED")
        logger.info(f"   Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("="*80)
    
    def end(self):
        """End timing and print summary."""
        self.end_time = time.time()
        total_time = self.end_time - self.start_time
        
        logger.info("")
        logger.info("="*80)
        logger.info("✅ PIPELINE COMPLETED SUCCESSFULLY")
        logger.info("="*80)
        logger.info("")
        logger.info("📊 SUMMARY STATISTICS:")
        logger.info(f"   ├─ Articles fetched:        {self.articles_fetched:,}")
        logger.info(f"   ├─ New articles stored:     {self.articles_stored:,}")
        logger.info(f"   ├─ Articles updated:        {self.articles_updated:,}")
        logger.info(f"   ├─ Articles labeled:        {self.articles_labeled:,}")
        logger.info(f"   ├─ Embeddings generated:    {self.embeddings_generated:,}")
        logger.info(f"   ├─ Keywords extracted:      {self.keywords_extracted:,}")
        logger.info(f"   └─ Sentiments analyzed:     {self.sentiments_analyzed:,}")
        logger.info("")
        logger.info("⏱️  TIMING BREAKDOWN:")
        
        for stage, duration in self.stage_times.items():
            percentage = (duration / total_time) * 100
            logger.info(f"   ├─ {stage:<25} {duration:>7.2f}s  ({percentage:>5.1f}%)")
        
        logger.info(f"   └─ {'TOTAL TIME':<25} {total_time:>7.2f}s  (100.0%)")
        logger.info("")
        logger.info(f"⚡ Average processing speed:   {self.articles_fetched/total_time:.2f} articles/second")
        logger.info("="*80)
    
    def record_stage(self, stage_name: str, duration: float):
        """Record stage timing."""
        self.stage_times[stage_name] = duration


async def run_pipeline(
    topics: List[str] = None,
    skip_fetch: bool = False,
    skip_labeling: bool = False,
    skip_embeddings: bool = False,
    skip_analysis: bool = False
) -> Dict:
    """
    Run the complete news article pipeline.
    
    Args:
        topics: List of topics to fetch (uses config if None)
        skip_fetch: Skip fetching (process existing articles)
        skip_labeling: Skip categorization
        skip_embeddings: Skip embedding generation
        skip_analysis: Skip keyword and sentiment analysis
        
    Returns:
        Dict with pipeline statistics
    """
    stats = PipelineStats()
    stats.start()
    
    try:
        # Initialize storage
        logger.info("🔌 Connecting to database...")
        storage = ArticleStorage()
        logger.info("")
        
        if not skip_fetch:
            logger.info("="*80)
            logger.info("📰 STAGE 1: FETCHING ARTICLES")
            logger.info("="*80)
            stage_start = time.time()
            
            articles = await fetch_articles(topics)
            stats.articles_fetched = len(articles)
            
            stage_duration = time.time() - stage_start
            stats.record_stage("1. Fetch Articles", stage_duration)
            logger.info("")
        else:
            logger.info("⏭️  Skipping fetch - will process existing articles")
            articles = []
        
        # ============ STAGE 2: STORE ARTICLES ============
        if articles:
            logger.info("="*80)
            logger.info("💾 STAGE 2: STORING ARTICLES")
            logger.info("="*80)
            stage_start = time.time()
            
            result = storage.save_articles(articles)
            stats.articles_stored = result['inserted']
            stats.articles_updated = result['updated']
            
            stage_duration = time.time() - stage_start
            stats.record_stage("2. Store Articles", stage_duration)
            logger.info("")
        
        # ============ STAGE 3: LABEL ARTICLES ============
        if not skip_labeling and config.ENABLE_LABELING:
            logger.info("="*80)
            logger.info("🏷️  STAGE 3: LABELING ARTICLES")
            logger.info("="*80)
            stage_start = time.time()
            
            # Get articles without categories
            articles_to_label = storage.get_articles_without_field('categories', limit=5000)
            
            if articles_to_label:
                logger.info(f"Found {len(articles_to_label)} articles to label")
                
                labeler = ArticleLabeler()
                labeled_count = 0

                def persist_batch(batch_articles: List[Dict]):
                    nonlocal labeled_count
                    updates = [
                        (
                            article['_id'],
                            {
                                'categories': article.get('categories', []),
                                'category_scores': article.get('category_scores', {})
                            }
                        )
                        for article in batch_articles
                        if article.get('categories')
                    ]

                    if updates:
                        updated = storage.update_articles_batch(updates)
                        labeled_count += updated

                labeler.label_articles_batch(
                    articles_to_label,
                    multi_label=True,
                    threshold=0.4,
                    batch_callback=persist_batch
                )

                stats.articles_labeled = labeled_count
            else:
                logger.info("No articles need labeling")
            
            stage_duration = time.time() - stage_start
            stats.record_stage("3. Label Articles", stage_duration)
            logger.info("")
        
        if not skip_embeddings and config.ENABLE_EMBEDDINGS:
            logger.info("="*80)
            logger.info("🧮 STAGE 4: GENERATING EMBEDDINGS")
            logger.info("="*80)
            stage_start = time.time()
            
            articles_to_embed = storage.get_articles_without_field('embedding', limit=5000)
            
            if articles_to_embed:
                logger.info(f"Found {len(articles_to_embed)} articles to embed")
                
                generator = EmbeddingGenerator()
                embedded_articles = generator.generate_embeddings_batch(
                    articles_to_embed,
                    show_progress=True
                )
                
                # Update in database
                updates = [
                    (
                        article['_id'],
                        {
                            'embedding': article.get('embedding'),
                            'embedding_dim': article.get('embedding_dim', 0)
                        }
                    )
                    for article in embedded_articles
                    if article.get('embedding') is not None
                ]
                
                if updates:
                    updated_count = storage.update_articles_batch(updates)
                    stats.embeddings_generated = updated_count
            else:
                logger.info("No articles need embeddings")
            
            stage_duration = time.time() - stage_start
            stats.record_stage("4. Generate Embeddings", stage_duration)
            logger.info("")
        
        # ============ STAGE 5: ANALYZE ARTICLES ============
        if not skip_analysis and (config.ENABLE_KEYWORD_EXTRACTION or config.ENABLE_SENTIMENT_ANALYSIS):
            logger.info("="*80)
            logger.info("🔍 STAGE 5: ANALYZING ARTICLES")
            logger.info("="*80)
            stage_start = time.time()
            
            # Get articles without keywords or sentiment
            articles_to_analyze = storage.get_articles_without_field('keywords', limit=5000)
            
            if articles_to_analyze:
                logger.info(f"Found {len(articles_to_analyze)} articles to analyze")
                
                analyzer = ArticleAnalyzer()
                analyzed_articles = analyzer.analyze_articles_batch(
                    articles_to_analyze,
                    extract_kw=config.ENABLE_KEYWORD_EXTRACTION,
                    analyze_sent=config.ENABLE_SENTIMENT_ANALYSIS
                )
                
                # Update in database
                updates = []
                for article in analyzed_articles:
                    update_dict = {}
                    
                    if article.get('keywords'):
                        update_dict['keywords'] = article['keywords']
                        update_dict['keyword_scores'] = article.get('keyword_scores', {})
                    
                    if article.get('sentiment'):
                        update_dict['sentiment'] = article['sentiment']
                        update_dict['sentiment_scores'] = article.get('sentiment_scores', {})
                        update_dict['sentiment_confidence'] = article.get('sentiment_confidence', 0)
                    
                    if update_dict:
                        updates.append((article['_id'], update_dict))
                
                if updates:
                    updated_count = storage.update_articles_batch(updates)
                    stats.keywords_extracted = sum(1 for a in analyzed_articles if a.get('keywords'))
                    stats.sentiments_analyzed = sum(1 for a in analyzed_articles if a.get('sentiment'))
            else:
                logger.info("No articles need analysis")
            
            stage_duration = time.time() - stage_start
            stats.record_stage("5. Analyze Articles", stage_duration)
            logger.info("")
        
        # ============ FINAL STATISTICS ============
        logger.info("="*80)
        logger.info("📈 DATABASE STATISTICS")
        logger.info("="*80)
        
        db_stats = storage.get_statistics()
        logger.info(f"Total articles in database: {db_stats.get('total_articles', 0):,}")
        
        # Category distribution
        top_categories = db_stats.get('top_categories', [])
        if top_categories:
            logger.info("\nTop Categories:")
            for cat in top_categories[:5]:
                logger.info(f"   ├─ {cat['_id']:<20} {cat['count']:>5} articles")
        
        # Topic distribution
        top_topics = db_stats.get('top_topics', [])
        if top_topics:
            logger.info("\nTop Topics:")
            for topic in top_topics[:5]:
                logger.info(f"   ├─ {topic['_id']:<25} {topic['count']:>5} articles")
        
        logger.info("")
        
        # Close storage
        storage.close()
        
        # Print final summary
        stats.end()
        
        return {
            'success': True,
            'stats': {
                'articles_fetched': stats.articles_fetched,
                'articles_stored': stats.articles_stored,
                'articles_updated': stats.articles_updated,
                'articles_labeled': stats.articles_labeled,
                'embeddings_generated': stats.embeddings_generated,
                'keywords_extracted': stats.keywords_extracted,
                'sentiments_analyzed': stats.sentiments_analyzed,
            },
            'timing': stats.stage_times,
            'total_time': stats.end_time - stats.start_time
        }
        
    except KeyboardInterrupt:
        logger.warning("\n⚠️  Pipeline interrupted by user")
        return {'success': False, 'error': 'User interrupted'}
        
    except Exception as e:
        logger.error(f"\n❌ Pipeline failed with error: {str(e)}", exc_info=True)
        return {'success': False, 'error': str(e)}


async def main():
    """Main entry point."""
    result = await run_pipeline(
        topics=config.TOPICS,
        skip_fetch=False,
        skip_labeling=False,
        skip_embeddings=False,
        skip_analysis=False
    )
    
    return result


if __name__ == "__main__":
    # Run the pipeline
    result = asyncio.run(main())
    
    # Exit with appropriate code
    exit_code = 0 if result.get('success') else 1
    exit(exit_code)
