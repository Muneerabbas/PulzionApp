import axios from "axios";
const STOCK_API_KEY = 'd42dlp1r01qorleqsfv0d42dlp1r01qorleqsfvg';

export const getStockQuote = async (symbol) => {
    try {
        const response = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${STOCK_API_KEY}`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to fetch stock quote' };
    }
};
