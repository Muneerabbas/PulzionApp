import axios from "axios";

export async function getTopHeadlines() {
  try {
    const res = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        country: "us",
        pageSize: 5,
        apiKey: process.env.NEWS_API_KEY,
      },
    });

    return res.data.articles || [];
  } catch (err) {
    console.error("Error fetching headlines:", err.message);
    return [];
  }
}

export async function searchNews(query) {
  try {
    const res = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: query,
        language: "en",
        sortBy: "publishedAt",
        apiKey: process.env.NEWS_API_KEY,
      },
    });

    return res.data.articles || [];
  } catch (err) {
    console.error("Error searching news:", err.message);
    return [];
  }
}
