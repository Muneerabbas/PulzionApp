import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  StyleSheet,
  Image,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useT } from '../../src/utils/tMiddleware';
import Earth from '../../assets/icons/earth-europa.svg'
import TrendingCollectionSlider from './bottomSliders';
const TABS = ['Trending', 'My topic', 'Local news', 'Sports', 'Good news', ];

const HomeCard = () => {
  const { Tx, T, row, ai, ml, mr, fb, color, lh, fr, mt, jc, br, flex, p ,fs,fm} = useT();
  const { colors, theme } = useTheme();

  return (
    <View style={styles.maincard}>
      {/* 🔹 Background Image */}
      <Image
        source={require('../../assets/user.png')}
        style={{position:'absolute',height:'100%',width:'100%',borderRadius:20,zIndex:-1}}
        resizeMode="cover"
      />

      {/* 🔹 Overlay */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.secondary,
            opacity: 0.4, // adjust transparency
            borderRadius: 20,
          },
        ]}
      />

      {/* 🔹 Card Content */}
      <View style={Tx(p(16), jc('flex-end'), br(20), flex(1))}>
        <Text style={[T(fs(20),color(colors.primary),lh(20))]}>
          Component functionality intact. This process might take a few moments.
        </Text>

        <View style={Tx(row, ai('center'), 'jc-space-between', mt(16))}>
          {/* Logo And Company */}
          <View style={T(row, ai('center'), ml(8))}>
            {theme === 'dark' ? (
              <Earth height={22} width={22} fill={'#42adff'} style={[T(mr(5))]} />
            ) : (
              <Earth height={22} width={22} fill={'#42adff'} style={[T(mr(5))]} />
            )}

            <View>
              <Text style={T(fb(12), color(colors.primary), lh(12))}>News</Text>
              <Text style={T(fb(12), color(colors.primary), lh(12))}>Pulse</Text>
            </View>
          </View>

          <Text style={T(fr(12), color(colors.primary))}>12h ago</Text>
        </View>
      </View>
    </View>
  );
};


export default function HorizontalTabs() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const aniValue = useRef(new Animated.Value(0)).current;

  const handlePress = (index) => {
    setActiveTab(index);
    Animated.timing(aniValue, {
      toValue: index,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const tabWidth = 100;
  const translateX = aniValue.interpolate({
    inputRange: [0, TABS.length - 1],
    outputRange: [0, tabWidth * (TABS.length - 1)],
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.primary }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={{marginBottom:15}}
      >
        {TABS.map((title, i) => (
          <TouchableOpacity
            key={title}
            onPress={() => handlePress(i)}
            style={[styles.tab, { width: tabWidth }]}
          >
            <Text
              style={[
                styles.text,
                {
                  color: activeTab === i ? colors.secondary : colors.muted,
                },
              ]}
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
              width: tabWidth * 0.3,
              transform: [{ translateX }],
              left: tabWidth * 0.2,
            },
          ]}
        />
      </ScrollView>

      <View style={styles.body}>
    
        <HomeCard/>
                <TrendingCollectionSlider title={`${TABS[activeTab]} Cars`}/>
        <TrendingCollectionSlider/>
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {  position: 'relative' },
  tab: { alignItems: 'center', paddingVertical: 8 },
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
width:'90%',
borderRadius:20,
// padding:16,
// backgroundColor:'red',
overflow:'hidden',

  }
,title:{
    fontSize:20,
    fontFamily:'MonaSans-Bold',
    color:'white',
   
}
});
