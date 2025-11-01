import { BASE_URL, NEWS_API_URL } from "./axiosInstance.js";
import axios from "axios";

 const API_KEY = '4d6bebc94a5046d7bd2d64ac5331d5da';

export const getNews = async () => {
    try {
        const response = await axios.get(`${NEWS_API_URL}/everything?q=trending&sortBy=popularity&language=en&apiKey=${API_KEY}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch news' };
    }
};

export const getAllNews = async (n) => {
    try {
        if (!n) {
            const response = await axios.get(`${NEWS_API_URL}/top-headlines?language=en&apiKey=${API_KEY}`);
            return response;
        }
        const response = await axios.get(`${NEWS_API_URL}/top-headlines?sources=${n}&apiKey=${API_KEY}`);
        return response;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch news' };
    }
};

export const getTopHeadlines = async () => {
    try {
        const response = await axios.get(`${NEWS_API_URL}/top-headlines?country=us&apiKey=${API_KEY}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch top headlines' };
    }
};

export const getBusinessNews = async () => {
    try {
        const response = await axios.get(`${NEWS_API_URL}/top-headlines?category=business&apiKey=${API_KEY}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch business news' };
    }
};

export const getEntertainmentNews = async () => {
    try {
        const response = await axios.get(`${NEWS_API_URL}/top-headlines?category=entertainment&apiKey=${API_KEY}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch entertainment news' };
    }
};
export const getSportsNews = async () => {
    try {
        const response = await axios.get(`${NEWS_API_URL}/top-headlines?category=sports&apiKey=${API_KEY}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch sports news' };
    }
};
export const getHealthNews = async () => {
    try {
        const response = await axios.get(`${NEWS_API_URL}/top-headlines?category=health&apiKey=${API_KEY}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch health news' };
    }
};
export const getScienceNews = async () => {
    try {
        const response = await axios.get(`${NEWS_API_URL}/top-headlines?category=science&apiKey=${API_KEY}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch science news' };
    }
};
export const getTechnologyNews = async () => {
    try {
        const response = await axios.get(`${NEWS_API_URL}/top-headlines?category=technology&apiKey=${API_KEY}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch technology news' };
    }
};

//Bottom Data Fetching 
export const getBottomNews = async ({ query }) => {
    try {
        const response = await axios.get(`${NEWS_API_URL}/top-headlines?q=${query}&apiKey=${API_KEY}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch' };
    }
};

//fetch Stats
export const getStats = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/stats`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch stats' };
    }
};
export const factCheckArticle = async (contentData) => {
  try {
    const factCheckPayload = buildFactCheckObject(contentData);
    console.log("factCheckPayload",factCheckPayload)
    const response = await axios.post(`${BASE_URL}/factcheck`, factCheckPayload);
    return response.data;
  } catch (error) {
    console.error('❌ Fact check failed:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch fact-check data');
  }
};
const buildFactCheckObject = (contentData, rating = "Unverified") => {
  if (!contentData) throw new Error("contentData is required");

  return {
    claims: [
      {
        text: contentData?.description || contentData?.title || "No description available",
        claimant: contentData?.author || "Unknown",
        claimReview: [
          {
            publisher: { name: contentData?.source?.name || "Unknown Source" },
            textualRating: rating,
            url: contentData?.url || null,
          },
        ],
      },
    ],
  };
};
export const getSimilarArticle = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/recommend/similar`,{
            articleId: item.id,
        });
        return response.data;

    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch similar article' };
    }
};



