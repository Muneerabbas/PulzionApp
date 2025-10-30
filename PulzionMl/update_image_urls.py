import asyncio
import logging
import os
from datetime import datetime
from pymongo import MongoClient, UpdateOne
import aiohttp
import config
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = "news_pipeline"
COLLECTION_NAME = "articles"

API_KEYS = config.NEWS_API_KEYS
NEWS_API_BASE_URL = "https://newsapi.org/v2/everything"
PAGE_SIZE = 100

class NewsAPIClient:
    def __init__(self, api_keys):
        self.api_keys = api_keys
        self.index = 0
        self.session = None

    async def initialize(self):
        self.session = aiohttp.ClientSession()

    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()

    def _get_key(self):
        return self.api_keys[self.index]

    def _rotate_key(self):
        self.index = (self.index + 1) % len(self.api_keys)
        return self._get_key()

    async def fetch_articles(self, query, from_date=None, page_size=100):
        """Fetch articles from News API with optional from_date filter."""
        for _ in range(len(self.api_keys)):
            key = self._get_key()
            params = {
                "apiKey": key,
                "q": query,
                "pageSize": page_size,
                "page": 1,
                "language": "en"
            }
            if from_date:
                params["from"] = from_date.isoformat()

            try:
                async with self.session.get(NEWS_API_BASE_URL, params=params) as resp:
                    data = await resp.json()
                    if resp.status == 200:
                        return data.get("articles", [])
                    else:
                        logger.warning(f"API error {resp.status}: {data.get('message')}")
                        self._rotate_key()
            except Exception as e:
                logger.error(f"Request failed: {e}")
                self._rotate_key()
        return []

class ImageUpdater:
    def __init__(self):
        self.client = MongoClient(MONGODB_URI)
        self.db = self.client[DATABASE_NAME]
        self.collection = self.db[COLLECTION_NAME]
        self.api_client = NewsAPIClient(API_KEYS)

    async def initialize(self):
        await self.api_client.initialize()

    async def close(self):
        await self.api_client.close()
        self.client.close()

    async def update_topic(self, topic):
        # Get last published date for this topic in DB
        last_article = self.collection.find(
            {"search_topic": topic, "publishedAt": {"$exists": True}}
        ).sort("publishedAt", -1).limit(1)
        last_date = None
        for a in last_article:
            last_date = a["publishedAt"]

        if last_date:
            # Convert to datetime if it's string
            if isinstance(last_date, str):
                last_date = datetime.fromisoformat(last_date)
            logger.info(f"Fetching articles for topic '{topic}' from {last_date}")
        else:
            logger.info(f"No existing articles for topic '{topic}', fetching latest {PAGE_SIZE} articles")

        articles = await self.api_client.fetch_articles(topic, from_date=last_date, page_size=PAGE_SIZE)
        if not articles:
            logger.info(f"No new articles for topic: {topic}")
            return

        # Map urls to DB ids
        db_articles = list(self.collection.find({"search_topic": topic, "url": {"$in": [a["url"] for a in articles]}}, {"url": 1, "_id": 1}))
        url_to_id = {a["url"]: a["_id"] for a in db_articles}

        updates = []
        for a in articles:
            url = a.get("url")
            img = a.get("urlToImage")
            if url in url_to_id and img:
                updates.append(UpdateOne({"_id": url_to_id[url]}, {"$set": {"urlToImage": img}}))

        if updates:
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.collection.bulk_write(updates, ordered=False)
            )
            logger.info(f"Updated {result.modified_count} articles for topic: {topic}")

    async def process_all(self):
        topics = list(self.collection.distinct(
            "search_topic",
            {"url": {"$exists": True}}
        ))

        logger.info(f"Processing {len(topics)} topics")
        for topic in topics:
            await self.update_topic(topic)
            await asyncio.sleep(1)  # minimal delay

async def main():
    if not API_KEYS:
        logger.error("No API keys found")
        return

    updater = ImageUpdater()
    await updater.initialize()
    try:
        await updater.process_all()
    finally:
        await updater.close()

if __name__ == "__main__":
    asyncio.run(main())
