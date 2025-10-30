"""
Configuration module for the news article pipeline.
Contains all constants, API keys, and configuration parameters.
"""

import os
from typing import List

# ============ API Configuration ============
# Multiple API keys for automatic fallback (add more keys to avoid rate limits)
NEWS_API_KEYS = [
    "5d4f2e276bf24a6f8b89f8a823948485",
    "7be1bf33897b47e0ab16c88599ac658f",
    "bd03c75ec9f14788bc588d1180bd1a0b",
    "f0562f7897534b859243e0360dd03d2e",
    "2718cd40402447d892badee4fc1d866e",
    "9a3f2b4af1e146da8a176eae131dc26a",
    "04af2855d76c4c2fa19fbd47f8493a28",
    "d971c798ad2a40f2b4b6777c4be38cbe",
    "d11cbcb8ef8447e7b541e5e61ba4cc6e",
    "4d6bebc94a5046d7bd2d64ac5331d5da",
    "d11cbcb8ef8447e7b541e5e61ba4cc6e",
    "9b3d22d01ec940c49dc1fcd3f5382bd1",
    "76da2d3934664b77a5bed306b8666629",
 "b97d37f3f4e548fe91a24beaaac7571a",
    "b08088f40be54ad09c3a4f63a42bacf1",
    "8bbe5a89d3304a0ba4227415c148b9c3",
    "01d9ee4aaee04beb96047ccfcd0a4e34",
    # Add more API keys below:
    # "your_second_api_key_here",
    # "your_third_api_key_here",
]

NEWS_API_KEY = NEWS_API_KEYS[0] if NEWS_API_KEYS else ""

NEWS_API_BASE_URL = "https://newsapi.org/v2/everything"
NEWS_API_TOP_HEADLINES_URL = "https://newsapi.org/v2/top-headlines"

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = "news_pipeline"
COLLECTION_NAME = "articles"

TOPICS: List[str] = [
    "*", "artificial intelligence", "machine learning", "deep learning", "neural networks",
    "cybersecurity", "data privacy", "blockchain technology", "cryptocurrency", "web3",
    "quantum computing", "robotics", "automation", "augmented reality", "virtual reality",
    "space exploration", "astronomy", "NASA", "SpaceX", "quantum physics",
    "startups", "venture capital", "entrepreneurship", "fintech", "stock market",
    "cryptocurrency news", "NFTs", "decentralized finance", "investment", "trading",
    "global economy", "inflation", "interest rates", "federal reserve", "market trends",
    "real estate", "commercial real estate", "housing market", "property investment",
    "global politics", "international relations", "geopolitics", "UN news", "NATO",
    "elections", "voting rights", "democracy", "human rights", "social justice",
    "climate change", "global warming", "biodiversity", "conservation", "wildlife",
    "medical research", "cancer research", "neuroscience", "mental health research",
    "renewable energy", "solar power", "wind energy", "sustainable technology",
    "programming", "software development", "cloud computing", "data science", "AI ethics",
    "football", "soccer", "basketball", "tennis", "olympics", "cricket", "F1", "golf",
    "movies", "hollywood", "bollywood", "streaming services", "music industry",
    "gaming news", "video games", "esports", "tech gadgets", "smartphones"
]
CATEGORIES: List[str] = [
    "Artificial Intelligence", "Technology", "Science", "Space",
    "Politics", "World News", "Business", "Finance", "Economy",
    "Health", "Medicine", "Environment", "Climate", "Sports",
    "Entertainment", "Movies", "Music", "Culture", "Education",
    "Travel", "Gaming", "Fashion", "Food", "Automotive",
    "Cryptocurrency", "Blockchain", "Startups", "Energy", "Robotics",
    "Mental Health", "Photography", "Law", "Philosophy", "History",
    "Books", "Theater", "Television", "Social Media", "AI Ethics",
    "Space Exploration", "Natural Disasters", "Economics Policy",
    "Science Innovations", "Biotechnology", "Genetics", "VR/AR",
    "Lifestyle", "Parenting", "Pets", "Fitness", "Nutrition",
    "Adventure", "Luxury", "Music Festivals", "Art", "Comics"
]

ZERO_SHOT_MODEL = "facebook/bart-large-mnli"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest"

BATCH_SIZE = 32
MAX_ARTICLES_PER_TOPIC = 100
REQUEST_TIMEOUT = 30
MAX_CONCURRENT_REQUESTS = 5

ENABLE_SENTIMENT_ANALYSIS = True
ENABLE_KEYWORD_EXTRACTION = True
ENABLE_EMBEDDINGS = True
ENABLE_LABELING = True

LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
LOG_FILE = "pipeline.log"
MAX_CONTENT_LENGTH = 5000
MIN_CONTENT_LENGTH = 50
EMBEDDING_BATCH_SIZE = 32
LABELING_BATCH_SIZE = 46