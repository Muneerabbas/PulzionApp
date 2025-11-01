import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  // FIX: Make sure RefreshControl is imported
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useT } from '../../src/utils/tMiddleware';
import Earth from '../../assets/icons/earth-europa.svg'
import BottomSlider from './bottomSliders';
import { getTopHeadlines,getBusinessNews,getEntertainmentNews,getSportsNews,getHealthNews,getScienceNews,getTechnologyNews, getBottomNews } from '../../src/api/newsApi';
import * as WebBrowser from 'expo-web-browser';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { useBookmarks } from '../../src/context/BookmarkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
const TABS = ['Top Headlines', 'Business', 'Entertainment', 'Sports', 'Health', 'Science', 'Technology'];












const HomeCard = ({item}) => {
  const { Tx, T, row, ai, ml, mr, fb, color, lh, fr, mt, jc, br, flex, p ,fs,fm,mv} = useT();
  const { colors, theme } = useTheme();
const { toggleBookmark,isBookmarked,addBookmark,removeBookmark } = useBookmarks();




  return (
    <View
      style={styles.maincard}
    >
      {/* 🔹 Background Image */}
      <Image
        source={{uri:item?.urlToImage}}
        style={{position:'absolute',height:'100%',width:'100%',borderRadius:20,zIndex:-1}}
        resizeMode="cover"
      />
<TouchableOpacity onPress={()=>{toggleBookmark(item)}} style={{position:'absolute',top:10,right:10,zIndex:10}}>
<Ionicons name={isBookmarked(item.url)?"bookmark" :"bookmark-outline"} size={30} color= {colors.primary} style={{position:'absolute',top:10,right:5}}/>
</TouchableOpacity>

      {/* 🔹 Overlay */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.text,
            opacity: 0.5, 
            borderRadius: 20,
          },
        ]}
      />

      {/* 🔹 Card Content */}
      <View style={Tx(p(16), jc('flex-end'), br(20), flex(1))}>
        <TouchableOpacity
          onPress={async () => {
            if (item?.url) {
              try {
                await WebBrowser.openBrowserAsync(item.url);
              } catch (e) {}
            }
          }}
          activeOpacity={0.7}
           onLongPress={() => Alert.alert("Long Press!", "You held the button")}
        delayLongPress={500}
        >
          <Text style={[T(fb(20),color(colors.primary),lh(22),mv(10),),{zIndex:10}]}
            numberOfLines={4}
          >
            {item?.title}
          </Text>
        </TouchableOpacity>

        <View style={Tx(row, ai('center'), 'jc-space-between', mt(16))}>
          {/* Logo And Company */}
          <View style={T(row, ai('center'), ml(8))}>
            

            <View>
              <Text style={T(fb(12), color(colors.primary),lh(12))} >{item?.source?.name.split(' ')[0]}</Text>
              {
                item?.source?.name.split(' ')[1] &&<View style={T(row, ai('center'))}>

                  <Text style={T(fb(12), color(colors.primary),lh(14))} >{item?.source?.name.split(' ')[1]}</Text>
<Text style={T(fb(12), color(colors.primary),lh(12))} >{" "}{item?.source?.name.split(' ')[2]}</Text>
</View>

            }


            </View>
          </View>

          <Text style={T(fr(12), color(colors.primary))}>{dayjs(item?.publishedAt).format('DD MMM YYYY')}</Text>
        </View>
                        {/* <Text style={T(fr(12), color(colors.primary),ta('center'))}>Author {item?.author}</Text> */}

      </View>
    </View>
  );
};

const HomeCardskeleton = () => {
  const { Tx, T, jc, br, p, bg, h, w, mt } = useT();
  const { colors } = useTheme();
  return (
    <View style={[styles.maincard, Tx(bg(colors.border), p(16), br(20))]}>
      <View style={Tx(br(16), h(220), w('100%'), bg(colors.muted2))} />
      <View style={Tx(mt(12), br(8), h(14), w('85%'), bg(colors.muted2))} />
      <View style={Tx(mt(8), br(8), h(14), w('55%'), bg(colors.muted2))} />
    </View>
  );
};



