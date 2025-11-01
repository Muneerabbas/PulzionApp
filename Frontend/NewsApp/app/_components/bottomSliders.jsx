import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useT } from '../../src/utils/tMiddleware'
import { useTheme } from '../../src/context/ThemeContext'
import * as WebBrowser from 'expo-web-browser';
import { useBookmarks } from '../../src/context/BookmarkContext';
import { Ionicons } from '@expo/vector-icons';
import { useBottomSheet } from '../../src/context/bottomSheetContext';
const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.45;
const ITEM_HEIGHT = ITEM_WIDTH * 1.2;




const BottomSlider = ({ title="Trending Collection", data }) => {
const { colors } = useTheme();
const { openSheet } = useBottomSheet();
const { toggleBookmark,isBookmarked } = useBookmarks();
const { Tx,T, flex, fr, color, center, bg, fb, fm, fs, lh,mt,mb,br,mh,zi,ta,p} = useT();
  const renderItem = ({ item }) => (
    <View
      style={styles.cardContainer}
    >
      
  <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.text,
            opacity: 0.8, 
            zIndex: 1
          },
        ]}
      />
          <View style={{justifyContent:'flex-end',alignItems:'center',flex:1}}>


              <TouchableOpacity
                onPress={async () => {
                  if (item?.url) {
                    try {
openSheet(item)
                    } catch (e) {}
                  }
                }}
                activeOpacity={0.6}
                style={{ zIndex: 2 }}
              >
                <Text
                  numberOfLines={4}
                  style={T(fb(14),color(colors.primary),lh(16),zi(4),ta('center'),p(10),mb(18))}>{item?.title}
                </Text>
              </TouchableOpacity>
          </View>
      <Image
        pointerEvents="none"
        source={{ uri: item?.urlToImage }}
         blurRadius={3}
        style={[styles.cardImage,StyleSheet.absoluteFillObject,]}
        resizeMode="cover"
      />
<TouchableOpacity onPress={()=>{toggleBookmark(item)}} style={{position:'absolute',top:10,right:10,zIndex:10}}>
<Ionicons name={isBookmarked(item.url) ? "bookmark" : "bookmark-outline"} size={22} color= {colors.primary}/>
</TouchableOpacity>
    </View>
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
