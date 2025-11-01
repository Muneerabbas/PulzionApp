// screens/Trending.js (Complete Updated File)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { getRecommendations } from '../../src/api/recommendService';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- NEW IMPORT
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const { width, height } = Dimensions.get('window');

// --- NEW: Define keys for AsyncStorage ---
const ASYNC_STORAGE_KEYS = {
  HISTORY: '@NewsPulse_userHistory',
  LIKES: '@NewsPulse_likedArticleIds',
  DISLIKES: '@NewsPulse_dislikedArticleIds',
  SOURCES: '@NewsPulse_seenSources',
};

// ------------------ CARD COMPONENT (Unchanged) ------------------
const Card = ({ item, colors }) => {
  // ... (This component is unchanged)
  const sentimentMap = { positive: 2, neutral: 1, negative: 0 };
  const sentimentScore = sentimentMap[item?.sentiment] ?? 1;
  const sentimentColor =
    sentimentScore === 2 ? '#1fc16b' : sentimentScore === 1 ? '#fbbc04' : '#ff4d4f';
  const topics =
    item?.keywords?.length > 0
      ? item.keywords.slice(0, 5)
      : item?.categories?.length > 0
      ? item.categories.slice(0, 3)
      : ['News', 'Update'];

  return (
    <View style={[styles.card, { backgroundColor: colors.border }]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item?.urlToImage }} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.authorSection}>
        <Text style={[styles.author, { color: colors.secondary }]}>{item?.author || 'Anonymous'}</Text>
        <Text style={[styles.timeAgo, { color: colors.secondary }]}>
          {dayjs(item?.published_at).fromNow()}
        </Text>
      </View>
      <Text numberOfLines={5} style={[styles.title, { color: colors.secondary }]}>
        {item?.description || 'No Description'}
      </Text>
      <View style={styles.sentimentContainer}>
        <LinearGradient
          colors={['#ff4d4f', '#fbbc04', '#1fc16b']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.sentimentBar}
        />
        <View
          style={[
            styles.sentimentIndicator,
            { left: `${(sentimentScore / 2) * 100}%`, backgroundColor: sentimentColor },
          ]}
        />
      </View>
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.topicsContainer}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {topics.map((topic, index) => (
          <LinearGradient
            key={index}
            colors={['#4facfe', '#00f2fe']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.topicCapsule}
          >
            <Text style={styles.topicText}>{topic}</Text>
          </LinearGradient>
        ))}
      </ScrollView>
    </View>
  );
};

