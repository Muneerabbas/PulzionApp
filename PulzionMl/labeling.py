"""
Zero-shot classification module for categorizing news articles.
Uses transformer models with batch processing for efficiency.
"""

import logging
from typing import Callable, Dict, List, Optional
import torch
from transformers import pipeline
from tqdm import tqdm

import config

logger = logging.getLogger(__name__)


class ArticleLabeler:
    """Zero-shot classification for article categorization."""
    
    def __init__(self, model_name: Optional[str] = None, categories: Optional[List[str]] = None):
        """
        Initialize the labeler with a zero-shot classification model.
        
        Args:
            model_name: Hugging Face model name (uses config if None)
            categories: List of categories (uses config if None)
        """
        self.model_name = model_name or config.ZERO_SHOT_MODEL
        self.categories = categories or config.CATEGORIES
        self.device = 0 if torch.cuda.is_available() else -1
        
        logger.info(f"Loading zero-shot classifier: {self.model_name}")
        logger.info(f"Device: {'GPU' if self.device == 0 else 'CPU'}")
        
        try:
            self.classifier = pipeline(
                "zero-shot-classification",
                model=self.model_name,
                device=self.device
            )
            logger.info("✓ Zero-shot classifier loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading classifier: {str(e)}")
            raise
    
    def _prepare_text(self, article: Dict) -> str:
        """
        Prepare article text for classification.
        
        Args:
            article: Article dict
            
        Returns:
            Combined text for classification
        """
        title = article.get('title', '')
        description = article.get('description', '')
        
        # Combine title and description (content is too long)
        text = f"{title}. {description}"
        
        # Limit length for model input
        max_length = 512
        if len(text) > max_length:
            text = text[:max_length]
        
        return text.strip()
    
    def label_article(
        self, 
        article: Dict, 
        multi_label: bool = True,
        threshold: float = 0.5
    ) -> Dict[str, any]:
        """
        Label a single article with categories.
        
        Args:
            article: Article dict
            multi_label: Allow multiple categories
            threshold: Confidence threshold for multi-label
            
        Returns:
            Dict with categories and scores
        """
        text = self._prepare_text(article)
        
        if not text:
            logger.warning(f"Empty text for article: {article.get('url', 'unknown')}")
            return {'categories': [], 'scores': {}}
        
        try:
            result = self.classifier(
                text,
                self.categories,
                multi_label=multi_label
            )
            
            if multi_label:
                # Filter by threshold
                categories = []
                scores = {}
                for label, score in zip(result['labels'], result['scores']):
                    if score >= threshold:
                        categories.append(label)
                        scores[label] = float(score)
                
                # Ensure at least one category
                if not categories and result['labels']:
                    top_label = result['labels'][0]
                    categories = [top_label]
                    scores[top_label] = float(result['scores'][0])
            else:
                # Single label (highest score)
                categories = [result['labels'][0]]
                scores = {result['labels'][0]: float(result['scores'][0])}
            
            return {
                'categories': categories,
                'scores': scores
            }
            
        except Exception as e:
            logger.error(f"Error labeling article: {str(e)}")
            return {'categories': [], 'scores': {}}
    
    def label_articles_batch(
        self,
        articles: List[Dict],
        multi_label: bool = True,
        threshold: float = 0.5,
        batch_size: Optional[int] = None,
        batch_callback: Optional[Callable[[List[Dict]], None]] = None
    ) -> List[Dict]:
        """
        Label multiple articles with batch processing.
        
        Args:
            articles: List of article dicts
            multi_label: Allow multiple categories
            threshold: Confidence threshold for multi-label
            batch_size: Batch size for processing (uses config if None)
            batch_callback: Optional callable invoked with each labeled batch
        
        Returns:
            List of articles with added category information
        """
        if not articles:
            return []
        
        batch_size = batch_size or config.LABELING_BATCH_SIZE
        logger.info(f"Labeling {len(articles)} articles (batch size: {batch_size})")
        
        labeled_articles = []
        
        progress_bar = tqdm(
            range(0, len(articles), batch_size),
            desc="📝 Labeling articles",
            unit=" batch",
            dynamic_ncols=True
        )
        
        for i in progress_bar:
            batch = articles[i:i + batch_size]
            batch_results: List[Dict] = []
            
            # Prepare texts
            texts = [self._prepare_text(article) for article in batch]
            
            valid_indices = [idx for idx, text in enumerate(texts) if text]
            valid_texts = [texts[idx] for idx in valid_indices]
            
            if not valid_texts:
                progress_bar.set_postfix_str("⚠️ No valid texts in batch")
                batch_results.extend(article.copy() for article in batch)
                labeled_articles.extend(batch_results)
                if batch_callback:
                    try:
                        batch_callback(batch_results)
                    except Exception as callback_error:
                        logger.error(f"Error in batch callback: {callback_error}")
                continue
            
            try:
                # Batch classification
                results = self.classifier(
                    valid_texts,
                    self.categories,
                    multi_label=multi_label
                )
                
                # Process results
                for idx, result in zip(valid_indices, results):
                    article = batch[idx].copy()
                    
                    if multi_label:
                        categories = []
                        scores = {}
                        for label, score in zip(result['labels'], result['scores']):
                            if score >= threshold:
                                categories.append(label)
                                scores[label] = float(score)
                        
                        # Ensure at least one category
                        if not categories and result['labels']:
                            top_label = result['labels'][0]
                            categories = [top_label]
                            scores[top_label] = float(result['scores'][0])
                    else:
                        # Single label
                        categories = [result['labels'][0]]
                        scores = {result['labels'][0]: float(result['scores'][0])}
                    
                    article['categories'] = categories
                    article['category_scores'] = scores
                    batch_results.append(article)
                
                # Handle invalid articles
                invalid_indices = set(range(len(batch))) - set(valid_indices)
                for idx in invalid_indices:
                    article = batch[idx].copy()
                    article['categories'] = []
                    article['category_scores'] = {}
                    batch_results.append(article)
                
            except Exception as e:
                logger.error(f"Error in batch labeling: {str(e)}")
                # Add articles without labels
                batch_results.extend(article.copy() for article in batch)
            finally:
                labeled_articles.extend(batch_results)
                if batch_callback and batch_results:
                    try:
                        batch_callback(batch_results)
                    except Exception as callback_error:
                        logger.error(f"Error in batch callback: {callback_error}")
        success_count = sum(1 for a in labeled_articles if a.get('categories'))
        logger.info(f"✓ Successfully labeled {success_count}/{len(articles)} articles")
        
        return labeled_articles
    
    def get_category_distribution(self, articles: List[Dict]) -> Dict[str, int]:
        """
        Get distribution of categories across articles.
        
        Args:
            articles: List of labeled articles
            
        Returns:
            Dict mapping category to count
        """
        distribution = {cat: 0 for cat in self.categories}
        
        for article in articles:
            for category in article.get('categories', []):
                if category in distribution:
                    distribution[category] += 1
        
        return distribution


def label_articles(
    articles: List[Dict],
    multi_label: bool = True,
    threshold: float = 0.5
) -> List[Dict]:
    """
    Convenience function to label articles.
    
    Args:
        articles: List of article dicts
        multi_label: Allow multiple categories
        threshold: Confidence threshold
        
    Returns:
        List of labeled articles
    """
    labeler = ArticleLabeler()
    return labeler.label_articles_batch(articles, multi_label, threshold)


if __name__ == "__main__":
    # Test the labeler
    logging.basicConfig(level=logging.INFO, format=config.LOG_FORMAT)
    
    # Sample article
    test_articles = [
        {
            'title': 'AI Breakthrough in Healthcare',
            'description': 'New machine learning model predicts diseases with 95% accuracy',
            'url': 'https://example.com/1'
        },
        {
            'title': 'Stock Market Crashes',
            'description': 'Global markets see worst day since 2008',
            'url': 'https://example.com/2'
        }
    ]
    
    labeler = ArticleLabeler()
    labeled = labeler.label_articles_batch(test_articles)
    
    for article in labeled:
        print(f"\nTitle: {article['title']}")
        print(f"Categories: {article.get('categories', [])}")
        print(f"Scores: {article.get('category_scores', {})}")
