import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { CategoryScreen } from "../screens/CategoryScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { PlayerScreen } from "../screens/PlayerScreen";
import { SettingsScreen } from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator();

export function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Categories" component={CategoryScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{ presentation: "fullScreenModal" }}
      />
    </Stack.Navigator>
  );
}
