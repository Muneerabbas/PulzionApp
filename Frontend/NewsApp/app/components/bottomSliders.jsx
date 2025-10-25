import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useT } from '../../src/utils/tMiddleware'
import { useTheme } from '../../src/context/ThemeContext'
const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.45; // Each item takes about 45% of screen width
const ITEM_HEIGHT = ITEM_WIDTH * 1.2; // A bit taller than it is wide

// Demo Data (replace with your actual data structure)
const DEMO_DATA = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1570172619614-23395d852ad6?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Example image 1
    // You can add more data like 'title', 'description' etc.
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1594738275992-0b81561f7743?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Example image 2
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1582294874312-d2789139265f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Example image 3
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1517486804604-e221d8b943d0?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Example image 4
  },
];

// /**
//  * A horizontal slider component for "Trending Collections".
//  * @param {object} props
//  * @param {string} props.title - The title for the collection (e.g., "Trending Collection").
//  * @param {Array} [props.data=DEMO_DATA] - An array of objects, each containing at least an 'id' and 'imageUrl'.
//  */
const TrendingCollectionSlider = ({ title="Trending Collection", data = DEMO_DATA }) => {
const { colors } = useTheme();
const { Tx,T, flex, fr, color, center, bg, fb, fm, fs, lh,mt,mb,br,mh } = useT();
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => console.log('Item pressed:', item.id)} 
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      {/* You can add text overlays here if your data includes titles for each image */}
      {/* <Text style={styles.cardTitle}>{item.title}</Text> */}
    </TouchableOpacity>
  );

  return (
    <View style={Tx(mt(20),mb(10),br(20),flex(1))}>
      {title && <Text style={T(fb(20),color(colors.secondary),mh(16),mb(10))}>{title}</Text>}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
    marginBottom: 15,
  },
  flatListContent: {
    paddingHorizontal: 16, // Padding on both sides of the slider
    paddingBottom: 10, // Space for shadow
  },
  cardContainer: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden', // Ensures image respects borderRadius
    marginRight: 15, // Spacing between cards
    backgroundColor: '#f0f0f0', // Placeholder background
    // Shadow properties
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  // If you wanted to add text on the image
  // cardTitle: {
  //   position: 'absolute',
  //   bottom: 10,
  //   left: 10,
  //   color: '#fff',
  //   fontSize: 16,
  //   fontWeight: 'bold',
  //   textShadowColor: 'rgba(0,0,0,0.7)',
  //   textShadowOffset: { width: 1, height: 1 },
  //   textShadowRadius: 2,
  // }
});

export default TrendingCollectionSlider;
