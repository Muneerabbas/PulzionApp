import React, { createContext, useContext, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';

const BottomSheetContext = createContext();

export const BottomSheetProvider = ({ children }) => {
  const bottomSheetRef = useRef(null);
  const [content, setContent] = useState(null);
  const [index, setIndex] = useState(-1);

  const snapPoints = useMemo(() => ['25%', '50%', '75%'], []);

  const openSheet = (data) => {
    setContent(data);
    setIndex(1); // open at 50%
  };

  const closeSheet = () => {
    setIndex(-1);
  };

  return (
    <BottomSheetContext.Provider value={{ openSheet, closeSheet }}>
      {children}

      <BottomSheet
        ref={bottomSheetRef}
        index={index}
        onChange={setIndex}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
      >
        <View style={styles.contentContainer}>
          {typeof content === 'string' ? (
            <Text style={styles.text}>{content}</Text>
          ) : (
            content
          )}
        </View>
      </BottomSheet>
    </BottomSheetContext.Provider>
  );
};

export const useBottomSheet = () => useContext(BottomSheetContext);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
});
