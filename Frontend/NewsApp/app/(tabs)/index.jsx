import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../src/context/ThemeContext'
import { Button } from '@react-navigation/elements'
import HomeHeader from '../components/homeheader'
import { useT } from '../../src/utils/tMiddleware'
import StoryList from '../components/discover'
import HorizontalTabs from '../components/horizontalHomeTabs'
import TrendingCollectionSlider from '../components/bottomSliders'
const home = () => {
  const { colors } = useTheme();
  const {toggleTheme} = useTheme();
  const {T,flex,fr,color,center,bg,fb,fm,fs,lh} = useT();
  return (
    <SafeAreaView style={T(flex(1),bg(colors.primary))}>
      <HomeHeader/>
     <ScrollView>
       <StoryList/>
      <HorizontalTabs/>
    
     </ScrollView>
    </SafeAreaView>
  )
}

export default home