import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { ApiProvider } from "./src/context/ApiContext";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import RoomsManagementScreen from "./src/screens/RoomsManagementScreen";
import SongsManagementScreen from "./src/screens/SongsManagementScreen";
import RoomDashboardScreen from "./src/screens/RoomDashboardScreen";

export type RootStackParamList = {
  Login: undefined;
  RoomsManagement: undefined;
  SongsManagement: undefined;
  RoomDashboard: { roomId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <ApiProvider>
        <AuthProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: "#6200EE",
                },
                headerTintColor: "#fff",
                headerTitleStyle: {
                  fontWeight: "bold",
                },
              }}
            >
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="RoomsManagement"
                component={RoomsManagementScreen}
                options={{ title: "Rooms Management" }}
              />
              <Stack.Screen
                name="SongsManagement"
                component={SongsManagementScreen}
                options={{ title: "Songs Management" }}
              />
              <Stack.Screen
                name="RoomDashboard"
                component={RoomDashboardScreen}
                options={{ title: "Room Dashboard" }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthProvider>
      </ApiProvider>
    </SafeAreaProvider>
  );
}
