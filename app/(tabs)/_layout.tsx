import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

function StudentTabs() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0A66C2" },
        headerTintColor: "white",
        tabBarActiveTintColor: "#0A66C2",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: "QR Code",
          tabBarLabel: "QR",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function AgentTabs() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0A66C2" },
        headerTintColor: "white",
        tabBarActiveTintColor: "#0A66C2",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: "Scanner",
          tabBarLabel: "Scan",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();
  
  // Show loading while user data is being fetched
  if (loading || !user) {
    return null;
  }

  // Return the appropriate tab layout based on user role
  if (user.role === "STUDENT") {
    return <StudentTabs />;
  }
  
  if (user.role === "AGENT_RESTAURANT") {
    return <AgentTabs />;
  }
  
  // Fallback for other roles or unexpected cases
  return <StudentTabs />;
}
