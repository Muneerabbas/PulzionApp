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
import { getNews } from '../../src/api/newsApi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const { width, height } = Dimensions.get('window');

// ------------------ CARD COMPONENT ------------------
const Card = ({ item, colors }) => {
  const sentimentScore = item?.description?.length % 3; // 0=negative,1=neutral,2=positive
  const sentimentColor =
    sentimentScore === 2 ? '#1fc16b' : sentimentScore === 1 ? '#fbbc04' : '#ff4d4f';

  const topics = item?.title?.split(' ').slice(0, 5) || ['News', 'Update'];

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
          {dayjs(item?.publishedAt).fromNow()}
        </Text>
      </View>

      <Text numberOfLines={5} style={[styles.title, { color: colors.secondary }]}>
        {item?.description || 'No Description'}
      </Text>

      {/* Sentiment Bar */}
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

      {/* Capsule Topics */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.topicsContainer}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {topics.map((topic, index) => (
          <LinearGradient
            key={index}
            colors={['#4facfe', '#00f2fe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topicCapsule}
          >
            <Text style={styles.topicText}>{topic}</Text>
          </LinearGradient>
        ))}
      </ScrollView>
    </View>
  );
};

// ------------------ TRENDING COMPONENT ------------------
const Trending = () => {
  const { colors } = useTheme();
  const [news, setNews] = useState([]);
  const [swipeDir, setSwipeDir] = useState(null);
  const bgAnim = useState(new Animated.Value(0))[0];
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);
  const [swipedAll, setSwipedAll] = useState(false);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getNews();
      setNews(response.articles);
      setSwipedAll(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Animate swipe gradient overlay
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

  if (loading) {
    return (
      <View style={[styles.endContainer, { backgroundColor: colors.primary }]}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={[styles.endText, { color: colors.secondary, marginTop: 12 }]}>Loading...</Text>
      </View>
    );
  }

  if (!loading && (swipedAll || news.length === 0)) {
    return (
      <View style={[styles.endContainer, { backgroundColor: colors.primary }]}>
        <Text style={[styles.endText, { color: colors.secondary }]}>🎉 That's all for today!</Text>
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
      {/* Swipe Gradient Overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {news.length > 0 && (
        <>
          <Swiper
            ref={swiperRef}
            cards={news}
            renderCard={(card, index) => (
              <Animated.View
                style={[
                  { transform: [{ scale: 1 - index * 0.05 }, { translateY: index * 10 }] },
                ]}
              >
                <Card item={card} colors={colors} />
              </Animated.View>
            )}
            cardVerticalMargin={20}
            cardHorizontalMargin={0}
            backgroundColor="transparent"
            stackSize={3}
            stackSeparation={-10}
            stackScale={8}
            disableTopSwipe={false}
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
            onSwiped={() => setSwipeDir(null)}
            onSwipedAll={() => {
              setSwipeDir(null);
              setSwipedAll(true);
            }}
          />

          {/* Swipe Controls */}
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
              style={[styles.controlButton, { backgroundColor: 'rgba(128,128,128,0.15)', borderColor: 'rgba(128,128,128,0.3)' }]}
              activeOpacity={0.8}
            >
              <Ionicons name="remove-circle" size={22} color="#8c8c8c" />
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
  imageContainer: { flex: 1, width: '100%', borderRadius: 25, overflow: 'hidden' },
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
    top: 0,
    width: 14,
    height: '100%',
    borderRadius: 6,
  },
  topicsContainer: { marginTop: 12, maxHeight: 32 },
  topicCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  topicText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  endContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  endText: { fontSize: 24, fontFamily: 'MonaSans-Bold', textAlign: 'center' },
});

export default Trending;
