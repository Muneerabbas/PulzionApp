// services/closestService.js
const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  timeout: 10000,
});
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'articles_collection';

let embedder = null;
let modelReady = false;

async function initEmbedder() {
  if (modelReady) return;
  console.log('Loading all-MiniLM-L6-v2 in Node.js... (~22 MB)');

  try {
    const { pipeline } = require('@xenova/transformers');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
      revision: 'main',
    });
    modelReady = true;
    console.log('Model loaded & ready!');
  } catch (err) {
    console.error('Failed to load model:', err.message);
    throw err;
  }
}

// Auto-init when module loads
initEmbedder().catch(() => {});

class ClosestService {
  static async getClosestArticles({ query, topK = 5, recencyDays = 60 }) {
    if (!query || typeof query !== 'string') {
      throw new Error('query (string) is required');
    }

    if (!modelReady) {
      throw new Error('Embedding model not ready. Please wait...');
    }

    // === 3. EMBED LOCALLY IN NODE.JS ===
    const output = await embedder(query.trim(), {
      pooling: 'mean',
      normalize: true,
    });
    const vector = Array.from(output.data); // ← 384-dim

    if (!vector || vector.length !== 384) {
      throw new Error('Invalid embedding: must be 384-dim');
    }

    // === 4. QDRANT SEARCH ===
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

    // === 5. FORMAT RESULTS ===
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