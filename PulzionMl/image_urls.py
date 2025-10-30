from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = "news_pipeline"
COLLECTION_NAME = "articles"

client = MongoClient(MONGODB_URI)
collection = client[DATABASE_NAME][COLLECTION_NAME]

total_articles = collection.count_documents({})
with_image = collection.count_documents({"urlToImage": {"$exists": True, "$ne": None}})

if total_articles > 0:
    percent = (with_image / total_articles) * 100
    print(f"📰 Total articles: {total_articles}")
    print(f"🖼️ Articles with image: {with_image}")
    print(f"✅ Percentage with image URLs: {percent:.2f}%")
else:
    print("No articles found in the collection.")

client.close()
