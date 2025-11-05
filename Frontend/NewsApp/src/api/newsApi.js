import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL, NEWS_API_URL } from "./axiosInstance.js";

// Helper to fetch API key dynamically
export const getApiKey = async () => {
  try {
    const apiKey = await AsyncStorage.getItem("APIKEY");
    if (!apiKey) throw new Error("API key not found. Please set it first.");
    return apiKey;
  } catch (error) {
    console.error("Error fetching API key:", error);
    throw error;
  }
};

// ========== News Fetchers ==========

export const getNews = async () => {
  const apiKey = await getApiKey();
  const response = await axios.get(
    `${NEWS_API_URL}/everything?q=trending&sortBy=popularity&language=en&apiKey=${apiKey}`
  );
  return response.data;
};

export const getAllNews = async (n) => {
    console.log("Source in getAllNews:", n);
  const apiKey = await getApiKey();
  const endpoint = n
    ? `${NEWS_API_URL}/top-headlines?sources=${n}&apiKey=${apiKey}`
    : `${NEWS_API_URL}/top-headlines?language=en&apiKey=${apiKey}`;
    console.log("Endpoint in getAllNews:", endpoint);
  const response = await axios.get(endpoint);
  console.log("Response from getAllNews:", response.data);
  return response;
};

export const getTopHeadlines = async () => {
  const apiKey = await getApiKey();
  const response = await axios.get(
    `${NEWS_API_URL}/top-headlines?country=us&apiKey=${apiKey}`
  );
  return response.data;
};

export const getBusinessNews = async () => {
  const apiKey = await getApiKey();
  const response = await axios.get(
    `${NEWS_API_URL}/top-headlines?category=business&apiKey=${apiKey}`
  );
  return response.data;
};

export const getEntertainmentNews = async () => {
  const apiKey = await getApiKey();
  const response = await axios.get(
    `${NEWS_API_URL}/top-headlines?category=entertainment&apiKey=${apiKey}`
  );
  return response.data;
};

export const getSportsNews = async () => {
  const apiKey = await getApiKey();
  const response = await axios.get(
    `${NEWS_API_URL}/top-headlines?category=sports&apiKey=${apiKey}`
  );
  return response.data;
};

export const getHealthNews = async () => {
  const apiKey = await getApiKey();
  const response = await axios.get(
    `${NEWS_API_URL}/top-headlines?category=health&apiKey=${apiKey}`
  );
  return response.data;
};

export const getScienceNews = async () => {
  const apiKey = await getApiKey();
  const response = await axios.get(
    `${NEWS_API_URL}/top-headlines?category=science&apiKey=${apiKey}`
  );
  return response.data;
};

export const getTechnologyNews = async () => {
  const apiKey = await getApiKey();
  const response = await axios.get(
    `${NEWS_API_URL}/top-headlines?category=technology&apiKey=${apiKey}`
  );
  return response.data;
};

export const getBottomNews = async ({ query }) => {
  const apiKey = await getApiKey();
  const response = await axios.get(
    `${NEWS_API_URL}/top-headlines?q=${query}&apiKey=${apiKey}`
  );
  return response.data;
};

// ========== Other APIs ==========

export const getStats = async () => {
  const response = await axios.get(`${BASE_URL}/stats`);
  return response.data;
};

export const factCheckArticle = async (contentData) => {
  const factCheckPayload = buildFactCheckObject(contentData);
  const response = await axios.post(`${BASE_URL}/factcheck`, factCheckPayload);
  return response.data;
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

export const getSimilarArticle = async (item) => {
  const response = await axios.post(`${BASE_URL}/recommend/similar`, {
    articleId: item.id,
  });
  return response.data;
};
