import React from "react";
import { View, Image, Text, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import {useT} from "../../src/utils/tMiddleware"
import { useTheme } from "../../src/context/ThemeContext"
import Back from "../../assets/icons/angle-small-left.svg"
import Menu from "../../assets/icons/bars-staggered.svg"
import Moon from "../../assets/icons/moon-stars.svg"
import Sun from "../../assets/icons/brightness.svg"
import Plus from "../../assets/icons/square-plus.svg"
import Earth from "../../assets/icons/earth-europa.svg"
const HomeHeader = () => {
  const {T,flex,fm,fb,fs,fr,color,center,bg,ai,jc,row,col,ph,pv,ml,br,mr,w,h,lh,mh,bw,bc} = useT();
  const { colors,theme,toggleTheme} = useTheme();
  return (
    <View
 
      style={T(row,ai('center'),jc('space-between'),ph(10),pv(10),bg('primary'))}
    >
      {/* Left Section */}
      <View style={T(row,ai('center'))}>
        {/* <TouchableOpacity>
          <Back height={22} width={22} fill={colors.secondary}/>
        </TouchableOpacity> */}

        {/* Logo + Title */}
        <View style={T(row,ai('center'),ml(8))}>
      
{theme === "dark" ? (
  <Earth height={22} width={22} fill={colors.secondary}  style={[T(mr(5))]}/>
) : (
  <Earth height={22} width={22} fill={'#42adff'}  style={[T(mr(5))]}/>
)}

        
<View>
        <Text style={T(fb(12),color(colors.secondary),lh(12))}>News</Text>
                    <Text style={T(fb(12),color(colors.secondary),lh(12))}>Pulse</Text>


  </View>          
        </View>
      </View>

      {/* Right Section */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity style={T(mh(10))}>
    <Plus height={22} width={22} fill={colors.secondary}/>
        </TouchableOpacity>

        <TouchableOpacity style={T(mh(10))} onPress={toggleTheme}>
{
  theme === "dark" ? (
    <Moon height={22} width={22} fill={colors.secondary}/>
  ) : (
    <Sun height={22} width={22} fill={colors.secondary}/>
  )
}

        </TouchableOpacity>

        <TouchableOpacity style={T(mh(10))}>
          <Menu height={22} width={22} fill={colors.secondary}/>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeHeader;
