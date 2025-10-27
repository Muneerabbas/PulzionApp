import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useT } from '../../src/utils/tMiddleware'
import { useTheme } from '../../src/context/ThemeContext'
import * as WebBrowser from 'expo-web-browser';
const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.45;
const ITEM_HEIGHT = ITEM_WIDTH * 1.2;

const DEMO_DATA = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1570172619614-23395d852ad6?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Example image 1
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




const BottomSlider = ({ title="Trending Collection", data = DEMO_DATA }) => {
const { colors } = useTheme();
const { Tx,T, flex, fr, color, center, bg, fb, fm, fs, lh,mt,mb,br,mh,zi,ta,p} = useT();
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.cardContainer}
       onPress={async () => {
             if (item?.url) {
               try {
                 await WebBrowser.openBrowserAsync(item.url);
               } catch (e) {}
             }
           }}
      activeOpacity={0.8}
    >
      
  <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.text,
            opacity: 0.5, 
            zIndex:10
          },
        ]}
      />
          <View style={{justifyContent:'flex-end',alignItems:'center',flex:1}}>


              <Text
            numberOfLines={4}
            style={T(fb(14),color(colors.primary),lh(16),zi(10000),ta('center'),p(10),mb(18))}>{item?.title}</Text>
          </View>
      <Image
        source={{ uri: item?.urlToImage }}
         blurRadius={3}
        style={[styles.cardImage,StyleSheet.absoluteFillObject,]}
        resizeMode="cover"
      />

    </TouchableOpacity>
  );

  return (
    <View style={Tx(mt(20),mb(10),br(20),flex(1))}>
      {title && <Text style={T(fb(20),color(colors.secondary),mh(16),mb(10))}>{title}</Text>}
      <FlatList
        data={data}
        renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
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
    overflow: 'hidden',
    marginRight: 15,
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  
    
  },
 
});

export default BottomSlider;