// ------------------ TRENDING COMPONENT (Updated) ------------------
const Trending = () => {
  const { colors } = useTheme();
  const [news, setNews] = useState([]);
  const [swipeDir, setSwipeDir] = useState(null);
  const bgAnim = useState(new Animated.Value(0))[0];
  
  // --- NEW: Separate loading states ---
  const [isHydrating, setIsHydrating] = useState(true); // For loading from storage
  const [isFetching, setIsFetching] = useState(false);  // For API calls
  
  const swiperRef = useRef(null);
  const [swipedAll, setSwipedAll] = useState(false);

  // We still use refs for instant access in callbacks
  const userHistoryRef = useRef(new Set());
  const likedArticleIdsRef = useRef([]);
  const dislikedArticleIdsRef = useRef([]);
  const seenSourcesRef = useRef(new Set());

  // --- NEW: Hydration Effect ---
  // Runs ONCE on component mount to load persistent state
  useEffect(() => {
    const hydrateState = async () => {
      try {
        // Load all data from storage in parallel
        const [history, likes, dislikes, sources] = await Promise.all([
          AsyncStorage.getItem(ASYNC_STORAGE_KEYS.HISTORY),
          AsyncStorage.getItem(ASYNC_STORAGE_KEYS.LIKES),
          AsyncStorage.getItem(ASYNC_STORAGE_KEYS.DISLIKES),
          AsyncStorage.getItem(ASYNC_STORAGE_KEYS.SOURCES),
        ]);

        // Populate our refs with the stored data
        userHistoryRef.current = history ? new Set(JSON.parse(history)) : new Set();
        likedArticleIdsRef.current = likes ? JSON.parse(likes) : [];
        dislikedArticleIdsRef.current = dislikes ? JSON.parse(dislikes) : [];
        seenSourcesRef.current = sources ? new Set(JSON.parse(sources)) : new Set();
        
      } catch (e) {
        console.error("Failed to hydrate state from AsyncStorage", e);
        // On error, just start fresh
      } finally {
        setIsHydrating(false); // Hydration is done
      }
    };

    hydrateState();
  }, []); // Empty array, runs once on mount

  // --- Updated fetchNews function ---
  const fetchNews = useCallback(async (isRefresh = false) => {
    if (isFetching) return 0; // Prevent parallel fetches
    
    setIsFetching(true);
    setSwipedAll(false);

    if (isRefresh) {
      // On a full refresh, clear the session history
      userHistoryRef.current.clear();
      likedArticleIdsRef.current = [];
      dislikedArticleIdsRef.current = [];
      seenSourcesRef.current.clear();
      
      // NEW: Clear AsyncStorage as well
      await Promise.all([
        AsyncStorage.removeItem(ASYNC_STORAGE_KEYS.HISTORY),
        AsyncStorage.removeItem(ASYNC_STORAGE_KEYS.LIKES),
        AsyncStorage.removeItem(ASYNC_STORAGE_KEYS.DISLIKES),
        AsyncStorage.removeItem(ASYNC_STORAGE_KEYS.SOURCES),
      ]);
    }

    // Get the ID of the *very last* article liked
    const lastLikedArticleId = likedArticleIdsRef.current[0] || null;

    try {
      const response = await getRecommendations({
        articleId: lastLikedArticleId,
        likedArticleIds: likedArticleIdsRef.current,
        dislikedArticleIds: dislikedArticleIdsRef.current,
        userHistory: [...userHistoryRef.current],
        seenSources: [...seenSourcesRef.current],
        topK: 10,
      });

      const newRecs = response?.data?.recommendations || [];

      if (newRecs.length > 0) {
        // Add new articles to our history tracker *immediately*
        newRecs.forEach(article => userHistoryRef.current.add(article.id));
        
        // NEW: Persist the *new* history (fire-and-forget)
        AsyncStorage.setItem(
          ASYNC_STORAGE_KEYS.HISTORY, 
          JSON.stringify([...userHistoryRef.current])
        ).catch(e => console.error("AsyncStorage history write error", e));
        
        // Add to the *end* of the deck
        setNews(prevNews => (isRefresh ? newRecs : [...prevNews, ...newRecs]));
      }
      
      return newRecs.length; // Return count for logic
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return 0;
    } finally {
      setIsFetching(false);
    }
  }, [isFetching]); // Dependency on isFetching to prevent races

  useEffect(() => {
    if (!isHydrating) { // Only fetch *after* hydration
      fetchNews(true); // Initial load is a "refresh"
    }
  }, [isHydrating, fetchNews]); // Runs when hydration finishes

  const handleSwipe = (cardIndex, swipeDirection) => {
    const article = news[cardIndex];
    if (!article) return;

    if (article.source && !seenSourcesRef.current.has(article.source)) {
      seenSourcesRef.current.add(article.source);
      AsyncStorage.setItem(
        ASYNC_STORAGE_KEYS.SOURCES, 
        JSON.stringify([...seenSourcesRef.current])
      ).catch(e => console.error("AsyncStorage sources write error", e));
    }
    
    if (swipeDirection === 'right') { // LIKE
      likedArticleIdsRef.current = [article.id, ...likedArticleIdsRef.current].slice(0, 20);
      AsyncStorage.setItem(
        ASYNC_STORAGE_KEYS.LIKES, 
        JSON.stringify(likedArticleIdsRef.current)
      ).catch(e => console.error("AsyncStorage likes write error", e));
    } else { // DISLIKE (left or top)
      dislikedArticleIdsRef.current = [article.id, ...dislikedArticleIdsRef.current].slice(0, 20);
      AsyncStorage.setItem(
        ASYNC_STORAGE_KEYS.DISLIKES, 
        JSON.stringify(dislikedArticleIdsRef.current)
      ).catch(e => console.error("AsyncStorage dislikes write error", e));
    }
    
    setNews(prevNews => {
      const newNews = prevNews.filter((_, i) => i !== cardIndex);
      
      if (newNews.length < 5 && !isFetching) {
        fetchNews(false).then((newCardsCount) => {
          if (newCardsCount === 0 && newNews.length === 0) {
            setSwipedAll(true);
          }
        });
      }
      return newNews;
    });
  };

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: swipeDir === 'right' ? 1 : swipeDir === 'left' ? -1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [swipeDir]);

  const opacity = bgAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.6, 0, 0.6],
  });

  if (isHydrating) {
    return (
      <View style={[styles.endContainer, { backgroundColor: colors.primary }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={[styles.endText, { color: colors.secondary, marginTop: 12 }]}>Loading session...</Text>
      </View>
    );
  }

  const gradientColors =
    swipeDir === 'right'
      ? ['rgba(0,255,0,0.6)', 'rgba(0,255,0,0.2)', 'transparent']
      : swipeDir === 'left'
      ? ['rgba(255,0,0,0.6)', 'rgba(255,0,0,0.2)', 'transparent']
      : ['transparent', 'transparent'];

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {!isFetching && news.length === 0 && swipedAll && (
        <View style={[styles.endContainer, { backgroundColor: colors.primary }]}>
          <Text style={[styles.endText, { color: colors.secondary }]}>🎉 That's all for today!</Text>
          <TouchableOpacity onPress={() => fetchNews(true)}>
             <Text style={{color: colors.secondary, marginTop: 10}}>Refresh?</Text>
          </TouchableOpacity>
        </View>
      )}

      {isFetching && !isHydrating && news.length > 0 && (
         <View style={styles.fetchingMoreSpinner}>
            <ActivityIndicator size="small" color={colors.secondary} />
         </View>
      )}

      {news.length > 0 && (
        <>
          <Swiper
            ref={swiperRef}
            cards={news}
            keyExtractor={(card) => card?.id || Math.random().toString()}
            renderCard={(card) => card ? <Card item={card} colors={colors} /> : null}
            
            onSwipedLeft={(i) => handleSwipe(i, 'left')}
            onSwipedRight={(i) => handleSwipe(i, 'right')}
            onSwipedTop={(i) => handleSwipe(i, 'top')}
            
            onSwiped={() => setSwipeDir(null)}
            
            onSwipedAll={() => {
            
            }}
            
            showSecondCard={news.length > 1}
            
            // ... (rest of Swiper props)
            cardVerticalMargin={20}
            cardHorizontalMargin={0}
            backgroundColor="transparent"
            stackSize={3}
            stackSeparation={-10}
            stackScale={8}
            disableBottomSwipe
            animateOverlayLabelsOpacity
            animateCardOpacity
            overlayLabels={{
              left: {
                title: 'DISLIKE',
                style: {
                  label: { backgroundColor: 'red', color: 'white', fontSize: 24 },
                },
              },
              right: {
                title: 'LIKE',
                style: {
                  label: { backgroundColor: 'green', color: 'white', fontSize: 24 },
                },
              },
            }}
            onSwiping={(x) => {
              if (x > 0) setSwipeDir('right');
              else if (x < 0) setSwipeDir('left');
              else setSwipeDir(null);
            }}
          />
          <View style={styles.controlsContainer}>
             <TouchableOpacity
               onPress={() => swiperRef.current?.swipeLeft()}
               style={[styles.controlButton, { backgroundColor: 'rgba(255,0,0,0.15)', borderColor: 'rgba(255,0,0,0.3)' }]}
               activeOpacity={0.8}
             >
               <Ionicons name="thumbs-down" size={22} color="#ff4d4f" />
             </TouchableOpacity>

             <TouchableOpacity
               onPress={() => swiperRef.current?.swipeTop()}
               style={[styles.controlButton, { backgroundColor: 'rgba(128,128,128,0.15)', borderColor: 'rgba(128,128,0.3)' }]}
               activeOpacity={0.8}
             >
               <Ionicons name="remove-circle" size={22} color="#8c8c8F" />
             </TouchableOpacity>

             <TouchableOpacity
               onPress={() => swiperRef.current?.swipeRight()}
               style={[styles.controlButton, { backgroundColor: 'rgba(0,200,0,0.15)', borderColor: 'rgba(0,200,0,0.3)' }]}
               activeOpacity={0.8}
             >
               <Ionicons name="thumbs-up" size={22} color="#1fc16b" />
             </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

// ------------------ STYLES ------------------
const styles = StyleSheet.create({
  // ... (all previous styles)
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controlsContainer: {
    position: 'absolute',
    bottom: 24,
    width: width * 0.85,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  card: {
    borderRadius: 25,
    width: width * 0.9,
    height: height * 0.75,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
    position: 'relative',
    alignSelf: 'center',
    justifyContent: 'flex-end',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  authorSection: { alignItems: 'center', marginVertical: 6 },
  author: { fontSize: 16, fontFamily: 'MonaSans-Bold', textAlign: 'center' },
  timeAgo: { fontSize: 12, fontFamily: 'MonaSans-Regular', textAlign: 'center' },
  title: { fontSize: 16, fontFamily: 'MonaSans-Bold', textAlign: 'center', marginVertical: 8 },
  sentimentContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
  },
  sentimentBar: { width: '100%', height: '100%' },
  sentimentIndicator: {
    position: 'absolute',
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  topicsContainer: { marginTop: 12, maxHeight: 32 },
  topicCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  topicText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  endContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  endText: { fontSize: 24, fontFamily: 'MonaSans-Bold', textAlign: 'center' },
  // --- NEW STYLE ---
  fetchingMoreSpinner: {
    position: 'absolute',
    top: height * 0.4, // Position in the middle
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 10,
  }
});

export default Trending;