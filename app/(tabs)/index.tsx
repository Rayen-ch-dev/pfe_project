import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { getUserTickets } from "../api/tickets";

export default function Index() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [remainingTickets, setRemainingTickets] = useState(0);

  useEffect(() => {
    if (token) {
      loadUserTickets();
    }
  }, [token]);

  const loadUserTickets = async () => {
    try {
      if (!token) return;
      const response = await getUserTickets(token);
      setRemainingTickets(response.data.remainingTickets || 0);
    } catch (error: any) {
      console.error("Failed to load user tickets:", error);
      // Keep default value
    }
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  // Get user's full name
  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email?.split('@')[0] || "Étudiant";
  };

  // Get user role in French
  const getRoleLabel = () => {
    if (user?.role === "STUDENT") return "Étudiant";
    if (user?.role === "AGENT_RESTAURANT") return "Agent Restaurant";
    return "Utilisateur";
  };

  // Features based on role
  const getFeatures = () => {
    if (user?.role === "STUDENT") {
      return [
        { icon: "📱", title: "Mon QR Code", description: "Présentez votre QR code pour vos repas", color: "#2563EB", route: "/(tabs)/qr" },
        { icon: "🔔", title: "Notifications", description: "Restez informé des actualités", color: "#EF4444", route: null },
      ];
    } else if (user?.role === "AGENT_RESTAURANT") {
      return [
        { icon: "📷", title: "Scanner QR", description: "Scannez les QR codes des étudiants", color: "#2563EB", route: "/(tabs)/scan" },
        { icon: "📊", title: "Statistiques", description: "Consultez les repas servis", color: "#10B981", route: null },
        { icon: "📋", title: "Gestion des repas", description: "Gérez les menus et stocks", color: "#F59E0B", route: null },
      ];
    }
    return [];
  };

  const features = getFeatures();

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Header Section with Gradient Background */}
      <View className="bg-blue-600 pt-12 pb-8 px-6 rounded-b-3xl shadow-lg">
        {/* Greeting and User Info */}
        <View className="mb-6">
          <Text className="text-blue-100 text-base mb-1">{getGreeting()}</Text>
          <Text className="text-white text-2xl font-bold mb-1">{getUserName()}</Text>
          <View className="flex-row items-center mt-2">
            <View className="bg-blue-500 rounded-full px-3 py-1">
              <Text className="text-blue-100 text-xs font-semibold">{getRoleLabel()}</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards - Only for Students */}
        {user?.role === "STUDENT" && (
          <View className="flex-row justify-between mt-4">
            <View className="bg-white/10 rounded-xl p-4 flex-1 mr-2 backdrop-blur-lg">
              <Text className="text-white text-2xl font-bold">12</Text>
              <Text className="text-blue-100 text-xs mt-1">Repas ce mois</Text>
            </View>
            <View className="bg-white/10 rounded-xl p-4 flex-1 mx-1 backdrop-blur-lg">
              <Text className="text-white text-2xl font-bold">{remainingTickets}</Text>
              <Text className="text-blue-100 text-xs mt-1">Tickets restants</Text>
            </View>
            <TouchableOpacity 
              className="bg-white/10 rounded-xl p-4 flex-1 ml-2 backdrop-blur-lg active:opacity-80"
              onPress={() => router.push("/(tabs)/tickets")}
            >
              <Text className="text-white text-2xl font-bold">+</Text>
              <Text className="text-blue-100 text-xs mt-1">Réserver tickets</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions Section */}
      <View className="px-6 py-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-gray-800 text-xl font-bold">Actions rapides</Text>
          <TouchableOpacity>
            <Text className="text-blue-600 text-sm font-semibold">Voir tout</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Cards */}
        {features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => feature.route && router.push(feature.route)}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100 active:opacity-80"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className={`w-12 h-12 rounded-full items-center justify-center mr-4`} style={{ backgroundColor: `${feature.color}15` }}>
                <Text className="text-xl">{feature.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold text-base mb-1">{feature.title}</Text>
                <Text className="text-gray-500 text-xs">{feature.description}</Text>
              </View>
              <Text className="text-gray-400 text-lg">›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity Section - Only for Students */}
      {user?.role === "STUDENT" && (
        <View className="px-6 pb-8">
          <Text className="text-gray-800 text-xl font-bold mb-4">Activité récente</Text>
        
        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4 pb-3 border-b border-gray-100">
            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
              <Text className="text-green-600 text-lg">✅</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-semibold">Repas validé</Text>
              <Text className="text-gray-500 text-xs mt-1">Aujourd'hui, 12:30</Text>
            </View>
            <Text className="text-green-600 text-xs font-semibold">Terminé</Text>
          </View>


          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
              <Text className="text-purple-600 text-lg">🔔</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-semibold">Nouveau menu disponible</Text>
              <Text className="text-gray-500 text-xs mt-1">Il y a 2 jours</Text>
            </View>
            <Text className="text-purple-600 text-xs font-semibold">Nouveau</Text>
          </View>
        </View>
        </View>
      )}

      {/* Footer */}
      <View className="px-6 pb-10">
        <Text className="text-gray-400 text-xs text-center">
          © 2024 Portail Scolaire. Tous droits réservés.
        </Text>
      </View>
    </ScrollView>
  );
}