import React from 'react';
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

const Explore = () => {
  const { user } = useAuth();
  const { colors } = useTheme();    

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}> 
      <ScrollView 
        style={[{ flex: 1 }]} 
        contentContainerStyle={{ paddingBottom: 150 }} 
        showsVerticalScrollIndicator={false}
      > 
      <View style={styles.header}>
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

      </View>

      <View
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
          placeholder="Search here"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
        />
        <TouchableOpacity
          style={[styles.dropdown, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.dropdownText, { color: colors.text }]}>
            Search
          </Text>
          <MaterialIcons
            name="keyboard-arrow-right"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>
<TrendingTopics/>
      {/* Sentiment legend (static UI) */}
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

      {/* Static summary cards (placeholder UI) */}
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
      
      {/* Top companies (UI only) */}
      <View style={[styles.cardWrap, { backgroundColor: colors.border, borderColor: colors.border }]}> 
        <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Top companies</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
          {[
            { sym: 'AAPL', name: 'Apple', price: '226.34', chg: '+1.2%', up: true },
            { sym: 'MSFT', name: 'Microsoft', price: '428.17', chg: '+0.6%', up: true },
            { sym: 'GOOGL', name: 'Alphabet', price: '176.22', chg: '-0.4%', up: false },
            { sym: 'AMZN', name: 'Amazon', price: '182.09', chg: '+0.9%', up: true },
            { sym: 'TSLA', name: 'Tesla', price: '208.51', chg: '-1.8%', up: false },
            { sym: 'META', name: 'Meta', price: '501.66', chg: '+0.3%', up: true },
          ].map((c, i) => (
            <View key={c.sym} style={[styles.stockCard, { backgroundColor: colors.tabbarbg, borderColor: colors.border }]}>
              <View style={styles.stockHeader}>
                <Text style={[styles.stockSym, { color: colors.secondary }]}>{c.sym}</Text>
                <View style={[styles.badge, { backgroundColor: c.up ? '#16a34a' : '#dc2626' }]}>
                  <Text style={styles.badgeText}>{c.chg}</Text>
                </View>
              </View>
              <Text style={[styles.stockName, { color: colors.muted }]}>{c.name}</Text>
              <Text style={[styles.stockPrice, { color: colors.text }]}>{c.price}</Text>
              <View style={styles.sparkRow}>
                {Array.from({ length: 16 }).map((_, j) => (
                  <View
                    key={`${c.sym}-${j}`}
                    style={[
                      styles.sparkBar,
                      { height: 4 + (((j + (c.up ? 1 : 3)) % 6) * 2), backgroundColor: c.up ? '#16a34a' : '#dc2626' },
                    ]}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      
    </ScrollView>
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
    width: 160,
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
