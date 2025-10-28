"""
Article analysis module for keyword extraction and sentiment analysis.
Uses KeyBERT for keywords and transformers for sentiment.
"""

import logging
from typing import Dict, List, Optional, Tuple
import torch
from keybert import KeyBERT
from transformers import pipeline
from tqdm import tqdm

import config

logger = logging.getLogger(__name__)


class ArticleAnalyzer:
    """Extract keywords and sentiment from articles."""
    
    def __init__(
        self,
        embedding_model: Optional[str] = None,
        sentiment_model: Optional[str] = None
    ):
        """
        Initialize analyzer with models.
        
        Args:
            embedding_model: Model for KeyBERT (uses config if None)
            sentiment_model: Sentiment analysis model (uses config if None)
        """
        self.embedding_model = embedding_model or config.EMBEDDING_MODEL
        self.sentiment_model = sentiment_model or config.SENTIMENT_MODEL
        self.device = 0 if torch.cuda.is_available() else -1
        
        logger.info(f"Initializing analyzer (device: {'GPU' if self.device == 0 else 'CPU'})")
        
        # Initialize KeyBERT
        try:
            logger.info(f"Loading KeyBERT with model: {self.embedding_model}")
            self.kw_model = KeyBERT(model=self.embedding_model)
            logger.info("✓ KeyBERT loaded successfully")
        except Exception as e:
            logger.error(f"Error loading KeyBERT: {str(e)}")
            self.kw_model = None
        
        # Initialize sentiment analyzer if enabled
        self.sentiment_analyzer = None
        if config.ENABLE_SENTIMENT_ANALYSIS:
            try:
                logger.info(f"Loading sentiment analyzer: {self.sentiment_model}")
                self.sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model=self.sentiment_model,
                    device=self.device,
                    top_k=None  # Return all scores
                )
                logger.info("✓ Sentiment analyzer loaded successfully")
            except Exception as e:
                logger.error(f"Error loading sentiment analyzer: {str(e)}")
                self.sentiment_analyzer = None
    
    def _prepare_text(self, article: Dict) -> str:
        """
        Prepare article text for analysis.
        
        Args:
            article: Article dict
            
        Returns:
            Combined text
        """
        title = article.get('title', '')
        description = article.get('description', '')
        content = article.get('content', '')
        
        # Combine with priority on meaningful content
        text = f"{title}. {description}. {content}"
        return text.strip()
    
    def extract_keywords(
        self,
        article: Dict,
        top_n: int = 10,
        keyphrase_ngram_range: Tuple[int, int] = (1, 2),
        diversity: float = 0.5
    ) -> List[Tuple[str, float]]:
        """
        Extract keywords from article using KeyBERT.
        
        Args:
            article: Article dict
            top_n: Number of keywords to extract
            keyphrase_ngram_range: Range of n-grams to consider
            diversity: Diversity of keywords (0-1)
            
        Returns:
            List of (keyword, score) tuples
        """
        if not self.kw_model:
            logger.warning("KeyBERT not available")
            return []
        
        text = self._prepare_text(article)
        
        if not text or len(text) < 50:
            logger.debug(f"Text too short for keywords: {article.get('url', 'unknown')}")
            return []
        
        try:
            keywords = self.kw_model.extract_keywords(
                text,
                keyphrase_ngram_range=keyphrase_ngram_range,
                stop_words='english',
                top_n=top_n,
                use_mmr=True,  # Maximal Marginal Relevance for diversity
                diversity=diversity
            )
            
            return keywords
            
        except Exception as e:
            logger.error(f"Error extracting keywords: {str(e)}")
            return []
    
    def analyze_sentiment(self, article: Dict) -> Optional[Dict]:
        """
        Analyze sentiment of article.
        
        Args:
            article: Article dict
            
        Returns:
            Dict with sentiment label and scores
        """
        if not self.sentiment_analyzer:
            logger.warning("Sentiment analyzer not available")
            return None
        
        text = self._prepare_text(article)
        
        if not text:
            return None
        
        # Truncate text for sentiment model (max 512 tokens)
        max_length = 512
        if len(text) > max_length:
            text = text[:max_length]
        
        try:
            result = self.sentiment_analyzer(text)[0]
            
            # Process results
            sentiment_scores = {}
            max_score = 0
            sentiment_label = "neutral"
            
            for item in result:
                label = item['label'].lower()
                score = item['score']
                sentiment_scores[label] = score
                
                if score > max_score:
                    max_score = score
                    sentiment_label = label
            
            return {
                'sentiment': sentiment_label,
                'sentiment_scores': sentiment_scores,
                'sentiment_confidence': max_score
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}")
            return None
    
    def analyze_article(
        self,
        article: Dict,
        extract_kw: bool = True,
        analyze_sent: bool = True,
        top_keywords: int = 10
    ) -> Dict:
        """
        Perform complete analysis on article.
        
        Args:
            article: Article dict
            extract_kw: Extract keywords
            analyze_sent: Analyze sentiment
            top_keywords: Number of keywords to extract
            
        Returns:
            Article with added analysis fields
        """
        analyzed = article.copy()
        
        # Extract keywords
        if extract_kw and config.ENABLE_KEYWORD_EXTRACTION:
            keywords = self.extract_keywords(article, top_n=top_keywords)
            analyzed['keywords'] = [kw for kw, _ in keywords]
            analyzed['keyword_scores'] = {kw: float(score) for kw, score in keywords}
        
        # Analyze sentiment
        if analyze_sent and config.ENABLE_SENTIMENT_ANALYSIS:
            sentiment_data = self.analyze_sentiment(article)
            if sentiment_data:
                analyzed.update(sentiment_data)
        
        return analyzed
    
    def analyze_articles_batch(
        self,
        articles: List[Dict],
        extract_kw: bool = True,
        analyze_sent: bool = True,
        top_keywords: int = 10,
        batch_size: int = 1  # Process one at a time for KeyBERT
    ) -> List[Dict]:
        """
        Analyze multiple articles with progress tracking.
        
        Args:
            articles: List of article dicts
            extract_kw: Extract keywords
            analyze_sent: Analyze sentiment
            top_keywords: Number of keywords
            batch_size: Not used (kept for API consistency)
            
        Returns:
            List of analyzed articles
        """
        if not articles:
            return []
        
        logger.info(f"Analyzing {len(articles)} articles")
        
        analyzed_articles = []
        
        for article in tqdm(articles, desc="Analyzing articles"):
            analyzed = self.analyze_article(
                article,
                extract_kw=extract_kw,
                analyze_sent=analyze_sent,
                top_keywords=top_keywords
            )
            analyzed_articles.append(analyzed)
        
        # Count successes
        keyword_count = sum(1 for a in analyzed_articles if a.get('keywords'))
        sentiment_count = sum(1 for a in analyzed_articles if a.get('sentiment'))
        
        logger.info(f"✓ Keywords extracted: {keyword_count}/{len(articles)}")
        logger.info(f"✓ Sentiment analyzed: {sentiment_count}/{len(articles)}")
        
        return analyzed_articles
    
    def get_keyword_statistics(self, articles: List[Dict]) -> Dict:
        """
        Get statistics about keywords across articles.
        
        Args:
            articles: List of analyzed articles
            
        Returns:
            Dict with keyword statistics
        """
        all_keywords = []
        keyword_counts = {}
        
        for article in articles:
            keywords = article.get('keywords', [])
            all_keywords.extend(keywords)
            
            for kw in keywords:
                keyword_counts[kw] = keyword_counts.get(kw, 0) + 1
        
        # Sort by frequency
        sorted_keywords = sorted(
            keyword_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return {
            'total_keywords': len(all_keywords),
            'unique_keywords': len(keyword_counts),
            'top_keywords': sorted_keywords[:20]
        }
    
    def get_sentiment_distribution(self, articles: List[Dict]) -> Dict:
        """
        Get sentiment distribution across articles.
        
        Args:
            articles: List of analyzed articles
            
        Returns:
            Dict with sentiment counts
        """
        distribution = {'positive': 0, 'negative': 0, 'neutral': 0}
        
        for article in articles:
            sentiment = article.get('sentiment', 'neutral')
            if sentiment in distribution:
                distribution[sentiment] += 1
        
        return distribution


def analyze_articles(
    articles: List[Dict],
    extract_keywords: bool = True,
    analyze_sentiment: bool = True
) -> List[Dict]:
    """
    Convenience function to analyze articles.
    
    Args:
        articles: List of article dicts
        extract_keywords: Extract keywords
        analyze_sentiment: Analyze sentiment
        
    Returns:
        List of analyzed articles
    """
    analyzer = ArticleAnalyzer()
    return analyzer.analyze_articles_batch(
        articles,
        extract_kw=extract_keywords,
        analyze_sent=analyze_sentiment
    )


if __name__ == "__main__":
    # Test analyzer
    logging.basicConfig(level=logging.INFO, format=config.LOG_FORMAT)
    
    # Sample articles
    test_articles = [
        {
            'title': 'Breakthrough in Renewable Energy',
            'description': 'Scientists develop new solar panel technology with 50% efficiency',
            'content': 'A team of researchers has achieved a major breakthrough in solar energy...',
            'url': 'https://example.com/1'
        },
        {
            'title': 'Economic Crisis Deepens',
            'description': 'Global markets face worst downturn in decades',
            'content': 'Financial analysts warn of prolonged economic recession as markets tumble...',
            'url': 'https://example.com/2'
        }
    ]
    
    analyzer = ArticleAnalyzer()
    analyzed = analyzer.analyze_articles_batch(test_articles)
    
    for article in analyzed:
        print(f"\n{'='*60}")
        print(f"Title: {article['title']}")
        print(f"Keywords: {article.get('keywords', [])}")
        print(f"Sentiment: {article.get('sentiment', 'N/A')}")
        print(f"Sentiment Scores: {article.get('sentiment_scores', {})}")
