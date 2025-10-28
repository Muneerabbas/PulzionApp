"""
Vector embedding generation for news articles using SentenceTransformers.
Optimized for batch processing and memory efficiency.
"""

import logging
from typing import Dict, List, Optional
import numpy as np
import torch
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

import config

logger = logging.getLogger(__name__)


class EmbeddingGenerator:
    """Generate semantic embeddings for articles."""
    
    def __init__(self, model_name: Optional[str] = None):
        """
        Initialize embedding model.
        
        Args:
            model_name: SentenceTransformer model name (uses config if None)
        """
        self.model_name = model_name or config.EMBEDDING_MODEL
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        logger.info(f"Loading embedding model: {self.model_name}")
        logger.info(f"Device: {self.device}")
        
        try:
            self.model = SentenceTransformer(self.model_name, device=self.device)
            self.embedding_dim = self.model.get_sentence_embedding_dimension()
            logger.info(f"✓ Embedding model loaded (dimension: {self.embedding_dim})")
            
        except Exception as e:
            logger.error(f"Error loading embedding model: {str(e)}")
            raise
    
    def _prepare_text(self, article: Dict) -> str:
        """
        Prepare article text for embedding.
        
        Args:
            article: Article dict
            
        Returns:
            Combined text for embedding
        """
        title = article.get('title', '')
        description = article.get('description', '')
        content = article.get('content', '')
        
        # Combine all text fields with priority on title and description
        # Limit content length to avoid memory issues
        content_preview = content[:1000] if content else ''
        
        text = f"{title}. {description}. {content_preview}"
        return text.strip()
    
    def generate_embedding(self, article: Dict) -> Optional[np.ndarray]:
        """
        Generate embedding for a single article.
        
        Args:
            article: Article dict
            
        Returns:
            Embedding vector or None if error
        """
        text = self._prepare_text(article)
        
        if not text:
            logger.warning(f"Empty text for article: {article.get('url', 'unknown')}")
            return None
        
        try:
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            return None
    
    def generate_embeddings_batch(
        self,
        articles: List[Dict],
        batch_size: Optional[int] = None,
        show_progress: bool = True
    ) -> List[Dict]:
        """
        Generate embeddings for multiple articles with batch processing.
        
        Args:
            articles: List of article dicts
            batch_size: Batch size (uses config if None)
            show_progress: Show progress bar
            
        Returns:
            List of articles with added embedding field
        """
        if not articles:
            return []
        
        batch_size = batch_size or config.EMBEDDING_BATCH_SIZE
        logger.info(f"Generating embeddings for {len(articles)} articles (batch size: {batch_size})")
        
        embedded_articles = []
        
        # Process in batches
        batches = [articles[i:i + batch_size] for i in range(0, len(articles), batch_size)]
        
        for batch in tqdm(batches, desc="Generating embeddings", disable=not show_progress):
            # Prepare texts
            texts = [self._prepare_text(article) for article in batch]
            
            # Filter out empty texts
            valid_indices = [idx for idx, text in enumerate(texts) if text]
            valid_texts = [texts[idx] for idx in valid_indices]
            
            if not valid_texts:
                logger.warning("Batch has no valid texts")
                embedded_articles.extend(batch)
                continue
            
            try:
                # Generate embeddings in batch
                embeddings = self.model.encode(
                    valid_texts,
                    batch_size=batch_size,
                    convert_to_numpy=True,
                    show_progress_bar=False
                )
                
                # Add embeddings to articles
                for idx, embedding in zip(valid_indices, embeddings):
                    article = batch[idx].copy()
                    # Convert to list for MongoDB storage
                    article['embedding'] = embedding.tolist()
                    article['embedding_dim'] = len(embedding)
                    embedded_articles.append(article)
                
                # Handle invalid articles
                invalid_indices = set(range(len(batch))) - set(valid_indices)
                for idx in invalid_indices:
                    article = batch[idx].copy()
                    article['embedding'] = None
                    article['embedding_dim'] = 0
                    embedded_articles.append(article)
                
            except Exception as e:
                logger.error(f"Error in batch embedding: {str(e)}")
                # Add articles without embeddings
                for article in batch:
                    article_copy = article.copy()
                    article_copy['embedding'] = None
                    article_copy['embedding_dim'] = 0
                    embedded_articles.append(article_copy)
        
        success_count = sum(1 for a in embedded_articles if a.get('embedding') is not None)
        logger.info(f"✓ Successfully generated embeddings for {success_count}/{len(articles)} articles")
        
        return embedded_articles
    
    def compute_similarity(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray
    ) -> float:
        """
        Compute cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Similarity score (0-1)
        """
        try:
            # Normalize vectors
            norm1 = np.linalg.norm(embedding1)
            norm2 = np.linalg.norm(embedding2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            # Cosine similarity
            similarity = np.dot(embedding1, embedding2) / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error computing similarity: {str(e)}")
            return 0.0
    
    def find_similar_articles(
        self,
        query_embedding: np.ndarray,
        article_embeddings: List[np.ndarray],
        top_k: int = 5
    ) -> List[tuple]:
        """
        Find most similar articles to a query.
        
        Args:
            query_embedding: Query embedding vector
            article_embeddings: List of article embeddings
            top_k: Number of similar articles to return
            
        Returns:
            List of (index, similarity_score) tuples
        """
        similarities = []
        
        for idx, embedding in enumerate(article_embeddings):
            similarity = self.compute_similarity(query_embedding, embedding)
            similarities.append((idx, similarity))
        
        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:top_k]
    
    def embed_query(self, query: str) -> Optional[np.ndarray]:
        """
        Generate embedding for a search query.
        
        Args:
            query: Search query text
            
        Returns:
            Embedding vector or None
        """
        if not query:
            return None
        
        try:
            embedding = self.model.encode(query, convert_to_numpy=True)
            return embedding
        except Exception as e:
            logger.error(f"Error embedding query: {str(e)}")
            return None


def generate_embeddings(articles: List[Dict], batch_size: Optional[int] = None) -> List[Dict]:
    """
    Convenience function to generate embeddings.
    
    Args:
        articles: List of article dicts
        batch_size: Batch size for processing
        
    Returns:
        List of articles with embeddings
    """
    generator = EmbeddingGenerator()
    return generator.generate_embeddings_batch(articles, batch_size)


if __name__ == "__main__":
    # Test embeddings
    logging.basicConfig(level=logging.INFO, format=config.LOG_FORMAT)
    
    # Sample articles
    test_articles = [
        {
            'title': 'AI Revolution in Healthcare',
            'description': 'Machine learning transforms medical diagnosis',
            'content': 'Artificial intelligence is revolutionizing healthcare...',
            'url': 'https://example.com/1'
        },
        {
            'title': 'Climate Change Impact',
            'description': 'Global warming affects ecosystems worldwide',
            'content': 'Scientists report alarming climate trends...',
            'url': 'https://example.com/2'
        }
    ]
    
    generator = EmbeddingGenerator()
    embedded = generator.generate_embeddings_batch(test_articles)
    
    for article in embedded:
        print(f"\nTitle: {article['title']}")
        print(f"Embedding dimension: {article.get('embedding_dim', 0)}")
        
        if article.get('embedding'):
            print(f"Embedding sample: {article['embedding'][:5]}...")
    
    # Test similarity
    if len(embedded) >= 2 and embedded[0].get('embedding') and embedded[1].get('embedding'):
        emb1 = np.array(embedded[0]['embedding'])
        emb2 = np.array(embedded[1]['embedding'])
        similarity = generator.compute_similarity(emb1, emb2)
        print(f"\nSimilarity between articles: {similarity:.4f}")
