// BookmarkProvider.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKMARKS_KEY = '@bookmarked_articles_v1'; // change version when schema changes

const BookmarkContext = createContext({
  bookmarks: [],
  addBookmark: (article) => {},
  removeBookmark: (articleUrl) => {},
  toggleBookmark: (article) => {},
  isBookmarked: (articleUrl) => false,
});

export const useBookmarks = () => useContext(BookmarkContext);

export const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]); // array of article objects

  useEffect(() => {
    // load stored bookmarks on mount
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
        if (raw) setBookmarks(JSON.parse(raw));
      } catch (e) {
        console.warn('Failed to load bookmarks:', e);
      }
    })();
  }, []);

  useEffect(() => {
    // persist whenever bookmarks change
    (async () => {
      try {
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
      } catch (e) {
        console.warn('Failed to save bookmarks:', e);
      }
    })();
  }, [bookmarks]);

  const addBookmark = (article) => {
    // ensure uniqueness by article.url
    setBookmarks((prev) => {
      if (!article?.url) return prev;
      if (prev.some((a) => a.url === article.url)) return prev;
      alert("Added to bookmarks");
      return [article, ...prev];
    });
  };

  const removeBookmark = (articleUrl) => {
    setBookmarks((prev) => prev.filter((a) => a.url !== articleUrl));
    alert("Removed from bookmarks");
  };

  const toggleBookmark = (article) => {
    if (!article?.url) return;
    if (bookmarks.some((a) => a.url === article.url)) removeBookmark(article.url);
    else addBookmark(article);
  };

  const isBookmarked = (articleUrl) => {
    return bookmarks.some((a) => a.url === articleUrl);
  };

  return (
    <BookmarkContext.Provider
      value={{ bookmarks, addBookmark, removeBookmark, toggleBookmark, isBookmarked }}
    >
      {children}
    </BookmarkContext.Provider>
  );
};
