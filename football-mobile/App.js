import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import MatchesScreen from "./src/components/MatchesScreen";
import MatchDetailScreen from "./src/components/MatchDetailScreen";
import { SafeAreaProvider } from "react-native-safe-area-context";
// import MatchesScreen from "./src/components/Test";

const Stack = createNativeStackNavigator();

// Configuration moderne des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
          console.log("Expo Push Token:", token);
        }

        notificationListener.current =
          Notifications.addNotificationReceivedListener((notification) => {
            console.log("Notification received:", notification);
          });

        responseListener.current =
          Notifications.addNotificationResponseReceivedListener((response) => {
            const matchId = response.notification.request.content.data?.matchId;
            console.log("Notification tapped for match:", matchId);
            // Gérer la navigation ici si nécessaire
          });
      } catch (error) {
        console.error("Notification setup error:", error);
        Alert.alert("Erreur", "Impossible de configurer les notifications");
      }
    };

    setupNotifications();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const handleTestNotification = async () => {
    try {
      await sendPushNotification(expoPushToken);
    } catch (error) {
      console.error("Failed to send test notification:", error);
      Alert.alert("Erreur", "Échec de l'envoi de la notification test");
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Matches">
          <Stack.Screen
            name="Matches"
            component={MatchesScreen}
            options={{
              headerRight: () => (
                <Button
                  title="Test Notif"
                  onPress={handleTestNotification}
                  disabled={!expoPushToken}
                />
              ),
            }}
          />
          <Stack.Screen
            name="MatchDetail"
            component={MatchDetailScreen}
            options={({ route }) => ({ title: `Match ${route.params.id}` })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

async function sendPushNotification(expoPushToken) {
  if (!expoPushToken) {
    throw new Error("No push token available");
  }

  const message = {
    to: expoPushToken,
    sound: "default",
    title: "⚽ But marqué !",
    body: "L'équipe vient de marquer un but !",
    data: { matchId: 123 },
  };

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Push notification failed with status ${response.status}`);
  }
}

async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert(
      "Notifications non disponibles",
      "Les notifications push ne fonctionnent que sur un appareil physique !"
    );
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert(
      "Permission refusée",
      "Les notifications ne fonctionneront pas sans permission"
    );
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
