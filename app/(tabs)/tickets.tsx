import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { getPackages, purchasePackage, purchaseCustomTickets, getUserTickets, Package } from "../api/tickets";

interface EnhancedPackage extends Package {
  tickets: number;
}

export default function Tickets() {
  const [packages, setPackages] = useState<EnhancedPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [customTickets, setCustomTickets] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [userTickets, setUserTickets] = useState(8);
  
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      loadPackages();
      loadUserTickets();
    }
  }, [token]);

  const loadPackages = async () => {
    try {
      if (!token) return;
      const response = await getPackages(token);
      // Enhance packages with ticket counts based on your database
      const enhancedPackages: EnhancedPackage[] = response.data.map((pkg: Package) => ({
        ...pkg,
        tickets: pkg.name.includes("12") ? 12 : pkg.name.includes("24") ? 24 : 12
      }));
      setPackages(enhancedPackages);
    } catch (error: any) {
      console.error("Failed to load packages:", error);
      // Fallback to mock data if API fails
      const mockPackages: EnhancedPackage[] = [
        { id: "1", name: "Package Étudiant", price: 2.4, tickets: 12 }, // 12 * 0.2 = 2.4 DT
        { id: "2", name: "Package Premium", price: 4.8, tickets: 24 }, // 24 * 0.2 = 4.8 DT
      ];
      setPackages(mockPackages);
    } finally {
      setLoading(false);
    }
  };

  const loadUserTickets = async () => {
    try {
      if (!token) return;
      const response = await getUserTickets(token);
      setUserTickets(response.data.remainingTickets || 0);
    } catch (error: any) {
      console.error("Failed to load user tickets:", error);
      // Keep default value
    }
  };

  const handlePurchasePackage = async (packageId: string) => {
    if (!token) {
      Alert.alert("Erreur", "Vous devez être connecté pour acheter des tickets");
      return;
    }
    
    setPurchasing(packageId);
    try {
      const selectedPackage = packages.find(p => p.id === packageId);
      const response = await purchasePackage(packageId, token);
      
      Alert.alert(
        "Succès",
        `Package ${selectedPackage?.name} acheté avec succès! Vous avez maintenant ${selectedPackage?.tickets} tickets.`,
        [
          {
            text: "OK",
            onPress: () => {
              loadUserTickets(); // Refresh ticket count
              router.back();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error("Purchase failed:", error);
      Alert.alert("Erreur", "Échec de l'achat du package");
    } finally {
      setPurchasing(null);
    }
  };

  const handleCustomPurchase = async () => {
    const tickets = parseInt(customTickets);
    if (!tickets || tickets < 1) {
      Alert.alert("Erreur", "Veuillez entrer un nombre valide de tickets");
      return;
    }
    
    if (tickets > 100) {
      Alert.alert("Erreur", "Maximum 100 tickets par achat");
      return;
    }

    if (!token) {
      Alert.alert("Erreur", "Vous devez être connecté pour acheter des tickets");
      return;
    }

    setPurchasing("custom");
    try {
      const response = await purchaseCustomTickets(tickets, token);
      const price = tickets * 0.2; 
      
      Alert.alert(
        "Succès",
        `${tickets} tickets achetés avec succès pour ${price.toFixed(2)} DT!`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowCustom(false);
              setCustomTickets("");
              loadUserTickets(); // Refresh ticket count
              router.back();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error("Custom purchase failed:", error);
      Alert.alert("Erreur", "Échec de l'achat de tickets");
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-blue-50 items-center justify-center">
        <View className="w-16 h-16 bg-blue-600 rounded-full items-center justify-center mb-4 shadow-lg">
          <Text className="text-white text-3xl font-bold"> tickets</Text>
        </View>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-4 text-base">Chargement des packages...</Text>
      </View>
    );
  }

  // Restrict access to students only
  if (user?.role !== "STUDENT") {
    return (
      <View className="flex-1 bg-blue-50 items-center justify-center">
        <View className="w-16 h-16 bg-red-500 rounded-full items-center justify-center mb-4 shadow-lg">
          <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
        </View>
        <Text className="text-gray-800 text-xl font-bold mb-2">Accès Restreint</Text>
        <Text className="text-gray-600 text-base text-center px-6">
          Cette page est uniquement accessible aux étudiants.
        </Text>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-blue-600 rounded-xl px-6 py-3 mt-6"
        >
          <Text className="text-white font-semibold">Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      
      {/* Header Section */}
      <View className="bg-blue-600 pt-12 pb-8 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Acheter des Tickets</Text>
            <Text className="text-blue-100 text-sm mt-1">Choisissez un package ou personnalisé</Text>
          </View>
        </View>
        
        {/* Current Tickets Info */}
        <View className="bg-white/10 rounded-xl p-4 backdrop-blur-lg">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-blue-100 text-xs">Tickets actuels</Text>
              <Text className="text-white text-2xl font-bold">{userTickets}</Text>
            </View>
            <Ionicons name="ticket-outline" size={32} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Packages Section */}
      <View className="px-6 py-6">
        <Text className="text-gray-800 text-xl font-bold mb-4">Packages Disponibles</Text>
        
        {packages.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            onPress={() => handlePurchasePackage(pkg.id)}
            disabled={purchasing === pkg.id}
            className={`bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-100 active:opacity-80 ${
              purchasing === pkg.id ? 'opacity-60' : ''
            }`}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="pricetag-outline" size={24} color="#2563EB" />
                  </View>
                  <View>
                    <Text className="text-gray-800 font-bold text-lg">{pkg.name}</Text>
                    <Text className="text-gray-500 text-sm">{pkg.tickets} tickets</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-blue-600 text-2xl font-bold">{pkg.price.toFixed(2)} DT</Text>
                  <Text className="text-gray-500 text-sm ml-2">({(pkg.price / pkg.tickets).toFixed(2)} DT/ticket)</Text>
                </View>
              </View>
              
              {purchasing === pkg.id ? (
                <ActivityIndicator size="small" color="#2563EB" />
              ) : (
                <View className="bg-blue-600 rounded-full p-3">
                  <Ionicons name="add-outline" size={20} color="white" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Custom Package Option */}
        <TouchableOpacity
          onPress={() => setShowCustom(!showCustom)}
          className="bg-purple-600 rounded-xl p-5 mb-4 shadow-sm active:opacity-80"
          activeOpacity={0.8}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-3">
                  <Ionicons name="create-outline" size={24} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">Package Personnalisé</Text>
                  <Text className="text-blue-100 text-sm">Choisissez le nombre de tickets</Text>
                </View>
              </View>
              <Text className="text-white text-sm">0.2 DT par ticket</Text>
            </View>
            
            <Ionicons 
              name={showCustom ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="white" 
            />
          </View>
        </TouchableOpacity>

        {/* Custom Input Section */}
        {showCustom && (
          <View className="bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-100">
            <Text className="text-gray-800 font-semibold mb-3">Nombre de tickets:</Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
              <Ionicons name="ticket-outline" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 py-3 text-gray-800 text-base ml-3"
                value={customTickets}
                onChangeText={setCustomTickets}
                placeholder="Entrez le nombre de tickets"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                editable={purchasing !== "custom"}
              />
            </View>
            
            <TouchableOpacity
              onPress={handleCustomPurchase}
              disabled={purchasing === "custom" || !customTickets}
              className={`bg-green-600 rounded-xl py-4 mt-4 ${
                purchasing === "custom" || !customTickets ? 'opacity-60' : ''
              }`}
              activeOpacity={0.8}
            >
              {purchasing === "custom" ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-bold text-lg ml-2">Achat en cours...</Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-center">
                  <Ionicons name="cart-outline" size={24} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Acheter {customTickets || '0'} tickets
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Info Section */}
        <View className="bg-blue-50 rounded-xl p-4 mt-6">
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={20} color="#2563EB" className="mr-3 mt-1" />
            <View className="flex-1">
              <Text className="text-gray-800 font-semibold mb-2">Information:</Text>
              <Text className="text-gray-600 text-sm leading-relaxed">
                Les tickets achetés seront ajoutés instantanément à votre compte. 
                Vous pouvez les utiliser pour obtenir vos repas à la cafétéria.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="px-6 pb-10">
        <Text className="text-gray-400 text-xs text-center">
          © 2024 Portail Scolaire. Tous droits réservés.
        </Text>
      </View>
    </ScrollView>
  );
}
