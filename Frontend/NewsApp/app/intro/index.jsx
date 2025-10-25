import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const INTRO_SLIDES = [
  {
    id: '1',
    title: 'Welcome to NewsPulse',
    subtitle: 'Your Personal News Companion',
    description: 'Stay updated with the latest trending headlines from around the world',
    icon: 'newspaper',
    color: '#4A90E2',
  },
  {
    id: '2',
    title: 'Analyze Trends',
    subtitle: 'Visual Insights at a Glance',
    description: 'Discover trending topics with interactive charts and word clouds',
    icon: 'analytics',
    color: '#7B68EE',
  },
  {
    id: '3',
    title: 'Get Started',
    subtitle: 'Join Thousands of Readers',
    description: 'Bookmark articles, customize preferences, and never miss a story',
    icon: 'rocket',
    color: '#FF6B6B',
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleSkip = async () => {
    try {
      // Mark intro as skipped
      await AsyncStorage.setItem('@intro_skipped', 'true');
      console.log('Skip pressed - navigating to auth');
      // Use push instead of replace to ensure navigation happens
      setTimeout(() => {
        router.push('/auth');
      }, 100);
    } catch (error) {
      console.error('Error saving skip status:', error);
      router.push('/auth');
    }
  };

  const handleNext = () => {
    if (currentIndex < INTRO_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const handleGetStarted = async () => {
    try {
      // Mark intro as completed
      await AsyncStorage.setItem('@intro_skipped', 'true');
      console.log('Get Started pressed - navigating to auth');
      // Use push instead of replace to ensure navigation happens
      setTimeout(() => {
        router.push('/auth');
      }, 100);
    } catch (error) {
      console.error('Error saving intro status:', error);
      router.push('/auth');
    }
  };

  const renderSlide = ({ item, index }) => (
    <View style={styles.slide}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon} size={80} color="#fff" />
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>

        {/* Description */}
        <Text style={styles.description}>{item.description}</Text>

        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {INTRO_SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === currentIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {index === INTRO_SLIDES.length - 1 ? (
            // Last slide - Get Started button
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
          ) : (
            // Other slides - Next button
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/images/LatestNews.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Skip Button - Only show on first 2 slides */}
        {currentIndex < INTRO_SLIDES.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={INTRO_SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / width
            );
            setCurrentIndex(index);
          }}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'MonaSans-Medium',
  },
  slide: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 80,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'MonaSans-Bold',
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.9,
    fontFamily: 'MonaSans-SemiBold',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    paddingHorizontal: 20,
    marginBottom: 40,
    fontFamily: 'MonaSans-Regular',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 30,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  nextButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'MonaSans-Bold',
  },
  getStartedButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  getStartedText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'MonaSans-Bold',
  },
});
