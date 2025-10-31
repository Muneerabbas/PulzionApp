import React from 'react'
import { View, Text, FlatList, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useBookmarks } from '../../src/context/BookmarkContext'
import { useTheme } from '../../src/context/ThemeContext'
import dayjs from 'dayjs'
import { Ionicons } from '@expo/vector-icons'
import * as WebBrowser from 'expo-web-browser';
import Stories from '../_components/story'

const { width } = Dimensions.get('window')

const bookmark = () => {
  const { bookmarks, removeBookmark } = useBookmarks()
  const { colors } = useTheme()

  const renderItem = ({ item }) => (
    <TouchableOpacity
    onPress={() => WebBrowser.openBrowserAsync(item?.url)}
    style={[styles.card, { backgroundColor: colors.border }]}> 
      <Image source={{ uri: item?.urlToImage }} style={styles.thumb} resizeMode="cover" />
      <View style={styles.info}>
        <Text numberOfLines={3} style={[styles.title, { color: colors.secondary }]}>{item?.title || 'Untitled'}</Text>
        <Text style={[styles.meta, { color: colors.text }]}>
          {item?.source?.name ? item.source.name : 'Unknown'} • {item?.publishedAt ? dayjs(item.publishedAt).format('DD MMM YYYY') : ''}
        </Text>
      </View>
      <TouchableOpacity onPress={() => removeBookmark(item?.url)} style={styles.action}>
        <Ionicons name="bookmark" size={22} color={colors.accent || colors.text} />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}> 
        <View style={styles.emptyWrap}>
          <Ionicons name="bookmark-outline" size={48} color={colors.text} />
          <Text style={[styles.emptyTitle, { color: colors.secondary }]}>No bookmarks yet</Text>
          <Text style={[styles.emptySub, { color: colors.text }]}>Save articles to read later.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}> 
      
      
      <Text style={[styles.title, { color: colors.secondary, padding: 16, fontSize: 20, fontFamily: 'MonaSans-Bold',textAlign: 'center' }]}>Bookmarks</Text>
      <FlatList
        data={bookmarks}
      showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.url}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  )
}

export default bookmark

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 100

   },
  listContent: { padding: 16 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  thumb: {
    width: 72,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'MonaSans-Bold',
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: 'MonaSans-Regular',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'MonaSans-Bold',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'MonaSans-Regular',
    marginTop: 6,
  },
  action:{
 
    height:'100%',
 
  }
})