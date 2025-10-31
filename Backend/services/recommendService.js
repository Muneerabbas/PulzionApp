// services/recommendService.js
const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  timeout: 10000,
});
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'articles_collection';

const getRecommendations = async ({
  articleId = null,
  likedArticleIds = [],
  topK = 1,
  recencyDays = 60,
  sentiment = 'any',
  topic = [],
  userHistory = [],
  userProfile = {},
}) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - recencyDays * 24 * 60 * 60 * 1000).toISOString();

  const baseFilter = {
    must: [{ key: 'published_at', range: { gte: cutoff } }],
    must_not: [...likedArticleIds, ...userHistory].map(id => ({
      key: '_id',
      match: { value: id },
    })),
  };

  if (sentiment && sentiment !== 'any') {
    baseFilter.must.push({ key: 'sentiment', match: { value: sentiment } });
  }

  let searchVector = null;
  let cur = null;
  let teaser = '';

  // === CASE 1: articleId given ===
  if (articleId) {
    const points = await client.retrieve(COLLECTION_NAME, {
      ids: [articleId],
      with_vector: true,
      with_payload: true,
    });
    if (!points.length) throw new Error(`Article not found: ${articleId}`);
    searchVector = points[0].vector;
    cur = points[0].payload;
    teaser = `Because you read "${cur.title}"`;
  }

  // === CASE 2: likedArticleIds given ===
  else if (likedArticleIds.length > 0) {
    const points = await client.retrieve(COLLECTION_NAME, {
      ids: likedArticleIds,
      with_vector: true,
      with_payload: true,
    });
    if (!points.length) throw new Error("No liked articles found");
    const vectors = points.map(p => p.vector);
    searchVector = averageVectors(vectors);
    const titles = points.map(p => p.payload.title).slice(0, 2).join('", "');
    teaser = `Based on "${titles}"${points.length > 2 ? '...' : ''}`;
  }

  // === CASE 3: Nothing → Random ===
  else {
    return await getRandomArticles(topK, baseFilter);
  }

  // === Similar & Diverse Search ===
  const similarFilter = { ...baseFilter };
  if (cur?.categories?.length) {
    similarFilter.must.push({ key: 'categories', match: { any: cur.categories } });
  }

  const diverseFilter = { ...baseFilter };
  if (cur?.categories?.length) {
    diverseFilter.must_not = [{ key: 'categories', match: { any: cur.categories } }];
  }

  const similarHits = await safeSearch(searchVector, similarFilter, topK * 3);
  const diverseHits = await safeSearch(searchVector, diverseFilter, topK * 2);

  // === Rerank ===
  const candidates = [...similarHits, ...diverseHits]
    .filter(h => h.id !== articleId && !likedArticleIds.includes(h.id))
    .map(hit => {
      const p = hit.payload;
      let score = hit.score;

      // User profile boost
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
      const capsWords = (p.title?.match(/\b[A-Z]{3,}\b/g) || []).length;
      if (capsWords > 2) score -= 0.15;

      // Freshness
      const pubDate = new Date(p.published_at || p.published_at_ts);
      if (!isNaN(pubDate)) {
        const daysOld = (now - pubDate) / 86400000;
        score += Math.max(0, 0.1 - daysOld / 180);
      }

      // Source diversity
      if (userHistory.includes(p.source)) score -= 0.1;

      return formatArticle(hit, score, teaser, similarHits.includes(hit) ? 'similar' : 'discover');
    })
    .sort((a, b) => b.score - a.score)
    .filter((r, i, a) => i === a.findIndex(x => x.source === r.source))
    .slice(0, topK);

  // === Surprise (20% chance) ===
  if (Math.random() < 0.2 && candidates.length === topK) {
    const surprise = await getSurpriseArticle(userHistory, topic);
    if (surprise) candidates[topK - 1] = { ...surprise, type: 'surprise' };
  }

  return candidates.length > 0 ? candidates : await getRandomArticles(topK, baseFilter);
};

// === Format Helper (NO VECTOR) ===
function formatArticle(hit, score, teaser, type) {
  const p = hit.payload;
  return {
    id: hit.id,
    title: p.title || 'Untitled',
    url: p.url || '#',
    description: (p.description || '').substring(0, 150),
    source: p.source || 'Unknown',
    published_at: p.published_at || p.published_at_ts,
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
    teaser: teaser || `Swipe to "${p.title}" – ${(p.description || '').substring(0, 90)}...`,
    score: Number(score.toFixed(4)),
    type,
  };
}

// === Helpers ===
function averageVectors(vectors) {
  const dim = vectors[0].length;
  const sum = new Array(dim).fill(0);
  vectors.forEach(v => v.forEach((val, i) => sum[i] += val));
  return sum.map(s => s / vectors.length);
}

async function safeSearch(vector, filter, limit) {
  try {
    const res = await client.search(COLLECTION_NAME, {
      vector,
      limit,
      filter,
      params: { hnsw_ef: 128 },
    });
    return res;
  } catch (err) {
    console.warn('Search failed:', err.message);
    return [];
  }
}

async function getRandomArticles(topK, filter) {
  const res = await client.scroll(COLLECTION_NAME, {
    limit: topK,
    filter,
    with_payload: true,
  });
  return (res.points || []).map(p => formatArticle(
    { id: p.id, payload: p.payload },
    0.7,
    'Fresh pick for you',
    'random'
  ));
}

async function getSurpriseArticle(avoidSources, topic = []) {
  const filter = { must: [] };
  if (topic.length) filter.must.push({ key: 'keywords', match: { any: topic } });
  if (avoidSources.length) {
    filter.must_not = avoidSources.map(s => ({ key: 'source', match: { value: s } }));
  }

  try {
    const res = await client.scroll(COLLECTION_NAME, { limit: 100, filter, with_payload: true });
    const items = res.points?.filter(p => p.payload) || [];
    if (!items.length) return null;
    const random = items[Math.floor(Math.random() * items.length)];
    return formatArticle(
      { id: random.id, payload: random.payload },
      0.7,
      `Try: "${random.payload.title}"`,
      'surprise'
    );
  } catch (err) {
    console.warn('Surprise failed:', err.message);
    return null;
  }
}

module.exports = { getRecommendations };