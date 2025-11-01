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

// --- MAIN RECOMMENDATION FUNCTION ---

const getRecommendations = async ({
  articleId = null,         // The most recent like ID
  likedArticleIds = [],     // All session like IDs
  dislikedArticleIds = [],  // NEW: All session dislike IDs
  topK = 10,                // Default to 10
  recencyDays = 60,
  sentiment = 'any',
  topic = [],
  userHistory = [],         // NEW: All session SEEN IDs
  seenSources = [],         // NEW: All session SEEN sources
}) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - recencyDays * 24 * 60 * 60 * 1000).toISOString();

  // === 1. DEDUPLICATION FIX ===
  // We now trust userHistory to be the complete list of seen IDs
  const allIdsToExclude = [...new Set(userHistory)];

  const baseFilter = {
    must: [{ key: 'published_at', range: { gte: cutoff } }],
    must_not: [ { has_id: allIdsToExclude } ],
  };

  if (sentiment && sentiment !== 'any') {
    baseFilter.must.push({ key: 'sentiment', match: { value: sentiment } });
  }

  let searchVector = null;
  let cur = null; // Context of the *seed* article
  let teaser = '';
  let sessionKeywordMap = {}; // For advanced reranking

  // === 2. ADVANCED SEEDING (Weighted Averaging) ===
  let seedVectorSource = null;
  if (articleId) {
    // We must be able to retrieve this vector, even if it's in history
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

  // Retrieve vectors in parallel
  const [seedResult, otherLikesResult] = await Promise.all([seedVectorSource, otherLikesSource]);

  if (seedResult && seedResult.length > 0) {
      // --- Primary seed exists (user has liked >= 1 item) ---
      const seedPoint = seedResult[0];
      cur = seedPoint.payload; // Set current article context
      teaser = `Because you read "${cur.title}"`;

      const vectors = [seedPoint.vector];
      const weights = [0.4]; // 40% weight for the most recent like
      
      // Build keyword map from this seed article
      seedPoint.payload?.keywords?.forEach(k => {
        sessionKeywordMap[k] = (sessionKeywordMap[k] || 0) + 1;
      });

      if (otherLikesResult && otherLikesResult.length > 0) {
          const otherVectors = otherLikesResult.map(p => {
            // Add other liked articles' keywords to the map
            p.payload.keywords?.forEach(k => {
              sessionKeywordMap[k] = (sessionKeywordMap[k] || 0) + 1;
            });
            return p.vector;
          });

          vectors.push(...otherVectors);
          // Remaining 60% weight, distributed among other likes
          const otherWeight = (0.6 / otherVectors.length); 
          otherVectors.forEach(() => weights.push(otherWeight));
      }
      searchVector = weightedAverageVectors(vectors, weights);
  
  } else if (otherLikesResult && otherLikesResult.length > 0) {
      // --- Fallback: No primary seed, but other likes exist ---
      const vectors = otherLikesResult.map(p => {
          p.payload.keywords?.forEach(k => {
            sessionKeywordMap[k] = (sessionKeywordMap[k] || 0) + 1;
          });
          return p.vector;
      });
      searchVector = averageVectors(vectors); // Simple average
      teaser = `Based on your recent likes`;
  
  } else {
      // === 3. INTELLIGENT COLD START (No likes this session) ===
      try {
        const stats = await getStatsData();
        const topKeywords = stats?.top_keywords?.slice(0, 3).map(k => k.keyword) || [];
        if (topKeywords.length > 0) {
          baseFilter.must.push({ key: 'keywords', match: { any: topKeywords } });
          teaser = "Trending for you";
        }
      } catch (e) { console.warn("Could not load stats for cold start:", e.message); }
      
      // Go to random, but with the trending keywords filter if possible
      return await getRandomArticles(topK, baseFilter, teaser);
  }

  // === 4. NEGATIVE FEEDBACK (DISLIKES) ===
  let negativeVectors = [];
  if (dislikedArticleIds.length > 0) {
    const points = await client.retrieve(COLLECTION_NAME, {
      ids: dislikedArticleIds,
      with_vector: true,
    });
    // We only need the vectors to push results *away* from these
    negativeVectors = points.map(p => p.vector).filter(Boolean);
  }

  // === 5. Similar & Diverse Search (Tuned for less diversity) ===
  const similarFilter = JSON.parse(JSON.stringify(baseFilter));
  if (cur?.categories?.length) {
    similarFilter.must.push({ key: 'categories', match: { any: cur.categories } });
  }

  const diverseFilter = JSON.parse(JSON.stringify(baseFilter));
  if (cur?.categories?.length) {
    diverseFilter.must_not.push({ key: 'categories', match: { any: cur.categories } });
  }

  // Skewed search ratio for less diversity
  const similarHits = await safeSearch(searchVector, similarFilter, topK * 4, negativeVectors);
  const diverseHits = await safeSearch(searchVector, diverseFilter, topK * 1, negativeVectors);

  // === 6. ADVANCED RERANKING ===
  const seenIds = new Set(allIdsToExclude); // Already contains history

  const candidates = [...similarHits, ...diverseHits]
    .map(hit => {
      if (seenIds.has(hit.id)) return null; 
      seenIds.add(hit.id); 

      const p = hit.payload;
      let score = hit.score;

      // NEW: Topic Coherence Boost
      let topicBoost = 0;
      p.keywords?.forEach(k => {
          if (sessionKeywordMap[k]) {
              // Boost based on how many times user liked this keyword
              topicBoost += sessionKeywordMap[k] * 0.02; 
          }
      });
      score += Math.min(topicBoost, 0.1); // Cap boost at 0.1

      // Topic boost (from request body, if user specified a topic)
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

      // NEW: Source diversity penalty (soft check)
      if (seenSources.includes(p.source)) {
          score -= 0.1; // Penalize, but don't filter
      }

      return formatArticle(hit, score, teaser, similarHits.includes(hit) ? 'similar' : 'discover');
    })
    .filter(Boolean) // Remove nulls (duplicates)
    .sort((a, b) => b.score - a.score)
    // Kept commented out for "less diversity"
    // .filter((r, i, a) => i === a.findIndex(x => x.source === r.source))
    .slice(0, topK);

  // Reduced "Surprise" Chance
  if (Math.random() < 0.05 && candidates.length === topK && candidates.length > 0) {
    const surprise = await getSurpriseArticle(baseFilter, topic);
    if (surprise) candidates[topK - 1] = { ...surprise, type: 'surprise' };
  }
  
  // Final fallback
  if (candidates.length > 0) {
    return candidates;
  } else {
    // If all else fails, get random articles that are *not* in history
    return await getRandomArticles(topK, baseFilter, "No more results, here's something random!");
  }
};

module.exports = { getRecommendations };