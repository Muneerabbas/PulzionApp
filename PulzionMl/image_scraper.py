import asyncio
import logging
from pymongo import MongoClient, UpdateOne
import aiohttp
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import os
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = "news_pipeline"
COLLECTION_NAME = "articles"


async def extract_best_image(url, session):
    """Scrape a webpage to find the best image."""
    try:
        async with session.get(url, ssl=False, timeout=10) as resp:
            if resp.status != 200:
                return None
            html = await resp.text()
            soup = BeautifulSoup(html, 'html.parser')

            # 1. Check OpenGraph/Twitter meta tags
            for tag_name, attr, value in [
                ("meta", "property", "og:image"),
                ("meta", "name", "twitter:image"),
                ("meta", "itemprop", "image")
            ]:
                tag = soup.find(tag_name, {attr: value})
                if tag and tag.get("content"):
                    return urljoin(url, tag["content"])

            # 2. Fallback: pick first <img> on page
            img = soup.find("img", src=True)
            if img:
                return urljoin(url, img["src"])
    except Exception as e:
        logger.warning(f"Failed to extract image from {url}: {e}")
    return None


async def update_images():
    client = MongoClient(MONGODB_URI)
    collection = client[DATABASE_NAME][COLLECTION_NAME]

    # Find all articles with missing urlToImage
    articles = list(collection.find({"url": {"$exists": True}, "urlToImage": {"$exists": False}}))
    logger.info(f"Found {len(articles)} articles without images")

    async with aiohttp.ClientSession() as session:
        updates = []
        for article in articles:
            url = article["url"]
            image_url = await extract_best_image(url, session)
            if image_url:
                updates.append(UpdateOne({"_id": article["_id"]}, {"$set": {"urlToImage": image_url}}))
                logger.info(f"Found image for {url}: {image_url}")

            # Bulk write in batches of 50 to avoid overload
            if len(updates) >= 50:
                result = collection.bulk_write(updates, ordered=False)
                logger.info(f"Updated {result.modified_count} articles")
                updates = []

        if updates:
            result = collection.bulk_write(updates, ordered=False)
            logger.info(f"Updated {result.modified_count} articles")

    client.close()


if __name__ == "__main__":
    asyncio.run(update_images())
