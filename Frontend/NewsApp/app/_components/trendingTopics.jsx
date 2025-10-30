// TrendingTopics.js
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');

const topics = [
  {
    name: 'Joe Biden',
    views: '12.4k views',
    image: 'https://mcdn.wallpapersafari.com/medium/55/52/3wmtVC.jpg',
    size: 140,
    top: 80,
    left: width / 2 - 80,
  },
  {
    name: 'D trump',
    views: '10.4k views',
    image: 'https://images.financialexpressdigital.com/2025/10/Trump-on-India-Pak-war.jpg?w=440',
    size: 90,
    top: 80,
    left: width / 2 - 180,
  },
  {
    name: 'Demi Lovato',
    views: '8.4k views',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Demi_Lovato_at_2013_MTV_Video_Music_Awards.jpg',
    size: 80,
    top: 0,
    left: width / 2 - 50,
  },
  {
    name: 'Billie Eilish',
    views: '6.4k views',
    image: 'https://media.glamourmagazine.co.uk/photos/64ccca835c915d8a7f4f8bb8/16:9/w_2560%2Cc_limit/BILLIE%2520EILISH%2520040823%2520DEFAULT-GettyImages-1201586589.jpg',
    size: 90,
    top: 40,
    left: width / 2 + 55,
  },
  {
    name: 'Dua Lipa',
    views: '5.4k views',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Dua_Lipa_-_Global_Awards_2020.png',
    size: 75,
    top: 160,
    left: width / 2 + 60,
  },
  {
    name: 'Elliot Page',
    views: '3.4k views',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Elliot_Page_2014.jpg',
    size: 65,
    top: 200,
    left: width / 2 - 110,
  },
];

const TrendingTopics = () => {
  const { colors } = useTheme();
  const [failedIdx, setFailedIdx] = useState(new Set());
  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1600&auto=format&fit=crop';
  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.secondary }]}>Trending topic</Text>
      <View style={styles.bubblesContainer}>
        {topics.map((topic, index) => (
          <View
            key={index}
            style={[
              styles.topic,
              { width: topic.size, height: topic.size, top: topic.top, left: topic.left },
            ]}
          >
            <Image
              source={{ uri: failedIdx.has(index) ? FALLBACK_IMG : topic.image }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setFailedIdx(prev => new Set(prev).add(index))}
            />
            <View style={[styles.overlay, { backgroundColor: colors.text, opacity: 0.6 }]} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.35)"]}
              start={{ x: 0.5, y: 0.2 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.textContainer}>
              <Text style={[styles.name, { color: colors.primary }]}>{topic.name}</Text>
              <Text style={[styles.views, { color: colors.muted }]}>{topic.views}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
  },
  heading: {
    fontSize: 22,
    fontFamily:'MonaSans-Bold',
    textAlign:'center',
    marginLeft: 20,
    marginBottom: 20,
  },
  bubblesContainer: {
    position: 'relative',
    height: 300,
    width: '100%',
  },
  topic: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  textContainer: {
    position: 'absolute',
    bottom: 10,
    alignItems: 'center',
  },
  name: {
    fontSize: 13,
    textAlign:'center',
    fontFamily:'MonaSans-Bold',
  },
  views: {
    fontSize: 11,
    textAlign:'center',
    fontFamily:'MonaSans-Regular',
  },
});

export default TrendingTopics;
