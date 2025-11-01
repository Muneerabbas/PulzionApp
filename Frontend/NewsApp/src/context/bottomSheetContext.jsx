import React, { createContext, useContext, useRef, useState, useCallback, useMemo } from 'react';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../context/ThemeContext';

const BottomSheetContext = createContext();
export const useBottomSheet = () => useContext(BottomSheetContext);

export const BottomSheetProvider = ({ children }) => {
  const bottomSheetModalRef = useRef(null);
  const [content, setContent] = useState(null);
  const { colors } = useTheme();

  const snapPoints = useMemo(() => ['50%'], []);

  /** ✅ Smooth dimmed backdrop */
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.6}
      />
    ),
    []
  );

  /** ✅ Use present() for Modal-based sheets */
  const openSheet = useCallback((data) => {
    console.log('🔽 Opening Bottom Sheet');
    setContent(data);
    bottomSheetModalRef.current?.present();
  }, []);

  const closeSheet = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  return (
    <BottomSheetModalProvider>
      <BottomSheetContext.Provider value={{ openSheet, closeSheet }}>
        {children}

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={['60%']}
          backdropComponent={renderBackdrop}
          enablePanDownToClose={true}
          backgroundStyle={{
            backgroundColor: colors.tabbarbg,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}
        >
          <BottomSheetView style={{ flex: 1, padding: 20 }}>
            {content && (
              <>
                <Image
                  source={{ uri: content?.urlToImage }}
                  style={{
                    width: '100%',
                    height: 150,
                    borderRadius: 30,
                  }}
                  resizeMode="cover"
                />

                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'MonaSans-Bold',
                    color: colors.secondary,
                    textAlign: 'center',
                    marginTop: 20,
                  }}
                >
                  {content?.title}
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'MonaSans-Regular',
                    color: colors.text,
                    textAlign: 'center',
                    marginTop: 20,
                  }}
                >
                  {content?.description}
                </Text>

                <TouchableOpacity
                  onPress={() => WebBrowser.openBrowserAsync(content?.url)}
                  style={{
                    backgroundColor: colors.muted,
                    padding: 10,
                    alignSelf: 'center',
                    marginTop: 20,
                    borderRadius: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'MonaSans-Bold',
                      color: colors.primary,
                    }}
                  >
                    Read More
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetContext.Provider>
    </BottomSheetModalProvider>
  );
};
