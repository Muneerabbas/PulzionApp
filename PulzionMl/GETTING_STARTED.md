# 🚀 Getting Started Guide

This guide will help you set up and run the news article pipeline in under 10 minutes.

## ⚡ Quick Start (5 Steps)

### Step 1: Install MongoDB

**Option A - Local Installation (Recommended for development):**

Download and install from: https://www.mongodb.com/try/download/community

After installation, MongoDB should start automatically.

**Option B - MongoDB Atlas (Cloud - Free Tier):**

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update `config.py` with your connection string

### Step 2: Install Python Dependencies

```powershell
pip install -r requirements.txt
```

This will install all required packages including PyTorch, Transformers, and MongoDB driver.

⏱️ **Installation time**: 5-10 minutes (depending on your internet speed)

### Step 3: Verify Setup

```powershell
python setup.py
```

This script will:
- ✅ Check Python version
- ✅ Verify all dependencies
- ✅ Test MongoDB connection
- ✅ Validate API key
- ✅ Check for GPU
- ✅ Optionally download AI models

### Step 4: Run Quick Test

```powershell
python quick_test.py
```

This will test the entire pipeline with just 2 topics (AI and cryptocurrency).

⏱️ **Test time**: 2-3 minutes

### Step 5: Run Full Pipeline

```powershell
python main.py
```

This will fetch, label, and analyze articles from all 30+ topics.

⏱️ **Full run time**: 10-20 minutes (depending on your hardware)

---

## 📊 What Happens During a Full Run?

The pipeline executes 5 stages:

### Stage 1: Fetch Articles (40%)
- Fetches from NewsAPI using 30+ topics
- Fetches trending top headlines
- Removes duplicates
- **Output**: ~300-500 unique articles

### Stage 2: Store Articles (5%)
- Saves to MongoDB
- Creates indexes for fast queries
- Uses upserts (no duplicates)
- **Output**: New and updated articles count

### Stage 3: Label Articles (20%)
- Uses BART-large-MNLI for zero-shot classification
- Assigns multiple categories per article
- Categories: AI, Politics, Finance, Health, Sports, etc.
- **Output**: Articles with category labels

### Stage 4: Generate Embeddings (25%)
- Uses SentenceTransformers (all-MiniLM-L6-v2)
- Creates 384-dimensional vectors
- Enables semantic search
- **Output**: Articles with vector embeddings

### Stage 5: Analyze Articles (10%)
- Extracts keywords using KeyBERT
- Analyzes sentiment with RoBERTa
- **Output**: Keywords and sentiment scores

---

## 🎮 Using the Pipeline

### Search Articles

Interactive search tool:

```powershell
python search_articles.py
```

Or use command line:

```powershell
# Search by keyword
python search_articles.py search "artificial intelligence"

# Filter by category
python search_articles.py category AI

# Semantic similarity search
python search_articles.py similar "quantum computing breakthroughs"

# Show statistics
python search_articles.py stats
```

### Export Data

Export articles to JSON or CSV:

```powershell
# Export all articles
python export_data.py all json

# Export specific category
python export_data.py category AI csv

# Export recent articles (last 7 days)
python export_data.py recent 7 json
```

---

## ⚙️ Configuration

Edit `config.py` to customize:

### Add More Topics

```python
TOPICS = [
    "your new topic",
    "another topic",
    # ... existing topics
]
```

### Change Batch Sizes (for performance tuning)

```python
# Increase if you have more RAM
EMBEDDING_BATCH_SIZE = 64  # Default: 32
LABELING_BATCH_SIZE = 16   # Default: 8

# Decrease if running out of memory
EMBEDDING_BATCH_SIZE = 16
LABELING_BATCH_SIZE = 4
```

### Disable Features

```python
ENABLE_SENTIMENT_ANALYSIS = False  # Skip sentiment
ENABLE_KEYWORD_EXTRACTION = False  # Skip keywords
```

---

## 🐛 Troubleshooting

### "MongoDB connection failed"

**Solution 1**: Start MongoDB service
```powershell
# Windows (Run as Administrator)
net start MongoDB
```

**Solution 2**: Check if MongoDB is running
```powershell
mongod --version
```

**Solution 3**: Use MongoDB Atlas (cloud) and update URI in `config.py`

### "Out of Memory"

**Solution**: Reduce batch sizes in `config.py`
```python
EMBEDDING_BATCH_SIZE = 8   # Reduce from 32
LABELING_BATCH_SIZE = 2    # Reduce from 8
```

### "Too Slow"

**Solution 1**: Use GPU (automatically detected)

**Solution 2**: Reduce number of topics
```python
# Test with fewer topics first
TOPICS = ["AI", "cryptocurrency", "climate change"]
```

**Solution 3**: Increase batch sizes (if you have RAM)

### "NewsAPI Rate Limit"

**Solution**: Reduce concurrent requests
```python
MAX_CONCURRENT_REQUESTS = 2  # Reduce from 5
```

Or upgrade to paid NewsAPI plan.

---

## 💡 Tips for Best Performance

### 🚀 Speed Optimization

1. **Use GPU**: Pipeline auto-detects and uses GPU if available
2. **Increase batch sizes**: If you have 32GB+ RAM
3. **Run incrementally**: Pipeline only processes new articles on subsequent runs

### 💾 Memory Optimization

1. **Reduce batch sizes**: Lower `EMBEDDING_BATCH_SIZE` and `LABELING_BATCH_SIZE`
2. **Limit topics**: Start with 5-10 topics instead of 30+
3. **Reduce content length**: Lower `MAX_CONTENT_LENGTH` in config

### ⚡ Incremental Processing

The pipeline is smart! On subsequent runs:
- Only fetches NEW articles (duplicates are skipped)
- Only labels articles WITHOUT categories
- Only generates embeddings for articles WITHOUT embeddings
- Only analyzes articles WITHOUT keywords/sentiment

So run it daily/weekly to keep your database updated!

---

## 📝 Understanding the Output

After running `python main.py`, you'll see:

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
```

All logs are saved to `pipeline.log`.

---

## 🎯 Next Steps

1. **Explore the data**: Use `search_articles.py` to query articles
2. **Build a recommender**: Use embeddings for similarity-based recommendations
3. **Visualize trends**: Export data and create dashboards
4. **Schedule runs**: Use Task Scheduler (Windows) to run daily
5. **Extend the pipeline**: Add custom processing in `main.py`

---

## 📚 Learn More

- **Full Documentation**: See `README.md`
- **Module Details**: Check docstrings in each `.py` file
- **Database Queries**: See `storage.py` for query examples
- **Custom Search**: See `search_articles.py` for search examples

---

**Need Help?** Check the troubleshooting section above or review the logs in `pipeline.log`.

Happy analyzing! 🎉
