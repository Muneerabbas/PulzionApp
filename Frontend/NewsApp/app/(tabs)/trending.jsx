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
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { getRecommendations, getSimilarArticles } from '../../src/api/recommendService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as WebBrowser from 'expo-web-browser';
import { useBottomSheet } from '../../src/context/bottomSheetContext';

dayjs.extend(relativeTime);

const { width, height } = Dimensions.get('window');

const ASYNC_STORAGE_KEYS = {
  HISTORY: '@NewsPulse_userHistory',
  LIKES: '@NewsPulse_likedArticleIds',
  DISLIKES: '@NewsPulse_dislikedArticleIds',
  SOURCES: '@NewsPulse_seenSources',
};


const Card = ({ item, colors,setSimilarArticle,setSimilarScroller }) => {
  const sentimentMap = { positive: 2, neutral: 1, negative: 0 };
  const sentimentScore = sentimentMap[item?.sentiment] ?? 1;
  console.log("Item data",item)
  const sentimentColor =
    sentimentScore === 2 ? '#1fc16b' : sentimentScore === 1 ? '#fbbc04' : '#ff4d4f';
  const categories =
    item?.categories?.length > 0 ? item.categories.slice(0, 3) : ['News', 'Update'];


const handleSimilarArticle = async(item) => {
  try {
    
    const res = await getSimilarArticles(item?.id)
    setSimilarArticle(res.similar)
    setSimilarScroller(true)
    
  } catch (error) {
    console.log("Error",error)
  }



}

  return (
    <View style={[styles.card, { backgroundColor: colors.border }]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item?.urlToImage }} style={styles.image} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
      </View>

      <View style={styles.textContainer}>
      
         <Text numberOfLines={10} style={styles.title}>
          {item?.title || 'No Title'}
        </Text>
        <Text numberOfLines={10} style={styles.title2}>
          {item?.description || 'No Description'}
        </Text>
          <Text style={styles.author}>-{item?.author || 'Anonymous'}</Text>
        <Text style={styles.timeAgo}>{dayjs(item?.published_at).fromNow()}</Text>
         <View style={styles.sentimentContainer}>
        <LinearGradient
          colors={['#ff4d4f', '#fbbc04', '#1fc16b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
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
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.topicsContainer}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {categories.map((category, index) => (
          <LinearGradient
            key={index}
            colors={['#4facfe', '#00f2fe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topicCapsule}
          >
            <Text style={styles.topicText}>{category}</Text>
          </LinearGradient>
        ))}
      </ScrollView>
      
      </View>

     <TouchableOpacity activeOpacity={0.8} onPress={()=>{handleSimilarArticle(item)}} style={styles.buttonWrapper}>
      <LinearGradient
        colors={['#38033dff', '#11ced8ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Read More articles like this</Text>
      </LinearGradient>
    </TouchableOpacity>

      
    </View>
  );
};

const Trending = () => {
  const { colors } = useTheme();
  const { openSheet } = useBottomSheet();
  const [news, setNews] = useState([]);
  const [swipeDir, setSwipeDir] = useState(null);
  const bgAnim = useState(new Animated.Value(0))[0];
  const [isHydrating, setIsHydrating] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [swipedAll, setSwipedAll] = useState(false);
  const swiperRef = useRef(null);
  const isFetchingRef = useRef(false);
  const userHistoryRef = useRef(new Set());
  const likedArticleIdsRef = useRef([]);
  const dislikedArticleIdsRef = useRef([]);
  const seenSourcesRef = useRef(new Set());
  const [similarArticle, setSimilarArticle] = useState([])
  const [similarScroller, setSimilarScroller] = useState(false)

  useEffect(() => {
    const hydrateState = async () => {
      try {
        const [history, likes, dislikes, sources] = await Promise.all([
          AsyncStorage.getItem(ASYNC_STORAGE_KEYS.HISTORY),
          AsyncStorage.getItem(ASYNC_STORAGE_KEYS.LIKES),
          AsyncStorage.getItem(ASYNC_STORAGE_KEYS.DISLIKES),
          AsyncStorage.getItem(ASYNC_STORAGE_KEYS.SOURCES),
        ]);
        userHistoryRef.current = history ? new Set(JSON.parse(history)) : new Set();
        likedArticleIdsRef.current = likes ? JSON.parse(likes) : [];
        dislikedArticleIdsRef.current = dislikes ? JSON.parse(dislikes) : [];
        seenSourcesRef.current = sources ? new Set(JSON.parse(sources)) : new Set();
      } catch (e) {
        console.error('Failed to hydrate state', e);
      } finally {
        setIsHydrating(false);
      }
    };
    hydrateState();
  }, []);

  const fetchNews = useCallback(
    async (isRefresh = false) => {
      if (isFetchingRef.current) return 0;
      isFetchingRef.current = true;
      setIsFetching(true);
      setSwipedAll(false);
      if (isRefresh) {
        userHistoryRef.current.clear();
        likedArticleIdsRef.current = [];
        dislikedArticleIdsRef.current = [];
        seenSourcesRef.current.clear();
        await Promise.all([
          AsyncStorage.removeItem(ASYNC_STORAGE_KEYS.HISTORY),
          AsyncStorage.removeItem(ASYNC_STORAGE_KEYS.LIKES),
          AsyncStorage.removeItem(ASYNC_STORAGE_KEYS.DISLIKES),
          AsyncStorage.removeItem(ASYNC_STORAGE_KEYS.SOURCES),
        ]);
      }
      const lastLikedArticleId = likedArticleIdsRef.current[0] || null;
      try {
        const response = await getRecommendations({
          articleId: lastLikedArticleId,
          likedArticleIds: likedArticleIdsRef.current,
          dislikedArticleIds: dislikedArticleIdsRef.current,
          userHistory: [...userHistoryRef.current],
          seenSources: [...seenSourcesRef.current],
          topK: 20,
        });
        const newRecs = response?.data?.recommendations || [];
        if (newRecs.length > 0) {
          newRecs.forEach(article => userHistoryRef.current.add(article.id));
          AsyncStorage.setItem(
            ASYNC_STORAGE_KEYS.HISTORY,
            JSON.stringify([...userHistoryRef.current])
          ).catch(e => console.error('AsyncStorage write error', e));
          setNews(prevNews => (isRefresh ? newRecs : [...prevNews, ...newRecs]));
        } else if (news.length === 0) {
          setSwipedAll(true);
        }
        return newRecs.length;
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        return 0;
      } finally {
        isFetchingRef.current = false;
        setIsFetching(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isHydrating) fetchNews(true);
  }, [isHydrating]);

  const handleSwipe = (cardIndex, swipeDirection) => {
    const article = news[cardIndex];
    if (!article) return;
    if (article.source && !seenSourcesRef.current.has(article.source)) {
      seenSourcesRef.current.add(article.source);
      AsyncStorage.setItem(
        ASYNC_STORAGE_KEYS.SOURCES,
        JSON.stringify([...seenSourcesRef.current])
      ).catch(e => console.error('AsyncStorage sources write error', e));
    }
    if (swipeDirection === 'right') {
      likedArticleIdsRef.current = [article.id, ...likedArticleIdsRef.current].slice(0, 30);
      AsyncStorage.setItem(
        ASYNC_STORAGE_KEYS.LIKES,
        JSON.stringify(likedArticleIdsRef.current)
      ).catch(e => console.error('AsyncStorage likes write error', e));
    } else {
      dislikedArticleIdsRef.current = [article.id, ...dislikedArticleIdsRef.current].slice(0, 30);
      AsyncStorage.setItem(
        ASYNC_STORAGE_KEYS.DISLIKES,
        JSON.stringify(dislikedArticleIdsRef.current)
      ).catch(e => console.error('AsyncStorage dislikes write error', e));
    }
    setNews(prevNews => {
      const newNews = prevNews.filter((_, i) => i !== cardIndex);
      if (newNews.length < 10 && !isFetchingRef.current) {
        setTimeout(() => fetchNews(false), 300);
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
        <Text style={[styles.endText, { color: colors.secondary, marginTop: 12 }]}>
          Loading session...
        </Text>
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
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
{
  !similarScroller ? (
    news.length > 0 ? (
      <>
        <Swiper
          ref={swiperRef}
          cards={news}
          renderCard={card =>
            card ? (
              <Card
                item={card}
                colors={colors}
                setSimilarArticle={setSimilarArticle}
                similarScroller={similarScroller}
                setSimilarScroller={setSimilarScroller}
              />
            ) : null
          }
          onSwipedLeft={i => { handleSwipe(i, 'left'); fetchNews(false); }}
          onSwipedRight={i => { handleSwipe(i, 'right'); fetchNews(false); }}
          onSwipedTop={i => { handleSwipe(i, 'top'); fetchNews(false); }}
          onSwiped={() => setSwipeDir(null)}
          showSecondCard={news.length > 1}
          cardVerticalMargin={20}
          backgroundColor="transparent"
          stackSize={3}
          stackSeparation={-10}
          disableBottomSwipe
          animateOverlayLabelsOpacity
          animateCardOpacity
          overlayLabels={{
            left: {
              title: 'DISLIKE',
              style: { label: { backgroundColor: 'red', color: 'white', fontSize: 24 } },
            },
            right: {
              title: 'LIKE',
              style: { label: { backgroundColor: 'green', color: 'white', fontSize: 24 } },
            },
          }}
          onSwiping={x => {
            if (x > 0) setSwipeDir('right');
            else if (x < 0) setSwipeDir('left');
            else setSwipeDir(null);
          }}
        />

        {isFetching && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.2)',
              },
            ]}
          >
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        )}
      </>
    ) : (
      <View style={[styles.endContainer, { backgroundColor: colors.primary }]}>
        {isFetching ? (
          <>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={[styles.endText, { color: colors.secondary, marginTop: 10 }]}>
              Fetching more news...
            </Text>
          </>
        ) : (
          <TouchableOpacity onPress={() => fetchNews(true)}>
            <Text style={[styles.endText, { color: colors.secondary }]}>Reload 🔄</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  ) : (
    <SafeAreaView style={{ flex: 1, width: width * 0.95, alignSelf: 'center',paddingVertical:40,paddingBottom:70 }}>
      <View style={{ flexDirection: 'row', gap:20, alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity onPress={() => setSimilarScroller(false)}>
          <Ionicons name="chevron-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={[styles.endText, { color: colors.secondary }]}>Similar Articles</Text>
    
      </View>
      
      <FlatList
        data={similarArticle}
        keyExtractor={(item, index) => item?.id?.toString?.() || item?.url || `sim-${index}`}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openSheet(item)}
            style={[styles.simCard, { backgroundColor: colors.border }]}
            activeOpacity={0.85}
          >
            <Image source={{ uri: item?.urlToImage }} style={styles.simThumb} resizeMode="cover" />
            <View style={styles.simInfo}>
              <Text numberOfLines={3} style={[styles.simTitle, { color: colors.secondary }]}>
                {item?.title || 'Untitled'}
              </Text>
              <Text style={[styles.simMeta, { color: colors.muted }]}>
                {(item?.source || item?.source_name || 'Unknown')} • {item?.published_at ? dayjs(item.published_at).format('DD MMM YYYY') : ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 24 }}
      />
    </SafeAreaView>
  )
}

 
    </View>
  );
};

const styles = StyleSheet.create({
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
  imageContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 25, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  textContainer: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 12,
    marginBottom: 8,
  },
  author: { fontSize: 12, fontFamily: 'MonaSans-Medium',numberOfLines:2, textAlign: 'right', color: '#f0f0f0' },
  timeAgo: { fontSize: 12, fontFamily: 'MonaSans-Regular', textAlign: 'right', color: '#f0f0f0', marginBottom: 4 },
  title: { fontSize: 16, fontFamily: 'MonaSans-Bold', textAlign: 'center', marginVertical: 8, color: '#f0f0f0' },
  title2: { fontSize: 12, fontFamily: 'MonaSans-Regular', textAlign: 'center', marginVertical: 8, color: '#f0f0f0' },
   buttonWrapper: {
    marginTop: 12,
    alignSelf: 'center',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'MonaSans-Medium',
    textAlign: 'center',
  },
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
  endText: { fontSize: 20, fontFamily: 'MonaSans-Bold', textAlign: 'center', color: '#fff' },
  // Similar list styles
  simCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  simThumb: {
    width: 72,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  simInfo: { flex: 1, marginLeft: 12 },
  simTitle: { fontSize: 16, fontFamily: 'MonaSans-Bold' },
  simMeta: { marginTop: 6, fontSize: 13, fontFamily: 'MonaSans-Regular' },
});

export default Trending;
