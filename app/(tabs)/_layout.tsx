import { Tabs } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  
  if (loading) {
    return (
      <View className="flex-1 bg-blue-50 items-center justify-center">
        <Text>Chargement...</Text>
      </View>
    );
  }
  
  if (!user) {
    return null; // Will be redirected by root layout
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#2563EB" },
        headerTintColor: "#FFFFFF",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : insets.bottom + 5),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#9CA3AF",
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }} 
      />
      
      {/* QR Tab - Only for STUDENTS */}
      <Tabs.Screen 
        name="qr" 
        options={{ 
          title: "QR Code",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code-outline" size={size} color={color} />
          ),
          tabBarItemStyle: {
            display: user.role === "STUDENT" ? "flex" : "none",
          },
        }} 
      />
      
      {/* Tickets Tab - Only for STUDENTS */}
      <Tabs.Screen 
        name="tickets" 
        options={{ 
          title: "Tickets",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ticket-outline" size={size} color={color} />
          ),
          tabBarItemStyle: {
            display: user.role === "STUDENT" ? "flex" : "none",
          },
        }} 
      />
      
      {/* Scan Tab - Only for AGENT_RESTAURANT */}
      <Tabs.Screen 
        name="scan" 
        options={{ 
          title: "Scanner",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" size={size} color={color} />
          ),
          tabBarItemStyle: {
            display: user.role === "AGENT_RESTAURANT" ? "flex" : "none",
          },
        }} 
      />
      
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }} 
      />
    </Tabs>
  );
}