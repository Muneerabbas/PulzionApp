// services/recommendService.js (Complete Updated File)

const { QdrantClient } = require('@qdrant/js-client-rest');
const { getStatsData } = require('./statsService'); // For intelligent cold start
require('dotenv').config();

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  timeout: 10000,
});
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'articles_collection';

// --- HELPER FUNCTIONS ---

/**
 * Calculates a simple average of multiple vectors.
 */
function averageVectors(vectors) {
  if (!vectors || vectors.length === 0) return [];
  const dim = vectors[0].length;
  const sum = new Array(dim).fill(0);
  vectors.forEach(v => v.forEach((val, i) => sum[i] += val));
  return sum.map(s => s / vectors.length);
}

/**
 * Calculates a weighted average of vectors.
 * More recent likes get higher weights.
 */
function weightedAverageVectors(vectors, weights) {
  if (!vectors || vectors.length === 0) return [];
  const dim = vectors[0].length;
  const sum = new Array(dim).fill(0);
  let totalWeight = 0;

  vectors.forEach((v, i) => {
    const weight = weights[i];
    v.forEach((val, j) => sum[j] += val * weight);
    totalWeight += weight;
  });

  if (totalWeight === 0) return new Array(dim).fill(0);
  return sum.map(s => s / totalWeight);
}

/**
 * Wrapper for Qdrant search to include negative feedback.
 */
async function safeSearch(vector, filter, limit, negative = []) {
  try {
    const res = await client.search(COLLECTION_NAME, {
      vector,
      limit,
      filter,
      negative, // Pass negative vectors here
      with_payload: true,
      params: { hnsw_ef: 128 },
    });
    return res;
  } catch (err) {
    console.warn('Search failed:', err.message);
    return [];
  }
}

/**
 * Formats a Qdrant point into a clean article object.
 */
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
    urlToImage: p.urlToImage || null,
    sentiment: p.sentiment || null,
    teaser: teaser || `Swipe to "${p.title}" – ${(p.description || '').substring(0, 90)}...`,
    score: Number(score.toFixed(4)),
    type,
  };
}

/**
 * Gets random articles, boosted by trending keywords if available.
 */
async function getRandomArticles(topK, filter, teaser = 'Fresh pick for you') {
  const randomVector = Array.from({ length: 384 }, () => Math.random() * 2 - 1); 
  try {
    const res = await client.search(COLLECTION_NAME, {
      vector: randomVector,
      limit: topK,
      filter,
      with_payload: true,
    });
    return (res || []).map(p => formatArticle(
      { id: p.id, payload: p.payload }, 0.7, teaser, 'random'
    ));
  } catch (err) {
    console.warn('Random search failed:', err.message);
    return [];
  }
}

/**
 * Gets a single "surprise" article.
 */
async function getSurpriseArticle(baseFilter, topic = []) {
  const filter = JSON.parse(JSON.stringify(baseFilter)); 
  if (topic.length) {
    filter.must_not.push({ key: 'keywords', match: { any: topic } });
  }

  try {
    const randomVector = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
    const res = await client.search(COLLECTION_NAME, { 
      vector: randomVector, limit: 1, filter, with_payload: true 
    });
    if (!res || res.length === 0) return null;
    const random = res[0];
    return formatArticle(
      { id: random.id, payload: random.payload }, 0.7,
      `Try: "${random.payload.title}"`, 'surprise'
    );
  } catch (err) {
    console.warn('Surprise failed:', err.message);
    return null;
  }
}

