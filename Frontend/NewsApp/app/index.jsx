import { View, Text, Button } from "react-native";
import { useTheme } from "../src/context/ThemeContext";
import { useT } from "../src/utils/tMiddleware";

export default function Index() {
  const { toggleTheme, theme } = useTheme();
  const { T, bg, color, f, center, fb } = useT();

  return (
    <View style={T(bg("bg"),  center, { flex: 1 })}>
      <Text style={T(color("primary"), fb(24))}>Current Theme: {theme}</Text>

      <Button title="Toggle Theme" onPress={toggleTheme} />
    </View>
  );
}