const CACHE_DURATION =60 * 60 * 1000;
export default function HorizontalTabs() {

  const [refreshing, setRefreshing] = useState(false);

const [topheadlines, setTopheadlines] = useState([]);
const [businessNews, setBusinessNews] = useState([]);
const [entertainmentNews, setEntertainmentNews] = useState([]);
const [sportsNews, setSportsNews] = useState([]);
const [healthNews, setHealthNews] = useState([]);
const [scienceNews, setScienceNews] = useState([]);
const [technologyNews, setTechnologyNews] = useState([]);


const [topheadlinesIndia, setTopheadlinesIndia] = useState([]);
const [ topheadlinesUSA, setTopheadlinesUSA] = useState([]);



const [startupNews, setStartupNews] = useState([]);
const [stockNews, setStockNews] = useState([]);

const [moviesNews, setMoviesNews] = useState([]);
const [musicNews, setMusicNews] = useState([]);
// const [gamesNews, setGamesNews] = useState([]);

const [cricketNews, setCricketNews] = useState([]);
const [footballNews, setFootballNews] = useState([]);
// const [tennisNews, setTennisNews] = useState([]);



const [bodyNews, setBodyNews] = useState([]);
const [fitnessNews, setFitnessNews] = useState([]);

const [spaceNews, setSpaceNews] = useState([]);
const [physicsNews, setPhysicsNews] = useState([]);


const [gadgetsNews, setGadgetsNews] = useState([]);
const [aiNews, setAiNews] = useState([]);



const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

// --- START: Cache & Fetch Logic ---
  const saveCache = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({ data, time: Date.now() }));
    } catch (e) {}
  };
  const loadCache = async (key) => {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      // Backward-compat: if previous code stored the array directly
      if (Array.isArray(obj)) return obj;
      if (obj && obj.time && obj.data && obj.time + CACHE_DURATION > Date.now()) {
        return obj.data;
      }
      return null;
    } catch (e) {
      return null;
    }
  };
// --- END: Cache & Fetch Logic ---


const fetchTopHeadlines = async () => {
  try {
    const cached = await loadCache('topheadlines');
    if (cached) {
      setTopheadlines(cached);
      return;
    }
    const response = await getTopHeadlines();
    setTopheadlines(response.articles);
    await saveCache('topheadlines', response.articles);
  } catch (err) {
    setError(err.message);
  } finally {}
};

