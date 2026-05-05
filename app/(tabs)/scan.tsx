import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { verifyQRCode } from "./qr";

interface ScanResult {
  id: string;
  firstName: string;
  lastName: string;
  lunchCount: number;
  dinnerCount: number;
  totalMeals: number;
  todayReservations?: Array<{
    id: string;
    date: string;
    mealType: string;
    status: string;
  }>;
}

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [validatingMeal, setValidatingMeal] = useState(false);
  
  const router = useRouter();
  const { user, token } = useAuth();

  // Route protection - Only agents can access this page
  if (user && user.role !== "AGENT_RESTAURANT") {
    return (
      <View className="flex-1 bg-blue-50 items-center justify-center">
        <View className="w-16 h-16 bg-red-500 rounded-full items-center justify-center mb-4 shadow-lg">
          <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
        </View>
        <Text className="text-gray-800 text-xl font-bold mb-2">Accès Restreint</Text>
        <Text className="text-gray-600 text-base text-center px-6">
          Cette page est uniquement accessible aux agents de restaurant.
        </Text>
        <TouchableOpacity 
          onPress={() => router.replace("/(tabs)/index")}
          className="bg-blue-600 rounded-xl px-6 py-3 mt-6"
        >
          <Text className="text-white font-semibold">Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6">
          <Ionicons name="camera-outline" size={40} color="#2563EB" />
        </View>
        <Text className="text-gray-800 text-xl font-bold mb-3 text-center">
          Autorisation Caméra Requise
        </Text>
        <Text className="text-gray-600 text-base text-center mb-6">
          Cette application a besoin d'accéder à la caméra pour scanner les QR codes des étudiants.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-blue-600 rounded-xl px-8 py-4"
        >
          <Text className="text-white font-bold text-lg">Autoriser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    try {
      console.log('QR Code scanned:', data);
      
      // Parse QR code format: userId.signature
      const parts = data.split('.');
      if (parts.length !== 2) {
        console.error('Invalid QR code format:', data);
        Alert.alert('Erreur', 'Format de code QR invalide');
        setScanned(false);
        return;
      }
      
      const [userId, signature] = parts;
      
      // Verify QR code signature
      const verification = await verifyQRCode(data);
      if (!verification.isValid) {
        Alert.alert('Erreur', 'Code QR invalide ou signature incorrecte');
        setScanned(false);
        return;
      }
      
      // Call API to get student's reservations for today
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.18:5000"}/api/agent-restaurant/scan/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to scan QR: ${response.status}`);
      }

      const scanData = await response.json();
      console.log('Scan result:', scanData);
      
      // Transform the data to match our interface
      const result: ScanResult = {
        id: scanData.id,
        firstName: scanData.firstName,
        lastName: scanData.lastName,
        lunchCount: scanData.todayReservations?.filter((r: any) => r.mealType === 'LUNCH').length || 0,
        dinnerCount: scanData.todayReservations?.filter((r: any) => r.mealType === 'DINNER').length || 0,
        totalMeals: scanData.totalReservationsToday || 0,
        todayReservations: scanData.todayReservations || []
      };
      
      setScanResult(result);
  
    } catch (error: any) {
      console.error("QR scan error:", error);
      Alert.alert("Erreur", "QR code invalide. Veuillez réessayer.");
      setScanned(false);
    }
  };

  const validateMeal = async (mealType: 'LUNCH' | 'DINNER', student: ScanResult) => {
    if (!student.todayReservations || student.todayReservations.length === 0) {
      Alert.alert("Erreur", "Aucune réservation disponible pour aujourd'hui.");
      return;
    }

    // Find the reservation for this meal type
    const reservation = student.todayReservations.find(r => r.mealType === mealType);
    
    if (!reservation) {
      Alert.alert("Erreur", `Aucune réservation de type ${mealType === 'LUNCH' ? 'déjeuner' : 'dîner'} disponible pour aujourd'hui.`);
      return;
    }

    if (reservation.status === 'USED') {
      Alert.alert("Erreur", `Ce ${mealType === 'LUNCH' ? 'déjeuner' : 'dîner'} a déjà été utilisé.`);
      return;
    }

    // Check if all meals of this type are already used
    const availableMeals = student.todayReservations.filter(r => r.mealType === mealType && r.status !== 'USED');
    if (availableMeals.length === 0) {
      Alert.alert("Erreur", `Tous les ${mealType === 'LUNCH' ? 'déjeuners' : 'dîners'} ont déjà été utilisés aujourd'hui.`);
      return;
    }

    try {
      // Call API to validate meal
      console.log(`Validating ${mealType} for student:`, student.id);
      
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.18:5000"}/api/agent-restaurant/validate-meal`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: student.id,
            reservationId: reservation.id,
            mealType: mealType
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to validate meal: ${response.status}`);
      }

      const result = await response.json();
      console.log('Meal validation result:', result);
      
      Alert.alert(
        "Succès",
        `${mealType === 'LUNCH' ? 'Déjeuner' : 'Dîner'} validé avec succès!`,
        [
          {
            text: "OK",
            onPress: () => {
              setScanned(false);
              setScanResult(null);
            }
          }
        ]
      );
      
      // Update the scan result to reflect validation
      setScanResult({
        ...student,
        todayReservations: student.todayReservations?.map(r => 
          r.id === reservation.id ? { ...r, status: 'USED' } : r
        )
      });

      // Refresh the scan result after validation to show updated counts
      setTimeout(() => {
        // Get the updated reservations from current state
        setScanResult(currentResult => {
          if (currentResult && currentResult.todayReservations) {
            const updatedLunchCount = currentResult.todayReservations?.filter((r: any) => r.mealType === 'LUNCH' && r.status !== 'USED').length || 0;
            const updatedDinnerCount = currentResult.todayReservations?.filter((r: any) => r.mealType === 'DINNER' && r.status !== 'USED').length || 0;
            const updatedTotalMeals = updatedLunchCount + updatedDinnerCount;
            
            return {
              ...currentResult,
              lunchCount: updatedLunchCount,
              dinnerCount: updatedDinnerCount,
              totalMeals: updatedTotalMeals,
              todayReservations: currentResult.todayReservations
            };
          }
          return currentResult;
        });
      }, 1000);
      
    } catch (error: any) {
      console.error("Validation error:", error);
      Alert.alert("Erreur", "Échec de la validation du repas.");
    }
  };

  const handleValidateMeal = async (student: ScanResult) => {
    if (student.remainingMeals <= 0) {
      Alert.alert("Erreur", "Cet étudiant n'a plus de tickets disponibles.");
      setScanned(false);
      setScanResult(null);
      return;
    }

    try {
      // TODO: Implement actual API call to validate meal
      console.log('Validating meal for student:', student.id);
      
      setScanned(false);
      setScanResult(null);
    } catch (error: any) {
      console.error("Validation error:", error);
      Alert.alert("Erreur", "Échec de la validation du repas.");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-6">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Scanner QR Code</Text>
            <Text className="text-blue-100 text-sm mt-1">Scannez le QR code de l'étudiant</Text>
          </View>
        </View>
      </View>

      {/* Camera View */}
      <View className="flex-1">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        
        {/* Scanner Overlay */}
        <View className="absolute inset-0 flex-1 items-center justify-center">
          <View className="w-64 h-64 border-4 border-white rounded-lg">
            <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></View>
            <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></View>
            <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></View>
            <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></View>
          </View>
          
          <Text className="text-white text-base mt-8 bg-black/50 px-4 py-2 rounded-lg">
            Positionnez le QR code dans le cadre
          </Text>
        </View>

        {/* Scan Result Overlay */}
        {scanResult && (
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-lg">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-bold text-lg">
                  {scanResult.firstName} {scanResult.lastName}
                </Text>
                <Text className="text-gray-500 text-sm">
                  ID: {scanResult.id.slice(0, 8)}...
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-4">
              <View className="bg-gray-50 rounded-lg p-3 flex-1 mr-2">
                <Text className="text-gray-500 text-xs">🍽️ Déjeuner</Text>
                <Text className="text-gray-800 font-bold">{scanResult.lunchCount}</Text>
              </View>
              <View className="bg-gray-50 rounded-lg p-3 flex-1 mx-1">
                <Text className="text-gray-500 text-xs">🌙 Dîner</Text>
                <Text className="text-gray-800 font-bold">{scanResult.dinnerCount}</Text>
              </View>
              <View className="bg-gray-50 rounded-lg p-3 flex-1 ml-2">
                <Text className="text-gray-500 text-xs">Total</Text>
                <Text className="text-gray-800 font-bold">{scanResult.totalMeals}</Text>
              </View>
            </View>
            
            {/* Validation Buttons */}
            {scanResult.todayReservations && scanResult.todayReservations.length > 0 && (
              <View className="mt-4">
                <Text className="text-gray-700 font-semibold mb-3 text-center">
                  {scanResult.totalMeals === 0 ? 'Tous les repas utilisés' : 'Valider un repas'}
                </Text>
                <View className="flex-row space-x-3">
                  {/* Lunch Validation */}
                  {scanResult.lunchCount > 0 && (
                    <TouchableOpacity
                      onPress={() => validateMeal('LUNCH', scanResult)}
                      className="bg-orange-500 rounded-lg py-3 px-4 flex-1"
                      disabled={validatingMeal || scanResult.totalMeals === 0}
                    >
                      <Text className="text-white font-bold text-center">
                        {validatingMeal ? 'Validation...' : 'Valider Déjeuner'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Dinner Validation */}
                  {scanResult.dinnerCount > 0 && (
                    <TouchableOpacity
                      onPress={() => validateMeal('DINNER', scanResult)}
                      className="bg-green-600 rounded-lg py-3 px-4 flex-1"
                      disabled={validatingMeal || scanResult.totalMeals === 0}
                    >
                      <Text className="text-white font-bold text-center">
                        {validatingMeal ? 'Validation...' : 'Valider Dîner'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            
            <TouchableOpacity
              onPress={() => {
                setScanned(false);
                setScanResult(null);
              }}
              className="bg-blue-600 rounded-xl py-3"
            >
              <Text className="text-white font-bold text-center">Scanner à nouveau</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
