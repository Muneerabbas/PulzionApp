import React from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext'; 
import TrendingTopics from '../_components/trendingTopics';

const Explore = () => {
  const { user } = useAuth();
  const { colors } = useTheme();    

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Hello {user?.username || 'User'}
          </Text>
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
            Author
          </Text>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>
<TrendingTopics/>
      
    </SafeAreaView>
  );
};

export default Explore;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
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
  },
});
