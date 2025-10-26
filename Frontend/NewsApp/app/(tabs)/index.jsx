import { View, Text, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../src/context/ThemeContext'
import HomeHeader from '../_components/homeheader'
import { useT } from '../../src/utils/tMiddleware'
import StoryList from '../_components/discover'
import HorizontalTabs from '../_components/horizontalHomeTabs'
const home = () => {
  const { colors } = useTheme();
  const {toggleTheme} = useTheme();
  const {T,flex,fr,color,center,bg,fb,fm,fs,lh} = useT();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
     

 
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