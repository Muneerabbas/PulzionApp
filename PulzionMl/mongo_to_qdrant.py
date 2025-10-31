#!/usr/bin/env python3
"""
MongoDB → Qdrant Full-Field Migration
Exports ALL fields + stores embedding as vector in Qdrant
No MongoDB needed after migration
"""
import os
import time
import logging
from typing import List, Dict, Any
from pymongo import MongoClient
from qdrant_client import QdrantClient
from qdrant_client.http import models
from tqdm import tqdm
from dotenv import load_dotenv
from datetime import datetime

# --------------------- Load Config ---------------------
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = "news_pipeline"
COLLECTION_NAME = "articles"

# Qdrant
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION = "articles_collection"

# Settings
BATCH_SIZE = 100
RETRY_DELAY = 3  # seconds


# --------------------- Clients ---------------------
def get_mongodb_client() -> MongoClient:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    logger.info("Connected to MongoDB")
    return client


def get_qdrant_client() -> QdrantClient:
    if not QDRANT_URL or not QDRANT_API_KEY:
        raise ValueError("QDRANT_URL and QDRANT_API_KEY must be set in .env")
    client = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
        timeout=60
    )
    logger.info("Connected to Qdrant Cloud")
    return client


# --------------------- Embedding Dimension ---------------------
def detect_embedding_dim(mongo_client: MongoClient) -> int:
    db = mongo_client[DATABASE_NAME]
    coll = db[COLLECTION_NAME]
    sample = coll.find_one({"embedding": {"$exists": True, "$ne": None}})
    if not sample or 'embedding' not in sample:
        raise ValueError("No document with 'embedding' found!")
    dim = len(sample['embedding'])
    logger.info(f"Detected embedding dimension: {dim}")
    return dim


# --------------------- Full Payload Builder ---------------------
def build_full_payload(article: Dict[str, Any]) -> Dict[str, Any]:
    """
    Export ALL fields from MongoDB.
    - Remove `embedding` (used as vector)
    - Keep `_id` as string in payload for debugging
    """
    payload = {}
    for key, value in article.items():
        if key == "embedding":
            continue
        # Convert datetime to ISO string
        if isinstance(value, datetime):
            payload[key] = value.isoformat()
        else:
            payload[key] = value
    # Explicitly add _id as string
    payload["_id"] = str(article["_id"])
    return payload


# --------------------- Process Article ---------------------
def process_article(article: Dict[str, Any]) -> Dict[str, Any]:
    if not article.get("embedding"):
        return None  # Skip if no embedding
    return {
        "id": str(article["_id"]),
        "vector": article["embedding"],  # ← STORE VECTOR IN QDRANT
        "payload": build_full_payload(article)
    }


# --------------------- Qdrant Collection Setup ---------------------
def ensure_qdrant_collection(qdrant_client: QdrantClient, vector_size: int):
    try:
        qdrant_client.delete_collection(collection_name=QDRANT_COLLECTION)
        logger.info(f"Deleted existing collection: {QDRANT_COLLECTION}")
    except Exception:
        logger.info("No existing collection to delete")

    # Step 1: Create collection
    qdrant_client.create_collection(
        collection_name=QDRANT_COLLECTION,
        vectors_config=models.VectorParams(
            size=vector_size,
            distance=models.Distance.COSINE
        ),
    )
    logger.info(f"Created Qdrant collection: {QDRANT_COLLECTION} (dim={vector_size})")

    # Step 2: Add payload indexes
    indexes = [
        ("published_at", models.PayloadSchemaType.DATETIME),
        ("source", models.PayloadSchemaType.KEYWORD),
        ("categories", models.PayloadSchemaType.KEYWORD),
        ("sentiment", models.PayloadSchemaType.KEYWORD),
        ("keywords", models.PayloadSchemaType.KEYWORD),
        ("_id", models.PayloadSchemaType.KEYWORD),
    ]

    for field_name, schema_type in indexes:
        try:
            qdrant_client.create_payload_index(
                collection_name=QDRANT_COLLECTION,
                field_name=field_name,
                field_schema=schema_type
            )
            logger.info(f"Indexed payload field: {field_name} → {schema_type}")
        except Exception as e:
            logger.warning(f"Failed to index {field_name}: {e}")


# --------------------- Upload Batch with Retry ---------------------
def upload_batch_with_retry(qdrant_client: QdrantClient, batch: List[Dict[str, Any]]):
    points = [
        models.PointStruct(
            id=item["id"],
            vector=item["vector"],
            payload=item["payload"]
        )
        for item in batch
    ]
    for attempt in range(3):
        try:
            qdrant_client.upsert(
                collection_name=QDRANT_COLLECTION,
                points=points,
                wait=True
            )
            logger.debug(f"Uploaded batch of {len(batch)} points")
            return
        except Exception as e:
            logger.warning(f"Upload failed (attempt {attempt+1}): {e}")
            time.sleep(RETRY_DELAY * (2 ** attempt))
    logger.error("Final upload failed after retries")
    raise


# --------------------- Main Migration ---------------------
def main():
    start_time = time.time()
    mongo_client = None
    qdrant_client = None
    try:
        # Connect
        mongo_client = get_mongodb_client()
        qdrant_client = get_qdrant_client()

        # Detect embedding size
        embedding_dim = detect_embedding_dim(mongo_client)

        # Setup Qdrant collection with indexes
        ensure_qdrant_collection(qdrant_client, embedding_dim)

        # Count total with embeddings
        db = mongo_client[DATABASE_NAME]
        coll = db[COLLECTION_NAME]
        total = coll.count_documents({"embedding": {"$exists": True, "$ne": None}})
        logger.info(f"Found {total:,} articles with embeddings")
        if total == 0:
            logger.warning("No articles to migrate.")
            return

        # Stream + process
        cursor = coll.find(
            {"embedding": {"$exists": True, "$ne": None}},
            no_cursor_timeout=True
        ).batch_size(BATCH_SIZE)

        batch = []
        processed = 0
        with tqdm(total=total, desc="Migrating", unit="doc") as pbar:
            for doc in cursor:
                item = process_article(doc)
                if item:
                    batch.append(item)
                if len(batch) >= BATCH_SIZE:
                    upload_batch_with_retry(qdrant_client, batch)
                    processed += len(batch)
                    pbar.update(len(batch))
                    batch.clear()

            # Final batch
            if batch:
                upload_batch_with_retry(qdrant_client, batch)
                processed += len(batch)
                pbar.update(len(batch))

        # Final stats
        collection_info = qdrant_client.get_collection(QDRANT_COLLECTION)
        logger.info("Migration completed!")
        logger.info(f" Processed: {processed:,}")
        logger.info(f" Qdrant points: {collection_info.points_count:,}")
        logger.info(f" Time taken: {time.time() - start_time:.2f}s")

    except Exception as e:
        logger.error(f"Migration failed: {e}", exc_info=True)
    finally:
        if mongo_client:
            mongo_client.close()
        if qdrant_client:
            qdrant_client.close()
        logger.info("Clients closed.")


if __name__ == "__main__":
    main()