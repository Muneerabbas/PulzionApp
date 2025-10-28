# 📰 Intelligent News Article Pipeline

A high-performance, modular Python pipeline for fetching, labeling, and embedding news articles for intelligent recommendation and analysis.

## 🚀 Features

- **Async Article Fetching**: Fetch news from NewsAPI with rate limiting and deduplication
- **Multi-API Key Fallback**: Automatic rotation between multiple API keys to avoid rate limits
- **MongoDB Storage**: Efficient storage with indexing and upserts
- **Zero-Shot Classification**: Automatic categorization using BART-large-MNLI
- **Vector Embeddings**: Semantic embeddings using SentenceTransformers
- **Keyword Extraction**: KeyBERT-powered keyword extraction
- **Sentiment Analysis**: RoBERTa-based sentiment analysis
- **Batch Processing**: Memory-efficient batch processing for large datasets
- **Comprehensive Logging**: Detailed progress tracking and performance metrics

## 📋 System Requirements

- Python 3.8+
- 16GB RAM (recommended)
- MongoDB (local or cloud instance)
- GPU (optional, for faster processing)

## 🛠️ Installation

### 1. Install MongoDB

**Windows:**
```powershell
# Download and install from: https://www.mongodb.com/try/download/community
# Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas
```

### 2. Install Python Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure MongoDB URI (Optional)

If not using default MongoDB settings, set environment variable:

```powershell
$env:MONGODB_URI = "mongodb://localhost:27017/"
```

Or edit `config.py` directly.

## 📁 Project Structure

```
PulzionMl/
├── config.py           # Configuration and constants
├── fetcher.py          # Async news article fetcher
├── storage.py          # MongoDB storage operations
├── labeling.py         # Zero-shot classification
├── embeddings.py       # Vector embedding generation
├── analyzer.py         # Keyword extraction & sentiment
├── main.py             # Main orchestration script
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## 🎯 Usage

### Quick Start

Run the complete pipeline:

```powershell
python main.py
```

This will:
1. Fetch articles from 30+ topics + trending news
2. Store new articles in MongoDB
3. Assign categories to articles
4. Generate vector embeddings
5. Extract keywords
6. Analyze sentiment

### Test Individual Modules

**Test Fetcher:**
```powershell
python fetcher.py
```

**Test Storage:**
```powershell
python storage.py
```

**Test Labeling:**
```powershell
python labeling.py
```

**Test Embeddings:**
```powershell
python embeddings.py
```

**Test Analyzer:**
```powershell
python analyzer.py
```

## ⚙️ Configuration

Edit `config.py` to customize:

### Multiple API Keys (Recommended)

Add multiple NewsAPI keys for automatic fallback and higher rate limits:

```python
NEWS_API_KEYS = [
    "5d4f2e276bf24a6f8b89f8a823948485",  # Primary key
    "your_second_api_key_here",           # Backup key
    "your_third_api_key_here",            # Another backup
]
```

The pipeline automatically rotates keys when it encounters:
- Rate limit errors (429)
- Authentication failures (401, 403)
- Any API key-related errors

**See `API_KEYS_GUIDE.md` for detailed instructions.**

### Topics
```python
TOPICS = [
    "artificial intelligence", "cryptocurrency", 
    "climate change", "sports", ...
]
```

### Categories
```python
CATEGORIES = [
    "AI", "Politics", "Finance", "Health", 
    "Sports", "Entertainment", "Science", "Environment"
]
```

### Batch Sizes
```python
BATCH_SIZE = 10                # Concurrent API requests
EMBEDDING_BATCH_SIZE = 32      # Embedding batch size
LABELING_BATCH_SIZE = 8        # Classification batch size
```

### Feature Flags
```python
ENABLE_SENTIMENT_ANALYSIS = True
ENABLE_KEYWORD_EXTRACTION = True
ENABLE_EMBEDDINGS = True
ENABLE_LABELING = True
```

## 📊 Output

The pipeline provides detailed statistics:

```
✅ PIPELINE COMPLETED SUCCESSFULLY
================================================================================

📊 SUMMARY STATISTICS:
   ├─ Articles fetched:        342
   ├─ New articles stored:     287
   ├─ Articles updated:        55
   ├─ Articles labeled:        342
   ├─ Embeddings generated:    342
   ├─ Keywords extracted:      342
   └─ Sentiments analyzed:     342

