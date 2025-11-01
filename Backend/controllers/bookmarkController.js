const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');

// Get user bookmarks
const getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('bookmarks');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      bookmarks: user.bookmarks,
    });
  } catch (err) {
    console.error('Get bookmarks error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Add a bookmark
const addBookmark = async (req, res) => {
  try {
    const { articleId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.bookmarks.includes(articleId)) {
      return res.status(400).json({ success: false, message: 'Article already bookmarked' });
    }

    user.bookmarks.push(articleId);
    await user.save();

    res.json({ success: true, message: 'Bookmark added', bookmarks: user.bookmarks });
  } catch (err) {
    console.error('Add bookmark error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Remove a bookmark
const removeBookmark = async (req, res) => {
  try {
    const { articleId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.bookmarks = user.bookmarks.filter(id => id.toString() !== articleId);
    await user.save();

    res.json({ success: true, message: 'Bookmark removed', bookmarks: user.bookmarks });
  } catch (err) {
    console.error('Remove bookmark error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getBookmarks, addBookmark, removeBookmark };
