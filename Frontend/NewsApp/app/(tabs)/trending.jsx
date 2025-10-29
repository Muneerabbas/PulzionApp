import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Animated, ActivityIndicator } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';
import { getNews } from '../../src/api/newsApi';
import dayjs from 'dayjs';

const { width, height } = Dimensions.get('window');

const Card = ({ item, colors }) => (
  <View style={[styles.card, { backgroundColor: colors.border }]}>
    <Image source={{ uri: item?.urlToImage }} style={styles.image} resizeMode="cover" />

    <View style={styles.authorSection}>
      <Text style={[styles.author, { color: colors.secondary }]}>{item?.author}</Text>
      <Text style={[styles.timeAgo, { color: colors.secondary }]}>
        {dayjs(item?.publishedAt).format('DD MMM YYYY')}
      </Text>
    </View>

    <Text numberOfLines={5} style={[styles.title, { color: colors.secondary }]}>
      {item?.description}
    </Text>

    <Text style={[styles.readTime, { color: colors.text }]}>
      Source:{' '}
      <Text style={[styles.readTimeBold, { color: colors.text }]}>{item?.source?.name}</Text>
    </Text>
  </View>
);

const Trending = () => {
  const { colors } = useTheme();
  const [news, setNews] = useState([]);
  const [swipeDir, setSwipeDir] = useState(null);
  const bgAnim = useState(new Animated.Value(0))[0];
  const [loading, setLoading] = useState(true);


  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getNews();
      setNews(response.articles);
      setSwipedAll(false);
    } catch (error) {
      console.error(error);
    }
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Animate swipe direction
  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: swipeDir === 'right' ? 1 : swipeDir === 'left' ? -1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [swipeDir]);

  const opacity = bgAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.8, 0, 0.8],
  });
  const [swipedAll, setSwipedAll] = useState(false);

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
      <View style={[styles.endContainer,{backgroundColor:colors.primary}]}> 
        <Text style={[styles.endText,{color:colors.secondary}]}>🎉 That's all for today!</Text>
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
    <View 
  
    style={[styles.container, { backgroundColor: colors.primary }]}>
      {/* Animated Gradient Layer */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <LinearGradient
          colors={gradientColors}
          start={swipeDir === 'right' ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 }}
          end={swipeDir === 'right' ? { x: 1, y: 0.5 } : { x: 0, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {news.length > 0 && (
        <Swiper
          cards={news}
          renderCard={(card) => <Card item={card} colors={colors} />}
          backgroundColor="transparent"
          stackSize={3}

stackSeparation={-15}  
stackScale={10}     
          disableTopSwipe
          disableBottomSwipe
          
          onSwiping={(x) => {
            if (x > 0) setSwipeDir('right');
            else if (x < 0) setSwipeDir('left');
            else setSwipeDir(null);
          }}
          onSwiped={() => setSwipeDir(null)}
          onSwipedAll={() => {setSwipeDir(null);setSwipedAll(true)}}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    borderRadius: 20,
    padding: 5,
    width: width * 0.85,
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: height * 0.3,
    borderRadius: 12,
    marginBottom: 16,
  },
  authorSection: { alignItems: 'center', marginBottom: 8 },
  author: { fontSize: 16, fontFamily: 'MonaSans-Bold',textAlign:'center' },
  timeAgo: { fontSize: 13, fontFamily: 'MonaSans-Regular',textAlign:'center' },
  title: { fontSize: 14, fontFamily: 'MonaSans-Regular', textAlign: 'center', marginVertical: 8 },
  readTime: { fontSize: 14, fontFamily: 'MonaSans-Regular' },
  readTimeBold: { fontFamily: 'MonaSans-Bold', fontSize: 14 },
   endContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  endText: {
    fontSize: 24,
    fontFamily:'MonaSans-Bold',
  },
});

export default Trending;