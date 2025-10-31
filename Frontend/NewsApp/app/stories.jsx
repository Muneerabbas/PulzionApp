import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Stories from './_components/story';

export default function StoriesScreen() {
  const router = useRouter();
  return (
    <>
      
      <Stories />
    </>
  );
}
