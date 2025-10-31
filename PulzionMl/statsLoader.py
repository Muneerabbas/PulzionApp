#!/usr/bin/env python3
"""
Trending Stats Generator — FIXED for String Dates
Handles ISO strings with 'Z' timezone.
Logs everything for debugging.
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any
from pymongo import MongoClient
from collections import defaultdict, Counter
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

# MongoDB Config
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = "news_pipeline"
ARTICLES_COLLECTION = "articles"
STATS_COLLECTION = "trending_stats"

client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
articles_coll = db[ARTICLES_COLLECTION]
stats_coll = db[STATS_COLLECTION]


def get_articles(days_back: int = 30) -> List[Dict]:
    """Get articles from last N days — FIXED for string dates"""
    cutoff = datetime.now() - timedelta(days=days_back)
    cutoff_str = cutoff.isoformat() + "Z"  # Add 'Z' for UTC match

    print(f"Cutoff date: {cutoff_str}")

    # FIXED: Use MongoDB aggregation for date parsing
    pipeline = [
        {
            "$match": {
                "published_at": {
                    "$gte": cutoff_str
                }
            }
        },
        {
            "$project": {
                "published_at": 1,
                "title": 1,
                "sentiment": 1,
                "keywords": 1,
                "categories": 1,
                "source": 1,
                "search_topic": 1
            }
        }
    ]

    cursor = articles_coll.aggregate(pipeline)
    articles = list(cursor)

    print(f"Found {len(articles)} articles with published_at >= {cutoff_str}")

    if len(articles) == 0:
        # Debug: Show date range in collection
        dates = articles_coll.aggregate([
            {"$group": {
                "_id": None,
                "min_date": {"$min": "$published_at"},
                "max_date": {"$max": "$published_at"}
            }}
        ])
        date_range = list(dates)
        if date_range:
            print(f"Collection date range: {date_range[0]['min_date']} to {date_range[0]['max_date']}")

    return articles


def calculate_sentiment_stats(articles: List[Dict]) -> Dict:
    """Sentiment % breakdown"""
    sentiments = Counter()
    total = len(articles)

    for article in articles:
        sent = article.get("sentiment", "unknown")
        sentiments[sent] += 1

    print(f"Sentiment counts: {dict(sentiments)}")

    return {
        "total_articles": total,
        "positive": round((sentiments["positive"] / total) * 100, 2) if total > 0 else 0,
        "negative": round((sentiments["negative"] / total) * 100, 2) if total > 0 else 0,
        "neutral": round((sentiments["neutral"] / total) * 100, 2) if total > 0 else 0,
        "unknown": round((sentiments["unknown"] / total) * 100, 2) if total > 0 else 0,
        "counts": dict(sentiments)
    }


def calculate_keyword_stats(articles: List[Dict], top_n: int = 50) -> Dict:
    """Top keywords by volume + sentiment"""
    keyword_data = defaultdict(lambda: {"count": 0, "positive": 0, "negative": 0, "neutral": 0})

    for article in articles:
        sent = article.get("sentiment", "unknown")
        keywords = article.get("keywords", [])

        for kw in keywords[:10]:  # Top 10 keywords per article
            keyword_data[kw]["count"] += 1
            keyword_data[kw][sent] += 1

    # Sort by count
    sorted_keywords = sorted(keyword_data.items(), key=lambda x: x[1]["count"], reverse=True)[:top_n]

    print(f"Top keyword: {sorted_keywords[0][0] if sorted_keywords else 'None'}")

    return {
        "top_keywords": [
            {
                "keyword": kw,
                "volume": data["count"],
                "positive_pct": round((data["positive"] / data["count"]) * 100, 2) if data["count"] > 0 else 0,
                "negative_pct": round((data["negative"] / data["count"]) * 100, 2) if data["count"] > 0 else 0,
                "neutral_pct": round((data["neutral"] / data["count"]) * 100, 2) if data["count"] > 0 else 0,
                "sentiment_trend": "positive" if data["positive"] > data["negative"] else "negative" if data[
                                                                                                            "negative"] >
                                                                                                        data[
                                                                                                            "positive"] else "neutral"
            }
            for kw, data in sorted_keywords
        ]
    }


def calculate_category_stats(articles: List[Dict]) -> Dict:
    """Category performance"""
    category_data = defaultdict(lambda: {"count": 0, "avg_sentiment_score": 0.0})

    for article in articles:
        categories = article.get("categories", [])
        sent_score = article.get("sentiment_confidence", 0.0)

        for cat in categories:
            category_data[cat]["count"] += 1
            category_data[cat]["avg_sentiment_score"] += sent_score

    # Calculate averages
    for cat in category_data:
        if category_data[cat]["count"] > 0:
            category_data[cat]["avg_sentiment_score"] /= category_data[cat]["count"]

    return {
        "top_categories": [
            {
                "category": cat,
                "volume": data["count"],
                "avg_sentiment_confidence": round(data["avg_sentiment_score"], 3)
            }
            for cat, data in sorted(category_data.items(), key=lambda x: x[1]["count"], reverse=True)[:20]
        ]
    }


def calculate_source_stats(articles: List[Dict]) -> Dict:
    """Source rankings"""
    source_data = Counter()

    for article in articles:
        source = article.get("source", "Unknown")
        source_data[source] += 1

    return {
        "top_sources": [
            {
                "source": source,
                "volume": count
            }
            for source, count in source_data.most_common(15)
        ]
    }


def calculate_trending_topics(articles: List[Dict], days_back: int = 7) -> Dict:
    """Daily trending topics"""
    cutoff = datetime.now() - timedelta(days=days_back)
    cutoff_str = cutoff.isoformat() + "Z"

    recent = [a for a in articles if a.get("published_at", "") >= cutoff_str]

    topic_counter = Counter()
    for article in recent:
        topic = article.get("search_topic", "")
        topic_counter[topic] += 1

    return {
        "trending_topics": [
            {
                "topic": topic,
                "volume": count
            }
            for topic, count in topic_counter.most_common(10)
        ]
    }


def calculate_daily_trends(articles: List[Dict]) -> Dict:
    """Daily article volume + sentiment trends"""
    daily_data = defaultdict(lambda: {"count": 0, "positive": 0, "negative": 0, "neutral": 0, "unknown": 0})

    for article in articles:
        # Parse ISO string to date
        pub_date = article.get("published_at", "")
        if pub_date:
            date_str = pub_date[:10]  # YYYY-MM-DD
        else:
            date_str = "unknown"

        sent = article.get("sentiment", "unknown")
        daily_data[date_str]["count"] += 1
        daily_data[date_str][sent] += 1

    trends = []
    for date, data in sorted(daily_data.items()):
        total = data["count"]
        trends.append({
            "date": date,
            "volume": total,
            "positive_pct": round((data["positive"] / total) * 100, 2) if total > 0 else 0,
            "negative_pct": round((data["negative"] / total) * 100, 2) if total > 0 else 0,
            "neutral_pct": round((data["neutral"] / total) * 100, 2) if total > 0 else 0,
            "unknown_pct": round((data["unknown"] / total) * 100, 2) if total > 0 else 0
        })

    return {"daily_trends": trends[-30:]}  # Last 30 days


def generate_all_stats(articles: List[Dict]) -> Dict:
    """Generate complete stats"""
    return {
        "generated_at": datetime.now().isoformat(),
        "total_articles": len(articles),
        "sentiment_stats": calculate_sentiment_stats(articles),
        "keyword_stats": calculate_keyword_stats(articles),
        "category_stats": calculate_category_stats(articles),
        "source_stats": calculate_source_stats(articles),
        "trending_topics": calculate_trending_topics(articles),
        "daily_trends": calculate_daily_trends(articles),
        "last_updated": datetime.now().isoformat()
    }


def save_stats(stats: Dict):
    """Save to MongoDB collection"""
    # Upsert to avoid duplicates
    stats_coll.replace_one(
        {"generated_at": stats["generated_at"]},
        stats,
        upsert=True
    )
    print(f"Saved stats for {stats['total_articles']} articles to MongoDB")


def export_to_json(stats: Dict, filename: str = "trending_stats.json"):
    """Export for dashboard"""
    with open(filename, 'w') as f:
        json.dump(stats, f, indent=2, default=str)
    print(f"Exported to {filename}")


def export_to_csv(stats: Dict):
    """Export CSV for Excel"""
    # Daily trends
    if stats["daily_trends"]["daily_trends"]:
        df_daily = pd.DataFrame(stats["daily_trends"]["daily_trends"])
        df_daily.to_csv("daily_trends.csv", index=False)

    # Keywords
    if stats["keyword_stats"]["top_keywords"]:
        df_keywords = pd.DataFrame(stats["keyword_stats"]["top_keywords"])
        df_keywords.to_csv("top_keywords.csv", index=False)

    # Categories
    if stats["category_stats"]["top_categories"]:
        df_categories = pd.DataFrame(stats["category_stats"]["top_categories"])
        df_categories.to_csv("top_categories.csv", index=False)

    print("Exported CSV files: daily_trends.csv, top_keywords.csv, top_categories.csv")


def main():
    print("=== Trending Stats Generator — FIXED ===")

    # Get articles (last 30 days)
    print("Fetching articles...")
    articles = get_articles(30)

    if len(articles) == 0:
        print("WARNING: No articles found. Check date format or collection.")
        return

    # Generate stats
    print("Calculating stats...")
    stats = generate_all_stats(articles)

    # Save to MongoDB
    save_stats(stats)

    # Export files
    export_to_json(stats)
    export_to_csv(stats)

    print("\n=== SUMMARY ===")
    print(f"Total Articles: {stats['total_articles']:,}")
    if stats["keyword_stats"]["top_keywords"]:
        print(f"Top Keyword: {stats['keyword_stats']['top_keywords'][0]['keyword']}")
    if stats["source_stats"]["top_sources"]:
        print(f"Top Source: {stats['source_stats']['top_sources'][0]['source']}")
    print(f"Positive Sentiment: {stats['sentiment_stats']['positive']}%")
    print("Done! Check trending_stats.json and MongoDB collection 'trending_stats'.")


if __name__ == "__main__":
    main()