const getRecommendations = async ({
  articleId = null,
  likedArticleIds = [],
  dislikedArticleIds = [],
  topK = 10,
  recencyDays = 60,
  sentiment = 'any',
  topic = [],
  userHistory = [],
  seenSources = [],
}) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - recencyDays * 24 * 60 * 60 * 1000).toISOString();
    const allIdsToExclude = [...new Set(userHistory)];

  const baseFilter = {
    must: [{ key: 'published_at', range: { gte: cutoff } }],
    must_not: [ { has_id: allIdsToExclude } ],
  };

  if (sentiment && sentiment !== 'any') {
    baseFilter.must.push({ key: 'sentiment', match: { value: sentiment } });
  }

  let searchVector = null;
  let cur = null;
  let teaser = '';
  let sessionKeywordMap = {};

  let seedVectorSource = null;
  if (articleId) {
    seedVectorSource = client.retrieve(COLLECTION_NAME, {
        ids: [articleId], 
        with_vector: true, 
        with_payload: true
    });
  }

  let otherLikesSource = null;
  const otherLikedIds = likedArticleIds.filter(id => id !== articleId);
  if (otherLikedIds.length > 0) {
     otherLikesSource = client.retrieve(COLLECTION_NAME, {
        ids: otherLikedIds,
        with_vector: true,
        with_payload: true
     });
  }

  const [seedResult, otherLikesResult] = await Promise.all([seedVectorSource, otherLikesSource]);

  if (seedResult && seedResult.length > 0) {
      const seedPoint = seedResult[0];
      cur = seedPoint.payload;
      teaser = `Because you read "${cur.title}"`;

      const vectors = [seedPoint.vector];
      const weights = [0.4];
      
      seedPoint.payload?.keywords?.forEach(k => {
        sessionKeywordMap[k] = (sessionKeywordMap[k] || 0) + 1;
      });

      if (otherLikesResult && otherLikesResult.length > 0) {
          const otherVectors = otherLikesResult.map(p => {
            p.payload.keywords?.forEach(k => {
              sessionKeywordMap[k] = (sessionKeywordMap[k] || 0) + 1;
            });
            return p.vector;
          });

          vectors.push(...otherVectors);
          const otherWeight = (0.6 / otherVectors.length); 
          otherVectors.forEach(() => weights.push(otherWeight));
      }
      searchVector = weightedAverageVectors(vectors, weights);
  
  } else if (otherLikesResult && otherLikesResult.length > 0) {
      const vectors = otherLikesResult.map(p => {
          p.payload.keywords?.forEach(k => {
            sessionKeywordMap[k] = (sessionKeywordMap[k] || 0) + 1;
          });
          return p.vector;
      });
      searchVector = averageVectors(vectors); 
      teaser = `Based on your recent likes`;
  
  } else {
      try {
        const stats = await getStatsData();
        const topKeywords = stats?.top_keywords?.slice(0, 3).map(k => k.keyword) || [];
        if (topKeywords.length > 0) {
          baseFilter.must.push({ key: 'keywords', match: { any: topKeywords } });
          teaser = "Trending for you";
        }
      } catch (e) { console.warn("Could not load stats for cold start:", e.message); }
      
      return await getRandomArticles(topK, baseFilter, teaser);
  }

  let negativeVectors = [];
  if (dislikedArticleIds.length > 0) {
    const points = await client.retrieve(COLLECTION_NAME, {
      ids: dislikedArticleIds,
      with_vector: true,
    });
    negativeVectors = points.map(p => p.vector).filter(Boolean);
  }

  const similarFilter = JSON.parse(JSON.stringify(baseFilter));
  if (cur?.categories?.length) {
    similarFilter.must.push({ key: 'categories', match: { any: cur.categories } });
  }

  const diverseFilter = JSON.parse(JSON.stringify(baseFilter));
  if (cur?.categories?.length) {
    diverseFilter.must_not.push({ key: 'categories', match: { any: cur.categories } });
  }

  const similarHits = await safeSearch(searchVector, similarFilter, topK * 4, negativeVectors);
  const diverseHits = await safeSearch(searchVector, diverseFilter, topK * 1, negativeVectors);

  const seenIds = new Set(allIdsToExclude); 

  const candidates = [...similarHits, ...diverseHits]
    .map(hit => {
      if (seenIds.has(hit.id)) return null; 
      seenIds.add(hit.id); 

      const p = hit.payload;
      let score = hit.score;

      let topicBoost = 0;
      p.keywords?.forEach(k => {
          if (sessionKeywordMap[k]) {
              topicBoost += sessionKeywordMap[k] * 0.02; 
          }
      });
      score += Math.min(topicBoost, 0.1); 

      if (topic.length && p.keywords?.length) {
        const shared = topic.filter(t => p.keywords.includes(t)).length;
        score += shared * 0.12;
      }

      const capsWords = (p.title?.match(/\b[A-Z]{3,}\b/g) || []).length;
      if (capsWords > 2) score -= 0.15;

      const pubDate = new Date(p.published_at || p.published_at_ts);
      if (!isNaN(pubDate)) {
        const daysOld = (now - pubDate) / 86400000;
        score += Math.max(0, 0.1 - daysOld / 180);
      }

      if (seenSources.includes(p.source)) {
          score -= 0.1; 
      }

      return formatArticle(hit, score, teaser, similarHits.includes(hit) ? 'similar' : 'discover');
    })
    .filter(Boolean) 
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (Math.random() < 0.05 && candidates.length === topK && candidates.length > 0) {
    const surprise = await getSurpriseArticle(baseFilter, topic);
    if (surprise) candidates[topK - 1] = { ...surprise, type: 'surprise' };
  }
  
  if (candidates.length > 0) {
    return candidates;
  } else {
    return await getRandomArticles(topK, baseFilter, "No more results, here's something random!");
  }
};

module.exports = { getRecommendations };