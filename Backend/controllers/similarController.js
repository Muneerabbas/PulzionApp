// controllers/similarController.js
const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  timeout: 10000,
});
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'articles_collection';

// Reusable format function (NO VECTOR)
function formatArticle(hit) {
  const p = hit.payload;
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
    fetched_at: p.fetched_at || null,
    search_topic: p.search_topic || null,
    url_hash: p.url_hash || null,
    category_scores: p.category_scores || {},
    keyword_scores: p.keyword_scores || {},
    sentiment: p.sentiment || null,
    sentiment_confidence: p.sentiment_confidence || null,
    sentiment_scores: p.sentiment_scores || {},
    urlToImage: p.urlToImage || null,
    score: Number(hit.score.toFixed(4)),
    similarity: Number(hit.score.toFixed(4)),
  };
}

const getSimilarArticles = async (req, res) => {
  const { articleId, topK = 5, recencyDays = 60 } = req.body;

  if (!articleId) {
    return res.status(400).json({ success: false, error: 'articleId is required' });
  }

  try {
    // 1. Retrieve base article (with vector)
    const [point] = await client.retrieve(COLLECTION_NAME, {
      ids: [articleId],
      with_vector: true,
      with_payload: true,
    });

    if (!point) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }

    const { vector, payload: cur } = point;

    // 2. Build filter
    const cutoff = new Date(Date.now() - recencyDays * 24 * 60 * 60 * 1000).toISOString();
    const filter = {
      must: [{ key: 'published_at', range: { gte: cutoff } }],
      must_not: [{ key: '_id', match: { value: articleId } }],
    };

    // 3. Search similar
    const hits = await client.search(COLLECTION_NAME, {
      vector,
      limit: topK,
      filter,
      params: { hnsw_ef: 128 },
    });

    // 4. Format results (NO VECTOR)
    const results = hits.map(formatArticle);

    res.json({
      success: true,
      baseArticle: {
        id: articleId,
        title: cur.title,
        description: (cur.description || '').substring(0, 150),
        source: cur.source || 'Unknown',
        published_at: cur.published_at,
        urlToImage: cur.urlToImage || null,
      },
      similar: results,
      count: results.length,
    });
  } catch (err) {
    console.error('Similar search failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getSimilarArticles };