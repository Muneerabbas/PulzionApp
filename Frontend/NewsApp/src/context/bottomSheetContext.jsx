import React, { createContext, useContext, useRef, useState, useCallback, useMemo } from 'react';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '../context/ThemeContext';
import { factCheckArticle } from '../api/newsApi';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BottomSheetContext = createContext();
export const useBottomSheet = () => useContext(BottomSheetContext);

export const BottomSheetProvider = ({ children }) => {
  const bottomSheetModalRef = useRef(null);
  const [content, setContent] = useState(null);
  const { colors } = useTheme();

  const [factResult, setFactResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFactCheck = async () => {
    try {
      setLoading(true);
      setFactResult(null);
      console.log('🧠 Fact-checking article:', content?.title);

      const data = await factCheckArticle(content);
      setFactResult(data);
      console.log('✅ Fact check result:', data);
    } catch (err) {
      console.error('❌ Fact check error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const snapPoints = useMemo(() => ['65%'], []);
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

  const openSheet = useCallback((data) => {
    console.log('🔽 Opening Bottom Sheet');
    setContent(data);
    bottomSheetModalRef.current?.present();
  }, []);

  const closeSheet = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const getFactStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'true':
        return { color: '#22c55e', icon: 'checkmark-circle' };
      case 'false':
        return { color: '#ef4444', icon: 'close-circle' };
      default:
        return { color: '#eab308', icon: 'help-circle' }; 
    }
  };

  return (
    <BottomSheetModalProvider>
      <BottomSheetContext.Provider value={{ openSheet, closeSheet }}>
        {children}

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={snapPoints}
          backdropComponent={renderBackdrop}
          enablePanDownToClose={true}
            onDismiss={() => setFactResult(null)}

          backgroundStyle={{
            backgroundColor: colors.tabbarbg,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
          }}
        >
          <BottomSheetView style={{ flex: 1, padding: 20 }}>
            {content && (
              <>
                {/* Article Image */}
                <Image
                  source={{ uri: content?.urlToImage }}
                  style={{
                    width: '100%',
                    height: 160,
                    borderRadius: 20,
                    marginBottom: 16,
                  }}
                  resizeMode="cover"
                />

                {/* Title */}
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'MonaSans-Bold',
                    color: colors.secondary,
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  {content?.title}
                </Text>

                {/* Description */}
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'MonaSans-Regular',
                    color: colors.text,
                    textAlign: 'center',
                    marginBottom: 20,
                  }}
                >
                  {content?.description}
                </Text>

                {/* Buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
                  <TouchableOpacity onPress={handleFactCheck} disabled={loading}>
                    <LinearGradient
                      colors={['#6366f1', '#4f46e5']}
                      start={[0, 0]}
                      end={[1, 1]}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 30,
                        borderRadius: 20,
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="search" size={18} color="#fff" />
                          <Text
                            style={{
                              color: '#fff',
                              fontSize: 15,
                              fontFamily: 'MonaSans-Bold',
                            }}
                          >
                            Fact Check
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(content?.url)}>
                    <LinearGradient
                      colors={['#06b6d4', '#0891b2']}
                      start={[0, 0]}
                      end={[1, 1]}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 30,
                        borderRadius: 20,
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      <Ionicons name="open-outline" size={18} color="#fff" />
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: 15,
                          fontFamily: 'MonaSans-Bold',
                        }}
                      >
                        Read More
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Fact Check Result */}
                {factResult && (
                  <View
                    style={{
                      marginTop: 10,
                      backgroundColor: colors.cardbg,
                      padding: 15,
                      borderWidth:1,
                      borderColor:'rgba(124, 130, 136, 0.53)164, 70, 164, 0.53)',
                      borderRadius: 16,
                      alignItems: 'center',
                    }}
                  >
                    {factResult.claims?.map((claim, idx) => {
                      const rating = claim.claimReview?.[0]?.textualRating || 'Unverified';
                      const { color, icon } = getFactStatusStyle(rating);

                      return (
                        <View key={idx} style={{ alignItems: 'center', marginBottom: 10 }}>
                          <Ionicons name={icon} size={40} color={color} />
                          <Text
                            style={{
                              color,
                              fontFamily: 'MonaSans-Bold',
                              fontSize: 18,
                              marginTop: 6,
                            }}
                          >
                            {rating.toUpperCase()}
                          </Text>

                          <Text
                            style={{
                              color: colors.text,
                              fontFamily: 'MonaSans-Regular',
                              fontSize: 14,
                              textAlign: 'center',
                              marginTop: 8,
                              paddingHorizontal: 10,
                            }}
                          >
                            {claim.text}
                          </Text>

                          {claim.claimReview?.[0]?.publisher?.name && (
                            <Text
                              style={{
                                marginTop: 6,
                                fontSize: 13,
                                color: colors.secondary,
                              }}
                            >
                              — {claim.claimReview[0].publisher.name}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetContext.Provider>
    </BottomSheetModalProvider>
  );
};
