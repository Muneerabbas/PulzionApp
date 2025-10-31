// TrendingTopics.js
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/context/ThemeContext';

const { width } = Dimensions.get('window');

const topics = [
  {
    name: 'Joe Biden',
    views: '12.4k views',
    image: 'https://mcdn.wallpapersafari.com/medium/55/52/3wmtVC.jpg',
    size: 140,
  },
  {
    name: 'D trump',
    views: '10.4k views',
    image: 'https://images.financialexpressdigital.com/2025/10/Trump-on-India-Pak-war.jpg?w=440',
    size: 120,
  },
  {
    name: 'Demi Lovato',
    views: '8.4k views',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Demi_Lovato_at_2013_MTV_Video_Music_Awards.jpg',
    size: 120,
  },
  {
    name: 'Billie Eilish',
    views: '6.4k views',
    image: 'https://media.glamourmagazine.co.uk/photos/64ccca835c915d8a7f4f8bb8/16:9/w_2560%2Cc_limit/BILLIE%2520EILISH%2520040823%2520DEFAULT-GettyImages-1201586589.jpg',
    size: 120,
  },
  {
    name: 'Dua Lipa',
    views: '5.4k views',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Dua_Lipa_-_Global_Awards_2020.png',
    size: 110,
  },
  {
    name: 'Elliot Page',
    views: '3.4k views',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Elliot_Page_2014.jpg',
    size: 110,
  },
];

const TrendingTopics = () => {
  const { colors } = useTheme();
  const [failedIdx, setFailedIdx] = useState(new Set());
  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1600&auto=format&fit=crop';
  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      key={index}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.border }]}
    >
      <Image
        source={{ uri: failedIdx.has(index) ? FALLBACK_IMG : item.image }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        onError={() => setFailedIdx(prev => new Set(prev).add(index))}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.text, opacity: 0.25 }]} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.45)"]}
        start={{ x: 0.5, y: 0.1 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.cardTextWrap}>
        <Text numberOfLines={1} style={[styles.name, { color: '#ffffff'}]}>{item.name}</Text>
        <Text numberOfLines={1} style={[styles.views, { color: '#ffffff'}]}>{item.views}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.secondary }]}>Trending topics</Text>
      <FlatList
        data={topics}
        keyExtractor={(it, i) => `${it.name}-${i}`}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // paddingTop: 20,
    paddingBottom: 6,
  },
  heading: {
    fontSize: 22,
    fontFamily:'MonaSans-Bold',
    textAlign:'center',
    marginLeft: 20,
    marginBottom: 12,
  },
  listContent: { paddingHorizontal: 16 },
  card: {
    width: width * 0.5,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    justifyContent: 'flex-end',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardTextWrap: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  name: {
    fontSize: 14,
    textAlign:'left',
    fontFamily:'MonaSans-Bold',
  },
  views: {
    fontSize: 12,
    textAlign:'left',
    fontFamily:'MonaSans-Regular',
  },
});

export default TrendingTopics;
