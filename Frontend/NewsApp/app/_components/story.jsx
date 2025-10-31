import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getAllNews } from '../../src/api/newsApi';

const { width, height } = Dimensions.get('window');

export default function Stories() {
  const [news, setNews] = useState([]);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  const fetchNews = async () => {
    try {
      const res = await getAllNews();
      const items = res?.data?.articles || [];
      setNews(items);
    } catch (err) {
      setNews([]);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (news.length === 0) return;
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          nextStory();
          return 0;
        }
        return p + 0.01;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [current, news]);

  const nextStory = () => {
    if (current < news.length - 1) {
      setCurrent(current + 1);
      setProgress(0);
    }
  };

  const prevStory = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setProgress(0);
    }
  };

  if (news.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#fff' }}>Loading stories...</Text>
      </View>
    );
  }

  const currentStory = news[current];

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        onPress={(e) => {
          const x = e.nativeEvent.locationX;
          if (x < width / 2) prevStory();
          else nextStory();
        }}
      >
        <View style={styles.storyContainer}>
          {currentStory?.urlToImage && (
            <Image
              source={{ uri: currentStory.urlToImage }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          

         
         
         <View
         style={{marginBottom:40}}
         >
             <Text style={styles.title}>
            {currentStory?.description || 'No title available'}
          </Text>
          
          <TouchableOpacity 
          onPress={()=>{
            WebBrowser.openBrowserAsync(currentStory.url);
          }}
          style={styles.readMore}
          >
            <Text style={{fontFamily:"MonaSans-SemiBold"}}>Read More</Text>
          </TouchableOpacity>
         </View>
<View style={styles.overlay}/>

        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  storyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width, height, position: 'absolute' },
  progressContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 40,
    width: width - 20,
    alignSelf: 'center',
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
    borderRadius: 3,
  },
  progress: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    width,
    height,
    backgroundColor:'rgba(0,0,0,0.5)'
  },
  title: {
zIndex:11,   
    color: 'white',
    textAlignVertical:'bottom',
    flex:1,
fontFamily:"MonaSans-Medium",
    fontSize: 16,
    padding:10,
    // paddingBottom:100,
    textAlign:'center'
  },
  readMore:{
   
    zIndex:31,
    backgroundColor:'white',
    padding:10,
    margin:20,
    borderRadius:12,
    alignItems:'center',
    justifyContent:'center'
  }
});
