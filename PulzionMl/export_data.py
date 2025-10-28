"""
Export articles from MongoDB to various formats (JSON, CSV).
"""

import json
import csv
import logging
from datetime import datetime
from typing import List, Dict, Optional

from storage import ArticleStorage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def export_to_json(
    articles: List[Dict],
    filename: str = "articles_export.json",
    pretty: bool = True
):
    """
    Export articles to JSON file.
    
    Args:
        articles: List of article dicts
        filename: Output filename
        pretty: Pretty print JSON
    """
    logger.info(f"Exporting {len(articles)} articles to {filename}...")
    
    # Convert non-serializable fields
    serializable_articles = []
    for article in articles:
        article_copy = article.copy()
        
        # Remove embedding (too large for JSON)
        if 'embedding' in article_copy:
            del article_copy['embedding']
        
        serializable_articles.append(article_copy)
    
    with open(filename, 'w', encoding='utf-8') as f:
        if pretty:
            json.dump(serializable_articles, f, indent=2, ensure_ascii=False)
        else:
            json.dump(serializable_articles, f, ensure_ascii=False)
    
    logger.info(f"✓ Exported to {filename}")


def export_to_csv(
    articles: List[Dict],
    filename: str = "articles_export.csv"
):
    """
    Export articles to CSV file.
    
    Args:
        articles: List of article dicts
        filename: Output filename
    """
    logger.info(f"Exporting {len(articles)} articles to {filename}...")
    
    if not articles:
        logger.warning("No articles to export")
        return
    
    # Define CSV columns
    columns = [
        'title', 'description', 'source', 'author', 'url',
        'published_at', 'categories', 'keywords', 'sentiment',
        'sentiment_confidence', 'search_topic'
    ]
    
    with open(filename, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=columns, extrasaction='ignore')
        writer.writeheader()
        
        for article in articles:
            # Convert lists to strings
            row = article.copy()
            if 'categories' in row and isinstance(row['categories'], list):
                row['categories'] = ', '.join(row['categories'])
            if 'keywords' in row and isinstance(row['keywords'], list):
                row['keywords'] = ', '.join(row['keywords'][:10])  # Limit keywords
            
            writer.writerow(row)
    
    logger.info(f"✓ Exported to {filename}")


def export_by_category(storage: ArticleStorage, category: str, format: str = 'json'):
    """Export articles from a specific category."""
    logger.info(f"Fetching articles in category: {category}")
    
    articles = storage.get_articles(
        filter_dict={'categories': category},
        limit=10000
    )
    
    if not articles:
        logger.warning(f"No articles found in category: {category}")
        return
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    if format == 'json':
        filename = f"articles_{category}_{timestamp}.json"
        export_to_json(articles, filename)
    elif format == 'csv':
        filename = f"articles_{category}_{timestamp}.csv"
        export_to_csv(articles, filename)
    else:
        logger.error(f"Unknown format: {format}")


def export_all(storage: ArticleStorage, format: str = 'json', limit: int = 10000):
    """Export all articles."""
    logger.info(f"Fetching all articles (limit: {limit})")
    
    articles = storage.get_articles(limit=limit)
    
    if not articles:
        logger.warning("No articles found")
        return
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    if format == 'json':
        filename = f"articles_all_{timestamp}.json"
        export_to_json(articles, filename)
    elif format == 'csv':
        filename = f"articles_all_{timestamp}.csv"
        export_to_csv(articles, filename)
    else:
        logger.error(f"Unknown format: {format}")


def export_recent(storage: ArticleStorage, days: int = 7, format: str = 'json'):
    """Export recent articles."""
    from datetime import timedelta
    
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()
    
    logger.info(f"Fetching articles from last {days} days")
    
    articles = storage.get_articles(
        filter_dict={'fetched_at': {'$gte': cutoff}},
        limit=10000
    )
    
    if not articles:
        logger.warning(f"No articles found from last {days} days")
        return
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    if format == 'json':
        filename = f"articles_recent_{days}days_{timestamp}.json"
        export_to_json(articles, filename)
    elif format == 'csv':
        filename = f"articles_recent_{days}days_{timestamp}.csv"
        export_to_csv(articles, filename)
    else:
        logger.error(f"Unknown format: {format}")


def main():
    """Main entry point."""
    import sys
    
    storage = ArticleStorage()
    
    # Check arguments
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python export_data.py all [json|csv]                  # Export all articles")
        print("  python export_data.py category <name> [json|csv]      # Export by category")
        print("  python export_data.py recent <days> [json|csv]        # Export recent articles")
        print()
        print("Examples:")
        print("  python export_data.py all json")
        print("  python export_data.py category AI csv")
        print("  python export_data.py recent 7 json")
        storage.close()
        return
    
    command = sys.argv[1].lower()
    
    try:
        if command == 'all':
            format = sys.argv[2] if len(sys.argv) > 2 else 'json'
            export_all(storage, format)
        
        elif command == 'category':
            if len(sys.argv) < 3:
                print("Error: Please specify category name")
                return
            category = sys.argv[2]
            format = sys.argv[3] if len(sys.argv) > 3 else 'json'
            export_by_category(storage, category, format)
        
        elif command == 'recent':
            if len(sys.argv) < 3:
                print("Error: Please specify number of days")
                return
            days = int(sys.argv[2])
            format = sys.argv[3] if len(sys.argv) > 3 else 'json'
            export_recent(storage, days, format)
        
        else:
            print(f"Unknown command: {command}")
    
    except Exception as e:
        logger.error(f"Export failed: {str(e)}")
    
    finally:
        storage.close()


if __name__ == "__main__":
    main()
