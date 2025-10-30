// services/recommendService.js
const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'articles';

/**
 * Get recommendations using Qdrant's NATIVE point ID
 */
const getRecommendations = async ({
  articleId,        // ← Qdrant point ID (e.g. 0009fdf5-...)
  topK = 5,
  similarK = 3,
  diverseK = 2,
  userHistory = [],
  recencyDays = 60,
  sentiment,
  topic = [],
  userProfile = {},
}) => {
  if (!articleId) throw new Error('articleId is required');

  // === 1. Get current article by NATIVE point ID ===
  const currentPoints = await client.retrieve(COLLECTION_NAME, {
    ids: [articleId],
    with_payload: true,
    with_vector: true,
  });

  if (!currentPoints.length) throw new Error('Article not found');
  const { payload: cur, vector: curVec } = currentPoints[0];

  const now = new Date();
  const cutoff = new Date(now.getTime() - recencyDays * 24 * 60 * 60 * 1000).toISOString();

  // === 2. Base filter (NO 'id' in payload) ===
  const baseFilter = {
    must: [{ key: 'published_at', range: { gte: cutoff } }],
  };

  if (sentiment && sentiment !== 'any') {
    baseFilter.must.push({ key: 'sentiment', match: { value: sentiment } });
  }

  // === 3. SIMILAR (same categories) ===
  const similarFilter = { ...baseFilter };
  if (cur.categories?.length) {
    similarFilter.must.push({ key: 'categories', match: { any: cur.categories } });
  }

  const similarHits = await client.search(COLLECTION_NAME, {
    vector: curVec,
    limit: similarK * 3,
    filter: similarFilter,
    params: { hnsw_ef: 64 },
  });

  // === 4. DIVERSE (different categories) ===
  const diverseFilter = { ...baseFilter };
  if (cur.categories?.length) {
    diverseFilter.must_not = [{ key: 'categories', match: { any: cur.categories } }];
  }

  const diverseHits = await client.search(COLLECTION_NAME, {
    vector: curVec,
    limit: diverseK * 3,
    filter: diverseFilter,
    params: { hnsw_ef: 64 },
  });

  // === 5. RERANK ===
  const candidates = [...similarHits, ...diverseHits]
    .filter(hit => hit.id !== articleId) // exclude self
    .map(hit => {
      const p = hit.payload;
      let score = hit.score;

      // User profile
      if (userProfile.categories?.length && p.categories?.length) {
        const match = p.categories.filter(c => userProfile.categories.includes(c)).length;
        score += match * 0.08;
      }

      // Topic boost
      if (topic.length && p.keywords?.length) {
        const shared = topic.filter(t => p.keywords.includes(t)).length;
        score += shared * 0.12;
      }

      // Anti-clickbait
      const capsWords = (p.title.match(/\b[A-Z]{3,}\b/g) || []).length;
      if (capsWords > 2) score -= 0.15;

      // Freshness
      const daysOld = (now - new Date(p.published_at)) / 86400000;
      score += Math.max(0, 0.1 - daysOld / 180);

      // Diversity
      if (userHistory.includes(p.source)) score -= 0.1;

      return {
        id: hit.id,  // ← NATIVE Qdrant ID
        title: p.title,
        url: p.url,
        description: p.description,
        source: p.source,
        published_at: p.published_at,
        categories: p.categories || [],
        keywords: p.keywords || [],
        teaser: `Swipe to "${p.title}" – ${p.description.substring(0, 90)}...`,
        score: Number(score.toFixed(4)),
        type: similarHits.includes(hit) ? 'similar' : 'discover',
      };
    })
    .sort((a, b) => b.score - a.score)
    .filter((r, i, a) => i === a.findIndex(x => x.source === r.source))
    .slice(0, topK);

  // === 6. SURPRISE ===
  if (Math.random() < 0.2 && candidates.length === topK) {
    const surprise = await getSurpriseArticle(userHistory, topic);
    if (surprise) {
      candidates[topK - 1] = { ...surprise, type: 'surprise' };
    }
  }

  return candidates;
};

const getSurpriseArticle = async (avoidSources, topic = []) => {
  const filter = { must: [] };
  if (topic.length) {
    filter.must.push({ key: 'keywords', match: { any: topic } });
  }
  filter.must_not = avoidSources.map(s => ({ key: 'source', match: { value: s } }));

  const res = await client.scroll(COLLECTION_NAME, {
    limit: 100,
    filter,
    with_payload: true,
  });

  const items = res.points.filter(p => p.payload);
  if (!items.length) return null;

  const random = items[Math.floor(Math.random() * items.length)];
  return {
    id: random.id,
    title: random.payload.title,
    url: random.payload.url,
    description: random.payload.description,
    source: random.payload.source,
    published_at: random.payload.published_at,
    teaser: `Try: "${random.payload.title}"`,
    score: 0.7,
  };
};

module.exports = { getRecommendations };