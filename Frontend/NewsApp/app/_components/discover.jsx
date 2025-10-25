import React from "react";
import { View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { useTheme } from "../../src/context/ThemeContext";
const data = [
  { id: "1", type: "discover" },
  { id: "2", image: require("../../assets/user.png") },
  { id: "3", image: require("../../assets/user.png") },
  { id: "4", image: require("../../assets/user.png") },
  { id: "5", image: require("../../assets/user.png") },
];


const StoryCircle = ({ item }) => {
    const {colors} = useTheme();
  if (item.type === "discover") {
    return (
      <View
        style={{
          alignItems: "center",
          marginRight: 12,
       
         
        }}
      >
        <TouchableOpacity
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.secondary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 10, fontFamily: "MonaSans-Medium" }}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ alignItems: "center", marginRight: 12 }}>
      <TouchableOpacity
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          borderWidth: 1,
          borderColor:colors.secondary,
          overflow: "hidden",
        }}
      >
        <Image
          source={item.image}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  );
};

const StoryList = () => {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
      renderItem={({ item }) => <StoryCircle item={item} />}
    />
  );
};

export default StoryList;