⏱️  TIMING BREAKDOWN:
   ├─ 1. Fetch Articles         45.23s  (35.2%)
   ├─ 2. Store Articles          3.45s  ( 2.7%)
   ├─ 3. Label Articles         28.67s  (22.3%)
   ├─ 4. Generate Embeddings    31.89s  (24.8%)
   └─ 5. Analyze Articles       19.12s  (14.9%)
   └─ TOTAL TIME               128.36s  (100.0%)

⚡ Average processing speed:   2.66 articles/second
```

## 🗄️ Database Schema

Articles are stored with the following fields:

```json
{
    "_id": "article_hash",
    "url": "https://...",
    "title": "Article title",
    "description": "Article description",
    "content": "Article content",
    "source": "Source name",
    "author": "Author name",
    "published_at": "2024-01-01T00:00:00",
    "search_topic": "artificial intelligence",
    "fetched_at": "2024-01-01T00:00:00",
    "categories": ["AI", "Technology"],
    "category_scores": {"AI": 0.95, "Technology": 0.78},
    "embedding": [0.123, -0.456, ...],
    "embedding_dim": 384,
    "keywords": ["AI", "machine learning", "neural networks"],
    "keyword_scores": {"AI": 0.89, "machine learning": 0.82},
    "sentiment": "positive",
    "sentiment_scores": {"positive": 0.87, "negative": 0.08, "neutral": 0.05},
    "sentiment_confidence": 0.87
}
```

## 🔍 Querying Articles

Use MongoDB queries or the storage module:

```python
from storage import ArticleStorage

storage = ArticleStorage()

# Get recent articles
articles = storage.get_articles(limit=10, sort_by="published_at")

# Filter by category
ai_articles = storage.get_articles(
    filter_dict={"categories": "AI"},
    limit=50
)

# Get statistics
stats = storage.get_statistics()
print(stats)
```

## 🚦 Performance Optimization

### For Faster Processing:

1. **Use GPU**: Pipeline automatically uses GPU if available
2. **Adjust Batch Sizes**: Increase in `config.py` if you have more RAM
3. **Reduce Topics**: Fewer topics = faster fetching
4. **Disable Features**: Turn off unneeded features in config

### For Lower Memory Usage:

1. **Reduce Batch Sizes**: Lower `EMBEDDING_BATCH_SIZE` and `LABELING_BATCH_SIZE`
2. **Limit Content Length**: Reduce `MAX_CONTENT_LENGTH` in config
3. **Process Incrementally**: Run pipeline multiple times with fewer topics

## 📝 Logs

All logs are saved to `pipeline.log` and displayed in console.

Log levels can be adjusted in `config.py`:
```python
LOG_LEVEL = "INFO"  # DEBUG, INFO, WARNING, ERROR
```

## 🔧 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod --version`
- Check connection string in `config.py`
- For cloud MongoDB, update `MONGODB_URI` environment variable

### Out of Memory
- Reduce batch sizes in `config.py`
- Process fewer articles at once
- Close other applications

### Slow Performance
- Enable GPU if available
- Increase batch sizes if you have RAM
- Reduce number of topics
- Use faster MongoDB instance (SSD)

### API Rate Limits
- Reduce `MAX_CONCURRENT_REQUESTS` in config
- Add delays between requests
- Use NewsAPI paid plan for higher limits

## 🤝 Module Independence

Each module can be used independently:

```python
# Fetch only
from fetcher import fetch_articles
articles = await fetch_articles(["AI", "blockchain"])

# Label only
from labeling import ArticleLabeler
labeler = ArticleLabeler()
labeled = labeler.label_articles_batch(articles)

# Embed only
from embeddings import EmbeddingGenerator
generator = EmbeddingGenerator()
embedded = generator.generate_embeddings_batch(articles)
```

## 📈 Extending the Pipeline

### Add New Categories

Edit `config.py`:
```python
CATEGORIES = [
    "AI", "Politics", ..., "YourNewCategory"
]
```

### Add New Topics

Edit `config.py`:
```python
TOPICS = [
    "artificial intelligence", ..., "your new topic"
]
```

### Add Custom Processing

Edit `main.py` to add new stages:
```python
# Add after Stage 5
if not skip_custom:
    logger.info("🔧 STAGE 6: CUSTOM PROCESSING")
    # Your custom code here
```

## 📄 License

This project is provided as-is for educational and research purposes.

## 🙏 Acknowledgments

- NewsAPI for article data
- Hugging Face for transformer models
- MongoDB for database
- SentenceTransformers team
- KeyBERT developers

---

**Happy Article Processing! 🎉**
