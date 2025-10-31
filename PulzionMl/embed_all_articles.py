#!/usr/bin/env python3
"""
Embed ALL articles in MongoDB using SentenceTransformers.
- Full content (no truncation)
- GPU-accelerated batching
- Idempotent (skip already embedded)
- Progress bar + logging
"""

import os
import logging
import time
from typing import List, Dict, Any
from pymongo import MongoClient, UpdateOne
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
from dotenv import load_dotenv
import torch

# --------------------- Config ---------------------
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

# Embedding
MODEL_NAME = "all-MiniLM-L6-v2"  # or any model you prefer
BATCH_SIZE = 32
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# --------------------- Embedding Generator ---------------------
class FullContentEmbedder:
    def __init__(self):
        logger.info(f"Loading model: {MODEL_NAME} on {DEVICE}")
        self.model = SentenceTransformer(MODEL_NAME, device=DEVICE)
        self.dim = self.model.get_sentence_embedding_dimension()
        logger.info(f"Model loaded. Embedding dim: {self.dim}")

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed a batch of full texts."""
        embeddings = self.model.encode(
            texts,
            batch_size=BATCH_SIZE,
            convert_to_numpy=True,
            show_progress_bar=False,
            normalize_embeddings=True
        )
        return [emb.tolist() for emb in embeddings]

# --------------------- MongoDB Streamer ---------------------
def get_articles_to_embed(client: MongoClient):
    collection = client[DATABASE_NAME][COLLECTION_NAME]
    # Only articles without embedding
    cursor = collection.find(
        {
            "$or": [
                {"embedding": {"$exists": False}},
                {"embedding": None},
                {"embedding": {"$size": 0}}
            ],
            "content": {"$exists": True, "$ne": None, "$ne": ""}
        },
        {"content": 1, "_id": 1},
        no_cursor_timeout=True
    )
    return cursor

# --------------------- Main Embedding Loop ---------------------
def main():
    start_time = time.time()
    client = None

    try:
        # Connect
        client = MongoClient(MONGODB_URI)
        client.admin.command('ping')
        logger.info("Connected to MongoDB")

        # Load model
        embedder = FullContentEmbedder()

        # Get articles to embed
        cursor = get_articles_to_embed(client)
        total = client[DATABASE_NAME][COLLECTION_NAME].count_documents({
            "$or": [
                {"embedding": {"$exists": False}},
                {"embedding": None},
                {"embedding": {"$size": 0}}
            ],
            "content": {"$exists": True}
        })
        logger.info(f"Found {total:,} articles to embed")

        if total == 0:
            logger.info("All articles already embedded.")
            return

        collection = client[DATABASE_NAME][COLLECTION_NAME]
        batch = []
        updates = []
        processed = 0

        with tqdm(total=total, desc="Embedding", unit="doc") as pbar:
            for doc in cursor:
                text = doc.get("content", "").strip()
                if not text:
                    continue

                batch.append((doc["_id"], text))

                # Process batch
                if len(batch) >= BATCH_SIZE:
                    ids, texts = zip(*batch)
                    try:
                        embeddings = embedder.embed_batch(list(texts))
                        for obj_id, embedding in zip(ids, embeddings):
                            updates.append(
                                UpdateOne(
                                    {"_id": obj_id},
                                    {
                                        "$set": {
                                            "embedding": embedding,
                                            "embedding_dim": len(embedding),
                                            "embedded_at": time.time()
                                        }
                                    }
                                )
                            )
                        # Bulk write
                        if updates:
                            result = collection.bulk_write(updates, ordered=False)
                            processed += result.modified_count
                            pbar.update(len(updates))
                            updates.clear()
                    except Exception as e:
                        logger.error(f"Batch failed: {e}")
                    finally:
                        batch.clear()

            # Final batch
            if batch:
                ids, texts = zip(*batch)
                try:
                    embeddings = embedder.embed_batch(list(texts))
                    for obj_id, embedding in zip(ids, embeddings):
                        updates.append(
                            UpdateOne(
                                {"_id": obj_id},
                                {
                                    "$set": {
                                        "embedding": embedding,
                                        "embedding_dim": len(embedding),
                                        "embedded_at": time.time()
                                    }
                                }
                            )
                        )
                    if updates:
                        result = collection.bulk_write(updates, ordered=False)
                        processed += result.modified_count
                        pbar.update(len(updates))
                except Exception as e:
                    logger.error(f"Final batch failed: {e}")

        logger.info(f"Embedded {processed:,} articles in {time.time() - start_time:.2f}s")

    except Exception as e:
        logger.error(f"Embedding failed: {e}", exc_info=True)
    finally:
        if client:
            client.close()
        logger.info("MongoDB connection closed.")

if __name__ == "__main__":
    main()