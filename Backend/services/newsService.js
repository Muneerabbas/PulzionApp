import axios from "axios";

export async function getTopHeadlines() {
  try {
    const res = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=5&apiKey=b97d37f3f4e548fe91a24beaaac7571a`
    );
    return res.data.articles || [];
  } catch (err) {
    console.error("Error: ", err.message);
    return [];
  }
}
