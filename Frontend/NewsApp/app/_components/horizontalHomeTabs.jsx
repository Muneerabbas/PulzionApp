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
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useT } from '../../src/utils/tMiddleware';
import Earth from '../../assets/icons/earth-europa.svg'
import BottomSlider from './bottomSliders';
import { getTopHeadlines,getBusinessNews,getEntertainmentNews,getSportsNews,getHealthNews,getScienceNews,getTechnologyNews, getBottomNews } from '../../src/api/newsApi';
import * as WebBrowser from 'expo-web-browser';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
// for trending
// const url = 'https://newsapi.org/v2/everything?q=trending&sortBy=popularity&language=en&apiKey=04cdd66f88014fed9689e01f257ea000';

const TABS = ['Top Headlines', 'Business', 'Entertainment', 'Sports', 'Health', 'Science', 'Technology'];












const HomeCard = ({item}) => {
  const { Tx, T, row, ai, ml, mr, fb, color, lh, fr, mt, jc, br, flex, p ,fs,fm,mv} = useT();
  const { colors, theme } = useTheme();




  return (
    <TouchableOpacity
      onPress={async () => {
        if (item?.url) {
          try {
            await WebBrowser.openBrowserAsync(item.url);
          } catch (e) {}
        }
      }}
            activeOpacity={0.8}

      style={styles.maincard}
    >
      {/* 🔹 Background Image */}
      <Image
        source={{uri:item?.urlToImage}}
        style={{position:'absolute',height:'100%',width:'100%',borderRadius:20,zIndex:-1}}
        resizeMode="cover"
      />
<TouchableOpacity onPress={()=>{}} style={{position:'absolute',top:10,right:10,zIndex:10}}>
<Ionicons name="bookmark-outline" size={24} color="white" style={{position:'absolute',top:10,right:10}}/>
</TouchableOpacity>

      {/* 🔹 Overlay */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.text,
            opacity: 0.7, 
            borderRadius: 20,
          },
        ]}
      />

      {/* 🔹 Card Content */}
      <View style={Tx(p(16), jc('flex-end'), br(20), flex(1))}>
        <Text style={[T(fb(20),color(colors.primary),lh(22),mv(10),)]}
        numberOfLines={4}
        >

{item?.title}
        </Text>

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
    </TouchableOpacity>
  );
};

const HomeCardskeleton = () => {
  const { Tx, T, row, ai, ml, mr, fb, color, lh, fr, mt, jc, br, flex, p ,fs,fm,ta,bg,h,w,bw,bc,} = useT();
  const { colors, theme } = useTheme();



  return (
        <View style={[styles.maincard,Tx(bg(colors.border),jc('flex-end'),p(16),bw(1),bc(colors.border))]}>
<View style={Tx(jc('center'),br(20),p(16),h(200),w('100%'),bg(colors.muted2))}>

</View>


        </View>
  );
};





export default function HorizontalTabs() {
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

const fetchTopHeadlines = async () => {
  setLoading(true);
  try {
    const response = await getTopHeadlines();
    setTopheadlines(response.articles);

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

const fetchBusinessNews = async () => {
  setLoading(true);
  try {
    const response = await getBusinessNews();
    setBusinessNews(response.articles);

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
  const fetchEntertainmentNews = async () => {
    setLoading(true);
    try {
      const response = await getEntertainmentNews();
      setEntertainmentNews(response.articles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchSportsNews = async () => {
    setLoading(true);
    try {
      const response = await getSportsNews();
      setSportsNews(response.articles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchHealthNews = async () => {
    setLoading(true);
    try {
      const response = await getHealthNews();
      setHealthNews(response.articles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchScienceNews = async () => {
    setLoading(true);
    try {
      const response = await getScienceNews();
      setScienceNews(response.articles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchTechnologyNews = async () => {
    setLoading(true);
    try {
      const response = await getTechnologyNews();
      setTechnologyNews(response.articles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
const fetchBottomNews = async () => {
    setLoading(true);
    try {
      const response = await getBottomNews({query:'india'});
      setTopheadlinesIndia(response.articles);
    const response2 = await getBottomNews({query:'usa'});
      setTopheadlinesUSA(response2.articles);

      const response3 = await getBottomNews({query:'startup'});
      setStartupNews(response3.articles);
      const response4 = await getBottomNews({query:'stock market'});
      setStockNews(response4.articles);
      const response5 = await getBottomNews({query:'movies'});
      setMoviesNews(response5.articles);
      const response6 = await getBottomNews({query:'music'});
      setMusicNews(response6.articles);
      const response7 = await getBottomNews({query:'gadgets'});
      setGadgetsNews(response7.articles);
      const response8 = await getBottomNews({query:'artificial intelligence'});
      setAiNews(response8.articles);
      const response9 = await getBottomNews({query:'science'});
      setPhysicsNews(response9.articles);
      const response10 = await getBottomNews({query:'space'});
      setSpaceNews(response10.articles);
      const response11 = await getBottomNews({query:'fitness'});
      setFitnessNews(response11.articles);
      const response12 = await getBottomNews({query:'body'});
      setBodyNews(response12.articles);
      const response13 = await getBottomNews({query:'cricket'});
      setCricketNews(response13.articles);
      const response14 = await getBottomNews({query:'football'});
      setFootballNews(response14.articles);
      

    
     




    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
 
    fetchTopHeadlines();
     fetchBusinessNews();
 
       fetchEntertainmentNews();
 
    fetchSportsNews();
 
    fetchHealthNews();
      fetchScienceNews();
    fetchTechnologyNews();
    fetchBottomNews();
    console.log(startupNews)

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

      {
        loading ? <HomeCardskeleton/> :<View style={styles.body}>

<FlatList
          data={activeTab==0?topheadlines:activeTab==1?businessNews:activeTab==2?entertainmentNews:activeTab==3?sportsNews:activeTab==4?healthNews:activeTab==5?scienceNews:technologyNews}
          renderItem={({ item }) => loading ? <HomeCardskeleton/> : <HomeCard item={item}/>}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + ITEM_SPACING}
          snapToAlignment="center"
          contentContainerStyle={{ paddingHorizontal: (screenWidth - CARD_WIDTH) / 2 }}
          ItemSeparatorComponent={() => <View style={{ width: ITEM_SPACING }} />}
          getItemLayout={(data, index) => ({
            length: CARD_WIDTH + ITEM_SPACING,
            offset: (CARD_WIDTH + ITEM_SPACING) * index,
            index,
          })}
        />
        
         <BottomSlider title={`${activeTab==0?'India':activeTab==1?'Startup':activeTab==2?'Movies':activeTab==3?'Cricket':activeTab==4?'Human Body':activeTab==5?'Physics':'Ai'}`}  data={activeTab==0?topheadlinesIndia:activeTab==1?startupNews:activeTab==2?moviesNews:activeTab==3?cricketNews:activeTab==4?bodyNews:activeTab==5?physicsNews:aiNews}/>
                 <BottomSlider title={`${activeTab==0?'USA':activeTab==1?'Stock Market':activeTab==2?'Music':activeTab==3?'Football':activeTab==4?'Fitness':activeTab==5?'Space':'Gadgets'}`}  data={activeTab==0?topheadlinesUSA:activeTab==1?stockNews:activeTab==2?musicNews:activeTab==3?footballNews:activeTab==4?fitnessNews:activeTab==5?spaceNews:gadgetsNews}/>

      </View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
