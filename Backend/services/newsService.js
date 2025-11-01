const axios = require("axios");
 async function getTopHeadlines() {
  try {
    const res = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=20&apiKey=4d6bebc94a5046d7bd2d64ac5331d5da`
    );
    return res.data.articles || [];
  } catch (err) {
    console.error("Error fetching news:", err.message);
    return [];
  }
}
module.exports = { getTopHeadlines };

