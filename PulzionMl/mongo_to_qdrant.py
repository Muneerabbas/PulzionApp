"""
MongoDB to Qdrant data migration script.
Connects to MongoDB, processes articles, and uploads them to Qdrant Cloud.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from pymongo import MongoClient
from qdrant_client import QdrantClient
from qdrant_client.http import models
from tqdm import tqdm
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = "news_pipeline"
COLLECTION_NAME = "articles"

# Qdrant Configuration
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME_QDRANT = "articles_collection"
BATCH_SIZE = 100 

def get_mongodb_client() -> MongoClient:
    try:
        client = MongoClient(MONGODB_URI)
        client.admin.command('ping')
        logger.info("✅ Connected to MongoDB")
        return client
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise

def get_qdrant_client() -> QdrantClient:
    """Create and return a Qdrant client."""
    if not QDRANT_URL or not QDRANT_API_KEY:
        raise ValueError("QDRANT_URL and QDRANT_API_KEY must be set in .env file")
    
    try:
        client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY,
            timeout=60  # Increased timeout for cloud operations
        )
        logger.info("✅ Connected to Qdrant Cloud")
        return client
    except Exception as e:
        logger.error(f"❌ Failed to connect to Qdrant: {e}")
        raise

def process_article(article: Dict[str, Any]) -> Dict[str, Any]:
    """Process a single article document from MongoDB."""
    # Take first 5 categories if they exist
    categories = article.get('categories', [])[:5]
    
    # Prepare the payload with all required fields
    payload = {
        'author': article.get('author'),
        'content': article.get('content'),
        'description': article.get('description'),
        'published_at': article.get('published_at'),
        'search_topic': article.get('search_topic'),
        'source': article.get('source', {}).get('name') if isinstance(article.get('source'), dict) else article.get('source'),
        'title': article.get('title'),
        'url': article.get('url'),
        'image_url':article.get('urlToImage'),
        'articleId':article.get('_id'),
        'url_hash': article.get('url_hash'),
        'categories': categories,
        'keywords': article.get('keywords', []),
        'sentiment': article.get('sentiment'),
        'sentiment_scores': article.get('sentiment_scores')
    }
    
    # Remove None values
    payload = {k: v for k, v in payload.items() if v is not None}
    
    return {
        'id': str(article['_id']),
        'vector': article.get('embedding'),
        'payload': payload
    }

def process_batch(articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Process a batch of articles."""
    processed = []
    for article in articles:
        try:
            processed_article = process_article(article)
            if processed_article['vector']:  # Only include articles with embeddings
                processed.append(processed_article)
        except Exception as e:
            logger.warning(f"Skipping article due to error: {e}")
    return processed

def create_qdrant_collection(client: QdrantClient, vector_size: int = 768) -> None:
    """Create a Qdrant collection with the specified vector size."""
    try:
        # Delete collection if it exists
        client.delete_collection(collection_name=COLLECTION_NAME_QDRANT)
        logger.info(f"🗑️  Deleted existing collection: {COLLECTION_NAME_QDRANT}")
    except Exception as e:
        logger.info(f"ℹ️  No existing collection to delete: {e}")
    
    try:
        client.create_collection(
            collection_name=COLLECTION_NAME_QDRANT,
            vectors_config={
                "": models.VectorParams(
                    size=vector_size,
                    distance=models.Distance.COSINE
                )
            }
        )
        logger.info(f"✅ Created Qdrant collection: {COLLECTION_NAME_QDRANT}")
    except Exception as e:
        logger.error(f"❌ Failed to create collection: {e}")
        raise

def upload_to_qdrant(qdrant_client: QdrantClient, batch: List[Dict[str, Any]]) -> None:
    """Upload a batch of articles to Qdrant."""
    if not batch:
        return
    
    try:
        points = []
        for item in batch:
            points.append(
                models.PointStruct(
                    id=item['id'],
                    vector=item['vector'],
                    payload=item['payload']
                )
            )
        
        qdrant_client.upsert(
            collection_name=COLLECTION_NAME_QDRANT,
            points=points,
            wait=True
        )
        logger.info(f"🚀 Uploaded {len(batch)} articles to Qdrant")
    except Exception as e:
        logger.error(f"❌ Failed to upload batch to Qdrant: {e}")
        raise

def get_embedding_dimension(mongo_client: MongoClient) -> int:
    """Get the embedding dimension from the first document with an embedding."""
    db = mongo_client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    
    # Find a document with an embedding field
    doc = collection.find_one({"embedding": {"$exists": True, "$ne": None}})
    if not doc or 'embedding' not in doc:
        raise ValueError("No documents with embeddings found in the collection")
    
    return len(doc['embedding'])

def main():
    start_time = time.time()
    
    try:
        # Initialize clients
        mongo_client = get_mongodb_client()
        qdrant_client = get_qdrant_client()
        
        # Get the embedding dimension from an example document
        try:
            embedding_dim = get_embedding_dimension(mongo_client)
            logger.info(f"🔍 Detected embedding dimension: {embedding_dim}")
        except Exception as e:
            logger.error(f"❌ Error getting embedding dimension: {e}")
            embedding_dim = 768  # Default to 768 if can't determine
            logger.info(f"ℹ️  Using default embedding dimension: {embedding_dim}")
        
        # Create Qdrant collection
        create_qdrant_collection(qdrant_client, vector_size=embedding_dim)
        
        # Get MongoDB collection
        db = mongo_client[DATABASE_NAME]
        collection = db[COLLECTION_NAME]
        
        # Get total count for progress tracking
        total_docs = collection.count_documents({"embedding": {"$exists": True, "$ne": None}})
        logger.info(f"📊 Found {total_docs} articles with embeddings")
        
        if total_docs == 0:
            logger.warning("⚠️  No documents with embeddings found in the collection")
            return
        
        # Process articles in batches
        processed_count = 0
        batch = []
        
        # Use a cursor to stream documents
        cursor = collection.find(
            {"embedding": {"$exists": True, "$ne": None}},
            batch_size=BATCH_SIZE
        )
        
        with tqdm(total=total_docs, desc="Processing articles") as pbar:
            for article in cursor:
                processed_article = process_article(article)
                if processed_article['vector']:
                    batch.append(processed_article)
                
                # Process batch when it reaches the batch size
                if len(batch) >= BATCH_SIZE:
                    upload_to_qdrant(qdrant_client, batch)
                    processed_count += len(batch)
                    pbar.update(len(batch))
                    batch = []
            
            # Process any remaining articles in the last batch
            if batch:
                upload_to_qdrant(qdrant_client, batch)
                processed_count += len(batch)
                pbar.update(len(batch))
        
        collection_info = qdrant_client.get_collection(COLLECTION_NAME_QDRANT)
        logger.info(f"✅ Migration completed successfully!")
        logger.info(f"📊 Total articles processed: {processed_count}")
        logger.info(f"🔍 Qdrant collection info: {collection_info}")
        
    except Exception as e:
        logger.error(f"❌ Error during migration: {e}", exc_info=True)
    finally:
        if 'mongo_client' in locals():
            mongo_client.close()
        if 'qdrant_client' in locals():
            qdrant_client.close()
        
        logger.info(f"⏱️  Total execution time: {time.time() - start_time:.2f} seconds")

if __name__ == "__main__":
    main()
