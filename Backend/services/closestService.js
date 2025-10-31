// services/closestService.js
const axios = require('axios');
const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  timeout: 10000,
});
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'articles_collection';
const EMBEDDING_URL = process.env.EMBEDDING_URL || 'http://127.0.0.1:8000/embed';

class ClosestService {
  static async getClosestArticles({ query, topK = 5, recencyDays = 60 }) {
    if (!query || typeof query !== 'string') {
      throw new Error('query (string) is required');
    }

    const embedRes = await axios.post(EMBEDDING_URL, { text: query });
    const vector = embedRes.data.vector;

    if (!vector || vector.length !== 384) {
      throw new Error('Invalid embedding: must be 384-dim');
    }

    const cutoff = new Date(Date.now() - recencyDays * 24 * 60 * 60 * 1000).toISOString();
    const filter = {
      must: [{ key: 'published_at', range: { gte: cutoff } }],
    };
    const hits = await client.search(COLLECTION_NAME, {
      vector,
      limit: topK,
      filter,
      params: { hnsw_ef: 128 },
    });

    return hits.map(hit => {
      const p = hit.payload || {};
      return {
        id: hit.id,
        title: p.title || 'Untitled',
        url: p.url || '#',
        description: (p.description || '').substring(0, 150),
        source: p.source || 'Unknown',
        published_at: p.published_at,
        categories: p.categories || [],
        keywords: p.keywords || [],
        author: p.author || null,
        content: p.content || null,
        search_topic: p.search_topic || null,
        url_hash: p.url_hash || null,
        sentiment: p.sentiment || null,
        sentiment_confidence: p.sentiment_confidence || null,
        urlToImage: p.urlToImage || null,
        score: Number(hit.score.toFixed(4)),
        relevance: Number(hit.score.toFixed(4)),
      };
    });
  }
}

module.exports = ClosestService;