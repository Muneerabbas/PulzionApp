"""
Async news article fetcher with deduplication and batch processing.
Fetches articles from NewsAPI with rate limiting and error handling.
"""

import asyncio
import hashlib
import logging
from typing import Dict, List, Set, Optional
from datetime import datetime, timedelta
import aiohttp
from aiohttp import ClientTimeout

import config

logger = logging.getLogger(__name__)


class ArticleFetcher:
    """Async fetcher for news articles with deduplication and multi-key fallback."""
    
    def __init__(self):
        """Initialize the fetcher with configuration."""
        self.api_keys = config.NEWS_API_KEYS.copy()
        self.current_key_index = 0
        self.failed_keys: Set[str] = set()
        
        self.base_url = config.NEWS_API_BASE_URL
        self.top_headlines_url = config.NEWS_API_TOP_HEADLINES_URL
        self.timeout = ClientTimeout(total=config.REQUEST_TIMEOUT)
        self.seen_urls: Set[str] = set()
        self.seen_hashes: Set[str] = set()
        
        if not self.api_keys:
            raise ValueError("No API keys configured in config.NEWS_API_KEYS")
        
        logger.info(f"Initialized fetcher with {len(self.api_keys)} API key(s)")
    
    def _get_current_api_key(self) -> Optional[str]:
        """Get the current working API key."""
        # Find next working key
        for _ in range(len(self.api_keys)):
            key = self.api_keys[self.current_key_index]
            if key not in self.failed_keys:
                return key
            self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        
        logger.error("All API keys have failed!")
        return None
    
    def _rotate_api_key(self):
        """Rotate to the next API key."""
        old_key = self.api_keys[self.current_key_index]
        self.failed_keys.add(old_key)
        
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        new_key = self._get_current_api_key()
        
        if new_key:
            logger.warning(f"Rotating API key: ...{old_key[-8:]} -> ...{new_key[-8:]}")
        
        return new_key
    
    def _is_api_error(self, status_code: int) -> bool:
        """Check if status code indicates API key issue."""
        # 401: Unauthorized, 403: Forbidden, 429: Rate limit exceeded
        return status_code in [401, 403, 429]
        
    def _hash_url(self, url: str) -> str:
        """Generate a hash for URL-based deduplication."""
        return hashlib.md5(url.encode()).hexdigest()
    
    def _clean_article(self, article: Dict, search_topic: str = "") -> Optional[Dict]:
        """
        Clean and validate article data.
        
        Args:
            article: Raw article dict from API
            search_topic: Topic used for searching (for labeling)
            
        Returns:
            Cleaned article dict or None if invalid
        """
        url = article.get("url", "")
        if not url:
            return None
            
        url_hash = self._hash_url(url)
        
        # Check for duplicates
        if url in self.seen_urls or url_hash in self.seen_hashes:
            logger.debug(f"Duplicate article detected: {url}")
            return None
            
        title = article.get("title", "").strip()
        description = article.get("description", "").strip()
        content = article.get("content", "").strip()
        
        # Validate minimum content requirements
        combined_text = f"{title} {description} {content}"
        if len(combined_text) < config.MIN_CONTENT_LENGTH:
            logger.debug(f"Article too short: {url}")
            return None
            
        # Mark as seen
        self.seen_urls.add(url)
        self.seen_hashes.add(url_hash)
        
        # Limit content length
        if len(content) > config.MAX_CONTENT_LENGTH:
            content = content[:config.MAX_CONTENT_LENGTH] + "..."
            
        cleaned = {
            "_id": url_hash,
            "url": url,
            "url_hash": url_hash,
            "title": title,
            "description": description,
            "content": content,
            "source": article.get("source", {}).get("name", "Unknown"),
            "author": article.get("author", "Unknown"),
            "published_at": article.get("publishedAt", ""),
            "urlToImage": article.get("urlToImage"),  # Add image URL from API
            "search_topic": search_topic,
            "fetched_at": datetime.utcnow().isoformat(),
        }
        
        return cleaned
    
    async def _fetch_articles_for_topic(
        self, 
        session: aiohttp.ClientSession, 
        topic: str,
        sort_by: str = "relevancy"
    ) -> List[Dict]:
        """
        Fetch articles for a single topic with automatic API key fallback.
        
        Args:
            session: Aiohttp session
            topic: Topic to search for
            sort_by: Sort method (relevancy, popularity, publishedAt)
            
        Returns:
            List of cleaned articles
        """
        max_retries = len(self.api_keys)
        
        for attempt in range(max_retries):
            api_key = self._get_current_api_key()
            if not api_key:
                logger.error(f"No working API keys available for topic '{topic}'")
                return []
            
            params = {
                "q": topic,
                "apiKey": api_key,
                "language": "en",
                "sortBy": sort_by,
                "pageSize": config.MAX_ARTICLES_PER_TOPIC,
            }
            
            # Search within last 7 days for relevancy
            from_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
            params["from"] = from_date
            
            try:
                logger.info(f"Fetching articles for topic: '{topic}' (sort: {sort_by}) [Key #{self.current_key_index + 1}]")
                async with session.get(self.base_url, params=params, timeout=self.timeout) as response:
                    
                    # Check for API key errors
                    if self._is_api_error(response.status):
                        logger.warning(f"API key error ({response.status}) for '{topic}' - attempting key rotation")
                        next_key = self._rotate_api_key()
                        if next_key and attempt < max_retries - 1:
                            continue  # Retry with next key
                        return []
                    
                    if response.status != 200:
                        logger.error(f"API error for '{topic}': {response.status}")
                        return []
                    
                    data = await response.json()
                    
                    if data.get("status") != "ok":
                        error_message = data.get('message', 'Unknown error')
                        logger.error(f"API returned error for '{topic}': {error_message}")
                        
                        # Check if error is key-related
                        if any(keyword in error_message.lower() for keyword in ['api key', 'unauthorized', 'rate limit']):
                            next_key = self._rotate_api_key()
                            if next_key and attempt < max_retries - 1:
                                continue  # Retry with next key
                        return []
                    
                    articles = data.get("articles", [])
                    logger.info(f"✓ Received {len(articles)} articles for '{topic}'")
                    
                    # Clean and deduplicate
                    cleaned_articles = []
                    for article in articles:
                        cleaned = self._clean_article(article, search_topic=topic)
                        if cleaned:
                            cleaned_articles.append(cleaned)
                    
                    logger.info(f"✓ After deduplication: {len(cleaned_articles)} unique articles for '{topic}'")
                    return cleaned_articles
                    
            except asyncio.TimeoutError:
                logger.error(f"Timeout fetching articles for '{topic}'")
                return []
            except Exception as e:
                logger.error(f"Error fetching articles for '{topic}': {str(e)}")
                return []
        
        logger.error(f"Failed to fetch articles for '{topic}' after {max_retries} attempts")
        return []
    
    async def _fetch_top_headlines(self, session: aiohttp.ClientSession) -> List[Dict]:
        """
        Fetch trending top headlines with automatic API key fallback.
        
        Args:
            session: Aiohttp session
            
        Returns:
            List of cleaned articles
        """
        max_retries = len(self.api_keys)
        
        for attempt in range(max_retries):
            api_key = self._get_current_api_key()
            if not api_key:
                logger.error("No working API keys available for top headlines")
                return []
            
            params = {
                "apiKey": api_key,
                "language": "en",
                "pageSize": 50,  # Get more trending articles
            }
            
            try:
                logger.info(f"Fetching top headlines (trending news) [Key #{self.current_key_index + 1}]")
                async with session.get(self.top_headlines_url, params=params, timeout=self.timeout) as response:
                    
                    # Check for API key errors
                    if self._is_api_error(response.status):
                        logger.warning(f"API key error ({response.status}) for top headlines - attempting key rotation")
                        next_key = self._rotate_api_key()
                        if next_key and attempt < max_retries - 1:
                            continue  # Retry with next key
                        return []
                    
                    if response.status != 200:
                        logger.error(f"API error for top headlines: {response.status}")
                        return []
                    
                    data = await response.json()
                    
                    if data.get("status") != "ok":
                        error_message = data.get('message', 'Unknown error')
                        logger.error(f"API returned error for top headlines: {error_message}")
                        
                        # Check if error is key-related
                        if any(keyword in error_message.lower() for keyword in ['api key', 'unauthorized', 'rate limit']):
                            next_key = self._rotate_api_key()
                            if next_key and attempt < max_retries - 1:
                                continue  # Retry with next key
                        return []
                    
                    articles = data.get("articles", [])
                    logger.info(f"✓ Received {len(articles)} top headlines")
                    
                    # Clean and deduplicate
                    cleaned_articles = []
                    for article in articles:
                        cleaned = self._clean_article(article, search_topic="trending")
                        if cleaned:
                            cleaned_articles.append(cleaned)
                    
                    logger.info(f"✓ After deduplication: {len(cleaned_articles)} unique top headlines")
                    return cleaned_articles
                    
            except asyncio.TimeoutError:
                logger.error("Timeout fetching top headlines")
                return []
            except Exception as e:
                logger.error(f"Error fetching top headlines: {str(e)}")
                return []
        
        logger.error(f"Failed to fetch top headlines after {max_retries} attempts")
        return []
    
    async def fetch_all_articles(self, topics: Optional[List[str]] = None) -> List[Dict]:
        """
        Fetch articles for all topics with concurrency control.
        
        Args:
            topics: List of topics to fetch (uses config.TOPICS if None)
            
        Returns:
            Combined list of all unique articles
        """
        if topics is None:
            topics = config.TOPICS
        
        logger.info(f"Starting article fetch for {len(topics)} topics")
        logger.info(f"Concurrency limit: {config.MAX_CONCURRENT_REQUESTS}")
        
        all_articles = []
        
        # Create session with connection pooling
        connector = aiohttp.TCPConnector(limit=config.MAX_CONCURRENT_REQUESTS)
        async with aiohttp.ClientSession(connector=connector) as session:
            
            # Fetch top headlines first
            headlines = await self._fetch_top_headlines(session)
            all_articles.extend(headlines)
            
            # Fetch articles for each topic with semaphore for rate limiting
            semaphore = asyncio.Semaphore(config.MAX_CONCURRENT_REQUESTS)
            
            async def fetch_with_semaphore(topic: str):
                async with semaphore:
                    return await self._fetch_articles_for_topic(session, topic)
            
            # Execute in batches
            tasks = [fetch_with_semaphore(topic) for topic in topics]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Combine results
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Task failed with exception: {result}")
                elif isinstance(result, list):
                    all_articles.extend(result)
        
        logger.info(f"✓ Total unique articles fetched: {len(all_articles)}")
        return all_articles
    
    def reset_deduplication(self):
        """Clear deduplication cache."""
        self.seen_urls.clear()
        self.seen_hashes.clear()
        logger.info("Deduplication cache cleared")


async def fetch_articles(topics: Optional[List[str]] = None) -> List[Dict]:
    """
    Convenience function to fetch articles.
    
    Args:
        topics: List of topics to fetch (uses config.TOPICS if None)
        
    Returns:
        List of cleaned, deduplicated articles
    """
    fetcher = ArticleFetcher()
    return await fetcher.fetch_all_articles(topics)


if __name__ == "__main__":
    # Test the fetcher
    logging.basicConfig(
        level=logging.INFO,
        format=config.LOG_FORMAT
    )
    
    async def test():
        articles = await fetch_articles(topics=["artificial intelligence", "cryptocurrency"])
        print(f"\nFetched {len(articles)} articles")
        if articles:
            print(f"\nSample article:")
            print(f"Title: {articles[0]['title']}")
            print(f"Source: {articles[0]['source']}")
            print(f"URL: {articles[0]['url']}")
    
    asyncio.run(test())
