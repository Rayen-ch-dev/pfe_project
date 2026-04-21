import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Alert, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  role: string;
}

export default function Profile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  
  const { logout, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadUserProfileFromToken();
  }, []);

  const loadUserProfileFromToken = async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.15:5000'}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      console.log('User data from API:', data);

      const userData: UserProfile = {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName, 
        email: data.email,
        createdAt: data.createdAt,
        role: data.role
      };

      setUserProfile(userData);
      setFormData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
      });
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      Alert.alert("Erreur", "Impossible de charger le profil");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      // TODO: Implement update profile API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local profile data
      setUserProfile(prev => prev ? {
        ...prev,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      } : null);
      
      Alert.alert("Succès", "Profil mis à jour avec succès !");
      setEditing(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Déconnexion", 
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/(auth)/SignInScreen");
            } catch (error) {
              console.error("Logout failed:", error);
              Alert.alert("Erreur", "Échec de la déconnexion");
            }
          }
        }
      ]
    );
  };

  const getRoleLabel = (role: string) => {
    if (role === "STUDENT") return "Étudiant";
    if (role === "AGENT_RESTAURANT") return "Agent Restaurant";
    return "Utilisateur";
  };

  const getRoleIcon = (role: string) => {
    if (role === "STUDENT") return "school-outline";
    if (role === "AGENT_RESTAURANT") return "restaurant-outline";
    return "person-outline";
  };

  if (loading) {
    return (
      <View className="flex-1 bg-blue-50 items-center justify-center">
        <View className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center mb-4 shadow-lg">
          <Text className="text-white text-3xl font-bold">📚</Text>
        </View>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-4 text-base">Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      
      {/* Header Section */}
      <View className="bg-blue-600 pt-12 pb-8 px-6 rounded-b-3xl shadow-lg">
        <View className="items-center">
          {/* Avatar */}
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 shadow-lg">
            <Text className="text-blue-600 text-4xl font-bold">
              {userProfile?.firstName?.charAt(0)}{userProfile?.lastName?.charAt(0)}
            </Text>
          </View>
          
          {/* User Name */}
          <Text className="text-white text-2xl font-bold mb-1">
            {userProfile?.firstName} {userProfile?.lastName}
          </Text>
          
          {/* Role Badge */}
          <View className="flex-row items-center bg-blue-500 rounded-full px-4 py-1 mt-2">
            <Ionicons name={getRoleIcon(userProfile?.role || "")} size={16} color="#FFFFFF" />
            <Text className="text-white text-sm font-semibold ml-2">
              {getRoleLabel(userProfile?.role || "")}
            </Text>
          </View>
        </View>
      </View>

      {/* Profile Info Section */}
      <View className="px-6 py-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-gray-800 text-xl font-bold">Informations personnelles</Text>
          {!editing && (
            <TouchableOpacity 
              onPress={() => setEditing(true)}
              className="flex-row items-center"
            >
              <Ionicons name="create-outline" size={20} color="#2563EB" />
              <Text className="text-blue-600 ml-1 font-semibold">Modifier</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* First Name */}
          <View className="mb-5">
            <Text className="text-gray-600 text-sm font-semibold mb-2">Prénom</Text>
            {editing ? (
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 py-3 text-gray-800 text-base ml-3"
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  placeholder="Votre prénom"
                  placeholderTextColor="#9CA3AF"
                  editable={!updating}
                />
              </View>
            ) : (
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <Text className="flex-1 text-gray-800 text-base ml-3">{userProfile?.firstName}</Text>
              </View>
            )}
          </View>

          {/* Last Name */}
          <View className="mb-5">
            <Text className="text-gray-600 text-sm font-semibold mb-2">Nom</Text>
            {editing ? (
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 py-3 text-gray-800 text-base ml-3"
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  placeholder="Votre nom"
                  placeholderTextColor="#9CA3AF"
                  editable={!updating}
                />
              </View>
            ) : (
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <Text className="flex-1 text-gray-800 text-base ml-3">{userProfile?.lastName}</Text>
              </View>
            )}
          </View>

          {/* Email */}
          <View className="mb-5">
            <Text className="text-gray-600 text-sm font-semibold mb-2">Email</Text>
            {editing ? (
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 py-3 text-gray-800 text-base ml-3"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="votre@email.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!updating}
                />
              </View>
            ) : (
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <Text className="flex-1 text-gray-800 text-base ml-3">{userProfile?.email}</Text>
              </View>
            )}
          </View>

          {/* Member Since */}
          <View className="mb-2">
            <Text className="text-gray-600 text-sm font-semibold mb-2">Membre depuis</Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
              <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
              <Text className="flex-1 text-gray-800 text-base ml-3">
                {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('fr-FR') : "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mt-6 space-y-3">
          {editing ? (
            <>
              <TouchableOpacity
                onPress={handleUpdateProfile}
                disabled={updating}
                className={`bg-blue-600 rounded-xl py-4 shadow-md ${updating ? 'opacity-70' : ''}`}
                activeOpacity={0.8}
              >
                {updating ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white font-bold text-lg ml-2">Mise à jour...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="save-outline" size={24} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">Enregistrer</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  setEditing(false);
                  setFormData({
                    firstName: userProfile?.firstName || "",
                    lastName: userProfile?.lastName || "",
                    email: userProfile?.email || "",
                  });
                }}
                className="bg-gray-300 rounded-xl py-4"
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="close-outline" size={24} color="#666" />
                  <Text className="text-gray-700 font-bold text-lg ml-2">Annuler</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-red-500 rounded-xl py-4 shadow-md"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="log-out-outline" size={24} color="white" />
                <Text className="text-white font-bold text-lg ml-2">Se déconnecter</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

     

        {/* Footer */}
        <View className="mt-8 pb-10">
          <Text className="text-gray-400 text-xs text-center">
            © 2024 Portail Scolaire. Tous droits réservés.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}