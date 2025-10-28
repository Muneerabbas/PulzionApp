"""
Interactive article search and recommendation tool.
Search articles by keywords, find similar articles, filter by category.
"""

import logging
import numpy as np
from typing import List, Optional

from storage import ArticleStorage
from embeddings import EmbeddingGenerator

logging.basicConfig(level=logging.WARNING)


def search_by_keyword(storage: ArticleStorage, keyword: str, limit: int = 10):
    """Search articles by keyword using MongoDB text search."""
    print(f"\n🔍 Searching for: '{keyword}'")
    print("="*80)
    
    # Use MongoDB text search
    articles = storage.collection.find(
        {'$text': {'$search': keyword}},
        {'score': {'$meta': 'textScore'}}
    ).sort([('score', {'$meta': 'textScore'})]).limit(limit)
    
    articles = list(articles)
    
    if not articles:
        print("No articles found.")
        return
    
    print(f"Found {len(articles)} articles:\n")
    
    for i, article in enumerate(articles, 1):
        print(f"{i}. {article.get('title', 'No title')}")
        print(f"   Source: {article.get('source', 'Unknown')}")
        print(f"   Categories: {', '.join(article.get('categories', []))}")
        print(f"   URL: {article.get('url', '')}")
        print()


def search_by_category(storage: ArticleStorage, category: str, limit: int = 10):
    """Search articles by category."""
    print(f"\n🏷️  Articles in category: '{category}'")
    print("="*80)
    
    articles = storage.get_articles(
        filter_dict={'categories': category},
        limit=limit,
        sort_by='published_at'
    )
    
    if not articles:
        print(f"No articles found in category '{category}'.")
        return
    
    print(f"Found {len(articles)} articles:\n")
    
    for i, article in enumerate(articles, 1):
        print(f"{i}. {article.get('title', 'No title')}")
        print(f"   Source: {article.get('source', 'Unknown')}")
        cats = article.get('categories', [])
        print(f"   Categories: {', '.join(cats)}")
        print(f"   Published: {article.get('published_at', 'Unknown')}")
        print()


def find_similar_articles(
    storage: ArticleStorage,
    generator: EmbeddingGenerator,
    query: str,
    top_k: int = 5
):
    """Find articles similar to a search query using embeddings."""
    print(f"\n🎯 Finding articles similar to: '{query}'")
    print("="*80)
    
    # Generate query embedding
    query_embedding = generator.embed_query(query)
    
    if query_embedding is None:
        print("Error generating query embedding.")
        return
    
    # Get all articles with embeddings
    articles = storage.get_articles(
        filter_dict={'embedding': {'$exists': True, '$ne': None}},
        limit=1000
    )
    
    if not articles:
        print("No articles with embeddings found.")
        return
    
    # Compute similarities
    similarities = []
    for article in articles:
        embedding = article.get('embedding')
        if embedding:
            embedding_array = np.array(embedding)
            similarity = generator.compute_similarity(query_embedding, embedding_array)
            similarities.append((article, similarity))
    
    # Sort by similarity
    similarities.sort(key=lambda x: x[1], reverse=True)
    
    print(f"Top {top_k} most similar articles:\n")
    
    for i, (article, score) in enumerate(similarities[:top_k], 1):
        print(f"{i}. {article.get('title', 'No title')}")
        print(f"   Similarity: {score:.4f}")
        print(f"   Categories: {', '.join(article.get('categories', []))}")
        print(f"   Source: {article.get('source', 'Unknown')}")
        print()


def show_statistics(storage: ArticleStorage):
    """Show database statistics."""
    print("\n📊 DATABASE STATISTICS")
    print("="*80)
    
    stats = storage.get_statistics()
    
    print(f"Total articles: {stats.get('total_articles', 0):,}\n")
    
    # Categories
    top_categories = stats.get('top_categories', [])
    if top_categories:
        print("Top Categories:")
        for cat in top_categories:
            print(f"   {cat['_id']:<20} {cat['count']:>5} articles")
    
    print()
    
    # Topics
    top_topics = stats.get('top_topics', [])
    if top_topics:
        print("Top Topics:")
        for topic in top_topics[:10]:
            print(f"   {topic['_id']:<30} {topic['count']:>5} articles")
    
    print()


def interactive_menu():
    """Interactive menu for article search."""
    print("="*80)
    print("📰 INTELLIGENT ARTICLE SEARCH TOOL")
    print("="*80)
    
    storage = ArticleStorage()
    generator = None
    
    while True:
        print("\nOptions:")
        print("  1. Search by keyword")
        print("  2. Filter by category")
        print("  3. Find similar articles (semantic search)")
        print("  4. Show statistics")
        print("  5. Exit")
        
        choice = input("\nEnter choice (1-5): ").strip()
        
        if choice == '1':
            keyword = input("Enter keyword: ").strip()
            if keyword:
                search_by_keyword(storage, keyword)
        
        elif choice == '2':
            print("\nAvailable categories:")
            import config
            for cat in config.CATEGORIES:
                print(f"   - {cat}")
            category = input("\nEnter category: ").strip()
            if category:
                search_by_category(storage, category)
        
        elif choice == '3':
            query = input("Enter search query: ").strip()
            if query:
                if generator is None:
                    print("Loading embedding model...")
                    generator = EmbeddingGenerator()
                find_similar_articles(storage, generator, query)
        
        elif choice == '4':
            show_statistics(storage)
        
        elif choice == '5':
            print("\nGoodbye! 👋")
            storage.close()
            break
        
        else:
            print("Invalid choice. Please try again.")


def main():
    """Main entry point."""
    import sys
    
    storage = ArticleStorage()
    
    # Check if there are any articles
    total = storage.count_articles()
    if total == 0:
        print("="*80)
        print("⚠️  No articles in database!")
        print("="*80)
        print("\nPlease run the pipeline first to fetch articles:")
        print("   python main.py")
        print("\nOr run a quick test:")
        print("   python quick_test.py")
        print()
        storage.close()
        return
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'stats':
            show_statistics(storage)
        
        elif command == 'search' and len(sys.argv) > 2:
            keyword = ' '.join(sys.argv[2:])
            search_by_keyword(storage, keyword)
        
        elif command == 'category' and len(sys.argv) > 2:
            category = sys.argv[2]
            search_by_category(storage, category)
        
        elif command == 'similar' and len(sys.argv) > 2:
            query = ' '.join(sys.argv[2:])
            generator = EmbeddingGenerator()
            find_similar_articles(storage, generator, query)
        
        else:
            print("Usage:")
            print("  python search_articles.py                     # Interactive mode")
            print("  python search_articles.py stats               # Show statistics")
            print("  python search_articles.py search <keyword>    # Search by keyword")
            print("  python search_articles.py category <name>     # Filter by category")
            print("  python search_articles.py similar <query>     # Semantic search")
        
        storage.close()
    else:
        # Interactive mode
        interactive_menu()


if __name__ == "__main__":
    main()