const fetchBusinessNews = async () => {
  try {
    const cached = await loadCache('businessNews');
    if (cached) {
      setBusinessNews(cached);
      return;
    }
    const response = await getBusinessNews();
    setBusinessNews(response.articles);
    await saveCache('businessNews', response.articles);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
  const fetchEntertainmentNews = async () => {
    try {
      const cached = await loadCache('entertainmentNews');
      if (cached) {
        setEntertainmentNews(cached);
        return;
      }
      const response = await getEntertainmentNews();
      setEntertainmentNews(response.articles);
      await saveCache('entertainmentNews', response.articles);
    } catch (err) {
      setError(err.message);
    } finally {}
  };
  const fetchSportsNews = async () => {
    try {
      const cached = await loadCache('sportsNews');
      if (cached) {
        setSportsNews(cached);
        return;
      }
      const response = await getSportsNews();
      setSportsNews(response.articles);
      await saveCache('sportsNews', response.articles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchHealthNews = async () => {
    try {
      const cached = await loadCache('healthNews');
      if (cached) {
        setHealthNews(cached);
        return;
      }
      const response = await getHealthNews();
      setHealthNews(response.articles);
      await saveCache('healthNews', response.articles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchScienceNews = async () => {
    try {
      const cached = await loadCache('scienceNews');
      if (cached) {
        setScienceNews(cached);
        return;
      }
      const response = await getScienceNews();
      setScienceNews(response.articles);
      await saveCache('scienceNews', response.articles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchTechnologyNews = async () => {
    try {
      const cached = await loadCache('technologyNews');
      if (cached) {
        setTechnologyNews(cached);
        return;
      }
      const response = await getTechnologyNews();
      setTechnologyNews(response.articles);
      await saveCache('technologyNews', response.articles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
const fetchBottomNews = async () => {
    try {
      const ensure = async (key, query, setter) => {
        const cached = await loadCache(key);
        if (cached) {
          setter(cached);
          return;
        }
        const resp = await getBottomNews({ query });
        setter(resp.articles);
        await saveCache(key, resp.articles);
      };

      await Promise.allSettled([
        ensure('bottom_india', 'india', setTopheadlinesIndia),
        ensure('bottom_usa', 'usa', setTopheadlinesUSA),
        ensure('bottom_startup', 'startup', setStartupNews),
        ensure('bottom_stock', 'stock market', setStockNews),
        ensure('bottom_movies', 'movies', setMoviesNews),
        ensure('bottom_music', 'music', setMusicNews),
        ensure('bottom_gadgets', 'gadgets', setGadgetsNews),
        ensure('bottom_ai', 'artificial intelligence', setAiNews),
        ensure('bottom_science', 'science', setPhysicsNews),
        ensure('bottom_space', 'space', setSpaceNews),
        ensure('bottom_fitness', 'fitness', setFitnessNews),
        ensure('bottom_medical', 'medical', setBodyNews),
        ensure('bottom_cricket', 'cricket', setCricketNews),
        ensure('bottom_football', 'football', setFootballNews),
      ]);
      

    } catch (err) {
      setError(err.message);
    } finally {}
  };

// FIX: handleRefresh function moved inside the component to access state setters and other functions
const handleRefresh = async () => {
  setRefreshing(true);
  try {
    // A simplified approach for refresh: just force-fetch everything again
    // In a real app, you might only clear the cache for the currently active tab
    await Promise.allSettled([
      fetchTopHeadlines(),
      fetchBusinessNews(),
      fetchEntertainmentNews(),
      fetchSportsNews(),
      fetchHealthNews(),
      fetchScienceNews(),
      fetchTechnologyNews(),
      fetchBottomNews(), 
    ]);
  } catch (e) {
    console.warn('Refresh failed:', e);
  } finally {
    setRefreshing(false);
  }
};


useEffect(() => {
  const init = async () => {
    setLoading(true);
    try {
      await Promise.allSettled([
        fetchTopHeadlines(),
        fetchBusinessNews(),
        fetchEntertainmentNews(),
        fetchSportsNews(),
        fetchHealthNews(),
        fetchScienceNews(),
        fetchTechnologyNews(),
        fetchBottomNews(),
      ]);
    } finally {
      setLoading(false);
    }
  };
  init();
},[]);




  const { colors } = useTheme();
  const aniValue = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const containerLayouts = useRef([]); // per-tab container layout (x, width)
  const textLayouts = useRef([]); // per-tab text layout (x, width inside container)
  const [layoutTick, setLayoutTick] = useState(0); // force re-render when layouts update
  

  const handlePress = (index) => {
    setActiveTab(index);
    Animated.timing(aniValue, {
      toValue: index,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // center the pressed tab
    const { width: screenWidth } = Dimensions.get('window');
    const c = containerLayouts.current[index];
    if (c && scrollRef.current) {
      const last = containerLayouts.current[TABS.length - 1];
      const contentWidth = last ? last.x + last.width : TABS.length * 100;
      const target = Math.max(0, Math.min(c.x + c.width / 2 - screenWidth / 2, Math.max(0, contentWidth - screenWidth)));
      try {
        scrollRef.current.scrollTo({ x: target, animated: true });
      } catch (e) {
        // no-op
      }
    }
  };

  const tabWidth = 100;
  const inputRange = TABS.map((_, i) => i);
  const indicatorLeft = aniValue.interpolate({
    inputRange,
    outputRange: inputRange.map((i) => {
      const c = containerLayouts.current[i];
      const t = textLayouts.current[i];
      if (c && t) return c.x + t.x; // text absolute x inside scroll content
      return i * tabWidth + tabWidth * 0.2; // fallback
    }),
    extrapolate: 'clamp',
  });

  const indicatorWidth = aniValue.interpolate({
    inputRange,
    outputRange: inputRange.map((i) => {
      const t = textLayouts.current[i];
      if (t) return Math.max(12, t.width);
      return tabWidth * 0.6; // fallback
    }),
    extrapolate: 'clamp',
  });

  // Card carousel sizing
  const { width: screenWidth } = Dimensions.get('window');
  const CARD_WIDTH = 300; // matches styles.maincard.width
  const ITEM_SPACING = 16;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.primary }]}>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: 12 }]}
        style={{marginBottom:15}}
        ref={scrollRef}
      >
        {TABS.map((title, i) => (
          <TouchableOpacity
            key={title}
            onPress={() => handlePress(i)}
            style={[styles.tab, { width: tabWidth }]}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              containerLayouts.current[i] = { x, width };
              setLayoutTick((t) => t + 1);
            }}
          >
            <Text
              style={[
                styles.text,
                {
                  color: activeTab === i ? colors.secondary : colors.muted,
                },
              ]}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                textLayouts.current[i] = { x, width };
                setLayoutTick((t) => t + 1);
              }}
            >
              {title}
            </Text>
          </TouchableOpacity>
        ))}

        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: colors.secondary,
              width: indicatorWidth,
              transform: [{ translateX: indicatorLeft }],
            },
          ]}
        />
      </ScrollView>

{/* FIX: Use the 'refreshControl' prop with the RefreshControl component */}
<ScrollView
    style={{flex: 1}} 
    refreshControl={
        <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            tintColor={colors.secondary} // Use theme color for the spinner
        />
    }
>
      {
        loading ? (
          <FlatList
            data={[0,1,2,3,4]}
            renderItem={() => <HomeCardskeleton/>}
            keyExtractor={(item) => `skeleton-${item}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + ITEM_SPACING}
            snapToAlignment="center"
            contentContainerStyle={{ paddingHorizontal: (screenWidth - CARD_WIDTH) / 6 }}
            ItemSeparatorComponent={() => <View style={{ width: ITEM_SPACING }} />}
              
            getItemLayout={(data, index) => ({
              length: CARD_WIDTH + ITEM_SPACING,
              offset: (CARD_WIDTH + ITEM_SPACING) * index,
              index,
            })}
          />
        ) : (
        <View style={styles.body}>

<FlatList
          data={activeTab==0?topheadlines:activeTab==1?businessNews:activeTab==2?entertainmentNews:activeTab==3?sportsNews:activeTab==4?healthNews:activeTab==5?scienceNews:technologyNews}
          renderItem={({ item }) =>  <HomeCard item={item}/>}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + ITEM_SPACING}
          snapToAlignment="center"
          contentContainerStyle={{ paddingHorizontal: (screenWidth - CARD_WIDTH) / 6 }}
          ItemSeparatorComponent={() => <View style={{ width: ITEM_SPACING }} />}
          getItemLayout={(data, index) => ({
            length: CARD_WIDTH + ITEM_SPACING,
            offset: (CARD_WIDTH + ITEM_SPACING) * index,
            index,
          })}
        />
        
          <BottomSlider title={`${activeTab==0?'India':activeTab==1?'Startup':activeTab==2?'Movies':activeTab==3?'Cricket':activeTab==4?'Medical Science':activeTab==5?'Physics':'Artificial Intelligence'}`}  data={activeTab==0?topheadlinesIndia:activeTab==1?startupNews:activeTab==2?moviesNews:activeTab==3?cricketNews:activeTab==4?bodyNews:activeTab==5?physicsNews:aiNews}/>
              <BottomSlider title={`${activeTab==0?'USA':activeTab==1?'Stock Market':activeTab==2?'Music':activeTab==3?'Football':activeTab==4?'Fitness':activeTab==5?'Space':'Gadgets'}`}  data={activeTab==0?topheadlinesUSA:activeTab==1?stockNews:activeTab==2?musicNews:activeTab==3?footballNews:activeTab==4?fitnessNews:activeTab==5?spaceNews:gadgetsNews}/>

        </View>)}
</ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 ,paddingBottom:100},
  scroll: {  position: 'relative' },
  tab: { alignItems: 'center', paddingVertical: 10 },
  text: { fontSize: 14, fontFamily: 'MonaSans-SemiBold' },
  indicator: {
    height: 3,
    position: 'absolute',
    bottom: 0,
    borderRadius: 3,
  },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  maincard:{
height:400,
width:300,
borderRadius:20,

overflow:'hidden',

  }
,title:{
    fontSize:20,
    fontFamily:'MonaSans-Bold',
    color:'white',
    
}
});