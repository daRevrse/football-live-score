// App.js (exemple minimal)
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MatchesScreen from "./src/components/MatchesScreen";
import MatchDetailScreen from "./src/components/MatchDetailScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Matches">
        <Stack.Screen name="Matches" component={MatchesScreen} />
        <Stack.Screen
          name="MatchDetail"
          component={MatchDetailScreen}
          options={({ route }) => ({ title: `Match ${route.params.id}` })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
