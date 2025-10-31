import { NEWS_API_URL } from "./axiosInstance.js";
import axios from "axios";

const API_KEY = '8bbe5a89d3304a0ba4227415c148b9c3';

export const getNews = async () => {
        try {
            const response = await axios.get(`${NEWS_API_URL}/everything?q=trending&sortBy=popularity&language=en&apiKey=${API_KEY}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to fetch news' };
        }
};

export const getAllNews = async () => {
        try {
            const response = await axios.get(`${NEWS_API_URL}/everything?q=trending&apiKey=${API_KEY}`);
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
export const getBottomNews = async ({query}) => {
    try {
        const response = await axios.get(`${NEWS_API_URL}/top-headlines?q=${query}&apiKey=${API_KEY}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch' };
    }
};



