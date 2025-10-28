"""
MongoDB storage module for news articles.
Provides efficient storage, retrieval, and update operations.
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from pymongo import MongoClient, UpdateOne, ASCENDING, DESCENDING
from pymongo.errors import BulkWriteError, ConnectionFailure

import config

logger = logging.getLogger(__name__)


class ArticleStorage:
    """MongoDB storage handler for news articles."""
    
    def __init__(self, uri: Optional[str] = None, db_name: Optional[str] = None):
        """
        Initialize MongoDB connection.
        
        Args:
            uri: MongoDB connection URI (uses config if None)
            db_name: Database name (uses config if None)
        """
        self.uri = uri or config.MONGODB_URI
        self.db_name = db_name or config.DATABASE_NAME
        self.collection_name = config.COLLECTION_NAME
        
        try:
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=5000)
            # Test connection
            self.client.server_info()
            self.db = self.client[self.db_name]
            self.collection = self.db[self.collection_name]
            
            # Create indexes for better performance
            self._create_indexes()
            
            logger.info(f"✓ Connected to MongoDB: {self.db_name}.{self.collection_name}")
            
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
    
    def _create_indexes(self):
        """Create indexes for optimized queries."""
        try:
            # Unique index on _id (url_hash)
            self.collection.create_index("_id", unique=True)
            
            # Index on url for quick lookups
            self.collection.create_index("url", unique=True)
            
            # Index on published_at for time-based queries
            self.collection.create_index([("published_at", DESCENDING)])
            
            # Index on search_topic for filtering
            self.collection.create_index("search_topic")
            
            # Index on categories for filtering
            self.collection.create_index("categories")
            
            # Text index for search functionality
            self.collection.create_index([
                ("title", "text"),
                ("description", "text"),
                ("content", "text")
            ])
            
            logger.debug("Database indexes created/verified")
            
        except Exception as e:
            logger.warning(f"Error creating indexes: {str(e)}")
    
    def save_articles(self, articles: List[Dict]) -> Dict[str, int]:
        """
        Save multiple articles with upsert (no duplicates).
        
        Args:
            articles: List of article dicts
            
        Returns:
            Dict with counts: {'inserted': N, 'updated': M, 'errors': K}
        """
        if not articles:
            logger.warning("No articles to save")
            return {'inserted': 0, 'updated': 0, 'errors': 0}
        
        logger.info(f"Saving {len(articles)} articles to database...")
        
        operations = []
        for article in articles:
            # Ensure _id is present (url_hash)
            if '_id' not in article:
                logger.warning(f"Article missing _id: {article.get('url', 'unknown')}")
                continue
            
            # Prepare upsert operation
            operations.append(
                UpdateOne(
                    {'_id': article['_id']},
                    {'$set': article},
                    upsert=True
                )
            )
        
        if not operations:
            logger.warning("No valid operations to execute")
            return {'inserted': 0, 'updated': 0, 'errors': 0}
        
        try:
            result = self.collection.bulk_write(operations, ordered=False)
            
            stats = {
                'inserted': result.upserted_count,
                'updated': result.modified_count,
                'errors': 0
            }
            
            logger.info(f"✓ Saved articles - New: {stats['inserted']}, Updated: {stats['updated']}")
            return stats
            
        except BulkWriteError as e:
            # Some operations succeeded, some failed
            stats = {
                'inserted': e.details.get('nUpserted', 0),
                'updated': e.details.get('nModified', 0),
                'errors': len(e.details.get('writeErrors', []))
            }
            logger.error(f"Bulk write errors: {stats['errors']} errors occurred")
            return stats
            
        except Exception as e:
            logger.error(f"Error saving articles: {str(e)}")
            return {'inserted': 0, 'updated': 0, 'errors': len(articles)}
    
    def get_articles(
        self, 
        limit: int = 100, 
        skip: int = 0,
        filter_dict: Optional[Dict] = None,
        sort_by: str = "published_at",
        ascending: bool = False
    ) -> List[Dict]:
        """
        Retrieve articles from database.
        
        Args:
            limit: Maximum number of articles to retrieve
            skip: Number of articles to skip
            filter_dict: MongoDB filter query
            sort_by: Field to sort by
            ascending: Sort direction
            
        Returns:
            List of article dicts
        """
        try:
            query = filter_dict or {}
            sort_direction = ASCENDING if ascending else DESCENDING
            
            cursor = self.collection.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
            articles = list(cursor)
            
            logger.info(f"Retrieved {len(articles)} articles from database")
            return articles
            
        except Exception as e:
            logger.error(f"Error retrieving articles: {str(e)}")
            return []
    
    def get_article_by_id(self, article_id: str) -> Optional[Dict]:
        """
        Get a single article by its _id.
        
        Args:
            article_id: Article _id (url_hash)
            
        Returns:
            Article dict or None
        """
        try:
            article = self.collection.find_one({'_id': article_id})
            return article
        except Exception as e:
            logger.error(f"Error retrieving article {article_id}: {str(e)}")
            return None
    
    def update_article(self, article_id: str, update_dict: Dict) -> bool:
        """
        Update a single article.
        
        Args:
            article_id: Article _id (url_hash)
            update_dict: Fields to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = self.collection.update_one(
                {'_id': article_id},
                {'$set': update_dict}
            )
            
            if result.modified_count > 0:
                logger.debug(f"Updated article: {article_id}")
                return True
            else:
                logger.debug(f"No changes made to article: {article_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating article {article_id}: {str(e)}")
            return False
    
    def update_articles_batch(self, updates: List[tuple]) -> int:
        """
        Update multiple articles in batch.
        
        Args:
            updates: List of (article_id, update_dict) tuples
            
        Returns:
            Number of articles updated
        """
        if not updates:
            return 0
        
        operations = []
        for article_id, update_dict in updates:
            operations.append(
                UpdateOne(
                    {'_id': article_id},
                    {'$set': update_dict}
                )
            )
        
        try:
            result = self.collection.bulk_write(operations, ordered=False)
            logger.info(f"✓ Batch updated {result.modified_count} articles")
            return result.modified_count
            
        except BulkWriteError as e:
            modified = e.details.get('nModified', 0)
            logger.warning(f"Batch update partial success: {modified} updated")
            return modified
            
        except Exception as e:
            logger.error(f"Error in batch update: {str(e)}")
            return 0
    
    def get_articles_without_field(self, field_name: str, limit: int = 1000) -> List[Dict]:
        """
        Get articles that are missing a specific field.
        Useful for incremental processing.
        
        Args:
            field_name: Field to check for
            limit: Maximum number of articles
            
        Returns:
            List of articles missing the field
        """
        try:
            query = {field_name: {'$exists': False}}
            cursor = self.collection.find(query).limit(limit)
            articles = list(cursor)
            
            logger.info(f"Found {len(articles)} articles without field '{field_name}'")
            return articles
            
        except Exception as e:
            logger.error(f"Error querying articles: {str(e)}")
            return []
    
    def count_articles(self, filter_dict: Optional[Dict] = None) -> int:
        """
        Count articles matching filter.
        
        Args:
            filter_dict: MongoDB filter query
            
        Returns:
            Number of matching articles
        """
        try:
            query = filter_dict or {}
            count = self.collection.count_documents(query)
            return count
        except Exception as e:
            logger.error(f"Error counting articles: {str(e)}")
            return 0
    
    def delete_old_articles(self, days: int = 30) -> int:
        """
        Delete articles older than specified days.
        
        Args:
            days: Number of days to keep
            
        Returns:
            Number of deleted articles
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            result = self.collection.delete_many({
                'fetched_at': {'$lt': cutoff_date.isoformat()}
            })
            
            logger.info(f"Deleted {result.deleted_count} articles older than {days} days")
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Error deleting old articles: {str(e)}")
            return 0
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get database statistics.
        
        Returns:
            Dict with various statistics
        """
        try:
            total = self.count_articles()
            
            # Count by category
            category_counts = list(self.collection.aggregate([
                {'$unwind': '$categories'},
                {'$group': {'_id': '$categories', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}}
            ]))
            
            # Count by topic
            topic_counts = list(self.collection.aggregate([
                {'$group': {'_id': '$search_topic', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}},
                {'$limit': 10}
            ]))
            
            stats = {
                'total_articles': total,
                'top_categories': category_counts[:5],
                'top_topics': topic_counts
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting statistics: {str(e)}")
            return {}
    
    def close(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")


# Convenience functions
_storage_instance = None

def get_storage() -> ArticleStorage:
    """Get singleton storage instance."""
    global _storage_instance
    if _storage_instance is None:
        _storage_instance = ArticleStorage()
    return _storage_instance


if __name__ == "__main__":
    # Test storage
    logging.basicConfig(level=logging.INFO, format=config.LOG_FORMAT)
    
    storage = ArticleStorage()
    
    # Test article
    test_article = {
        '_id': 'test123',
        'url': 'https://example.com/test',
        'title': 'Test Article',
        'description': 'Test description',
        'content': 'Test content',
        'source': 'Test Source',
        'published_at': datetime.utcnow().isoformat(),
    }
    
    # Save
    result = storage.save_articles([test_article])
    print(f"Save result: {result}")
    
    # Retrieve
    articles = storage.get_articles(limit=1)
    print(f"Retrieved {len(articles)} articles")
    
    # Stats
    stats = storage.get_statistics()
    print(f"Statistics: {stats}")
    
    storage.close()
