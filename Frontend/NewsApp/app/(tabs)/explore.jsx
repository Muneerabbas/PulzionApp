import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext'; 
import TrendingTopics from '../_components/trendingTopics';
import { LinearGradient } from 'expo-linear-gradient';
import { getStockQuote } from '../../src/api/stocksApi';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
const Explore = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
    const scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
   

  const headerHeight = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [60, 0],
      Extrapolate.CLAMP
    );
    const marginBottom = interpolate(
      scrollY.value,
      [0, 100],
      [20, 0],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [0, 60],
      [1, 0],
      Extrapolate.CLAMP
    );
    return {
      height,
      marginBottom,
      opacity,
    };
  });
  

const topCompanies = [
 {  sym: "AAPL",name: "Apple"      },    
 {  sym: "GOOGL",name: "Google"     },     
 {  sym: "MSFT",name: "Microsoft"   },      
 {  sym: "AMZN",name: "Amazon"    },    
 {  sym: "META",name: "Meta"     },     
 {  sym: "TSLA",name: "Tesla"      },      
 {  sym: "NFLX",name: "Netflix"    },       
 {  sym: "INFY",name: "Infosys"    },     
];
  const [stocks, setStocks] = useState([]);
  const [searchMode, setSearchMode] = useState('Search');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

const fetchAllStocks = async () => {
  try {
    const results = await Promise.all(
      topCompanies.map(async (company) => {
        const stockData = await getStockQuote(company.sym);
        return {
          name: company.name,
          sym: company.sym,
          ...stockData,
        };
      })
    );
    setStocks(results); 
    console.log(results);
  } catch (error) {
    console.error("Error fetching stocks:", error);
  }
};


   useEffect(() => {
    
    fetchAllStocks();
  },[]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}> 
     
      <Animated.View style={[styles.header,headerHeight]}>
        <View>
          <View style={{flexDirection:'row',gap:5}}>
<Text style={[styles.greeting, { color: colors.text }]}>
            Hello
          </Text>
            <Text style={[styles.greeting, { color: colors.text,fontFamily:"MonaSans-Regular" }]}>
            {user?.username || 'User'}
          </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            I have some news for you
          </Text>
        </View>

        <TouchableOpacity
  style={[styles.profileBtn, { backgroundColor: colors.card }]}
>
  <Image
    source={
      user?.photo
        ? { uri: user.photo }
        : require('../../assets/images/default-avatar.png')
    }
    style={styles.avatar}
    resizeMode="cover"  
  />
</TouchableOpacity>

      </Animated.View>
      <Animated.View
        style={[
          styles.searchBar,
          { backgroundColor: colors.tabbarbg, borderColor: colors.border },
        ]}
      >
        <Icon
          name="search-outline"
          size={20}
          color={colors.muted}
          style={{ marginHorizontal: 8 }}
        />
        <TextInput
          placeholder='Search here'
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
        />
        <View>
          <TouchableOpacity
            onPress={() => setIsDropdownOpen((v) => !v)}
            style={[styles.dropdown, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.dropdownText, { color: colors.text }]}>
              {searchMode}
            </Text>
            <MaterialIcons
              name={isDropdownOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          {isDropdownOpen && (
            <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border,zIndex:3 }]}> 
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => { setSearchMode('Search'); setIsDropdownOpen(false); }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>Search</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => { setSearchMode('🤓 Smart Search'); setIsDropdownOpen(false); }}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>🤓 Smart Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>


       <Animated.ScrollView 
        style={[{ flex: 1 }]}
        contentContainerStyle={{ paddingBottom: 150 }} 
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      > 
<TrendingTopics/>
      {/* Sentiment legend*/}
      <View style={[styles.cardWrap, { backgroundColor: colors.border, borderColor: colors.border }]}> 
        <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Sentiment spectrum</Text>
        <LinearGradient
          colors={[ '#ef4444', '#9ca3af', '#22c55e' ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradientBar}
        />
        <View style={styles.legendRow}>
          <Text style={[styles.legendText, { color: colors.text }]}>Negative</Text>
          <Text style={[styles.legendText, { color: colors.text }]}>Neutral</Text>
          <Text style={[styles.legendText, { color: colors.text }]}>Positive</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.muted }]}>Negative</Text>
          <Text style={[styles.summaryValue, { color: colors.secondary }]}>32</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.muted }]}>Neutral</Text>
          <Text style={[styles.summaryValue, { color: colors.secondary }]}>58</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.muted }]}>Positive</Text>
          <Text style={[styles.summaryValue, { color: colors.secondary }]}>44</Text>
        </View>
      </View>
      
      <View style={[styles.cardWrap, { backgroundColor: colors.border, borderColor: colors.border }]}> 
        <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Top companies</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
          {stocks.map((c, i) => (
            <View key={c.sym} style={[styles.stockCard, { backgroundColor: colors.tabbarbg, borderColor: colors.border }]}>
              <View style={styles.stockHeader}>
                <Text style={[styles.stockSym, { color: colors.secondary }]}>{c?.name}</Text>
                <View style={[styles.badge, { backgroundColor: c?.dp > 0 ? '#16a34a' : '#dc2626' }]}>
                  <Text style={styles.badgeText}>{c?.dp.toFixed(2)} %</Text>
                </View>
              </View>
              <Text style={[styles.stockName, { color: colors.muted }]}>{c?.sym}</Text>
              <Text style={[styles.stockPrice, { color: colors.text }]}>$ {c?.c.toFixed(2)}</Text>
              <View style={styles.sparkRow}>
                  <View
                    style={[
                      
                      { height: 50, backgroundColor: c?.dp > 0 ? '#16a34a' : '#dc2626', },
                    ]}
                  />
             
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
          </Animated.ScrollView>

    </SafeAreaView>
  );
};

export default Explore;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontFamily:"MonaSans-Bold"
  },
  subtitle: {
    fontSize: 14,
    fontFamily:"MonaSans-Regular"
  },
 profileBtn: {
  height: 45,
  width: 45,
  borderRadius: 22.5,
  overflow: 'hidden',
  justifyContent: 'center',
  alignItems: 'center',
},
avatar: {
  width: '100%',
  borderWidth:1,
  height: '100%',
  borderRadius: 22.5,
},

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    marginBottom:20,
    position: 'relative',
    overflow: 'visible',
    zIndex: 20,
  },
  input: {
    flex: 1,
    fontFamily:"MonaSans-Regular",
    fontSize: 15,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 40,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dropdownText: {
    fontSize: 14,
    marginRight: 2,
    fontFamily:"MonaSans-Regular"
  },
  dropdownMenu: {
    position: 'absolute',
    top: 42,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 140,
    zIndex: 30,
    elevation: 30,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: 'MonaSans-Regular',
  },
  cardWrap: {
    marginTop: 12,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'MonaSans-Bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  gradientBar: {
    height: 14,
    borderRadius: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'MonaSans-Regular',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: 'MonaSans-Regular',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'MonaSans-Bold',
  },
  /* Stocks */
  stockCard: {
    width: 150,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 6,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockSym: {
    fontSize: 14,
    fontFamily: 'MonaSans-Bold',
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontFamily: 'MonaSans-Bold',
  },
  stockName: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'MonaSans-Regular',
  },
  stockPrice: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 18,
    fontFamily: 'MonaSans-Bold',
  },
});
