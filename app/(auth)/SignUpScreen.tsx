import React, { useState } from "react";
import { 
  View, 
  TextInput, 
  Alert, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { register } from "../api/auth";
import { StatusBar } from "expo-status-bar";

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      await register({ firstName, lastName, email, password });
      Alert.alert("Succès", "Compte créé ! Veuillez vous connecter.");
      router.replace("/(auth)/SignInScreen");
    } catch (error: any) {
      console.error("Registration failed:", error);
      let errorMessage = "Échec de l'inscription";
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        errorMessage = "Impossible de se connecter au serveur. Assurez-vous que le backend est en cours d'exécution sur le port 5000.";
      } else if (error.response?.status === 400) {
        errorMessage = "Email déjà utilisé ou données invalides";
      } else if (error.response?.status === 404) {
        errorMessage = "Point d'inscription non trouvé. Vérifiez si /api/auth/register existe sur le backend.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert("Erreur d'inscription", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-blue-50"
    >
      <StatusBar style="dark" />
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Logo/Header Section */}
          <View className="items-center mb-8">
          
            <Text className="text-3xl font-bold text-blue-800 mb-2">Inscription</Text>
            <Text className="text-gray-600 text-base">Créez votre compte pour commencer</Text>
          </View>

          {/* Form Card */}
          <View className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            {/* First Name & Last Name Row */}
            <View className="flex-row space-x-3 mb-5">
              <View className="flex-1">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">Prénom</Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                  <Text className="text-gray-400 text-lg mr-3">👤</Text>
                  <TextInput
                    className="flex-1 py-4 text-gray-800 text-base"
                    placeholder="mohamed"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={setFirstName}
                    value={firstName}
                    editable={!loading}
                  />
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">Nom</Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                  <Text className="text-gray-400 text-lg mr-3">👤</Text>
                  <TextInput
                    className="flex-1 py-4 text-gray-800 text-base"
                    placeholder="Ben Amor"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={setLastName}
                    value={lastName}
                    editable={!loading}
                  />
                </View>
              </View>
            </View>

            {/* Email Input */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Adresse Email</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                <Text className="text-gray-400 text-lg mr-3">📧</Text>
                <TextInput
                  className="flex-1 py-4 text-gray-800 text-base"
                  placeholder="etudiant@ecole.com"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={setEmail}
                  value={email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Mot de passe</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                <Text className="text-gray-400 text-lg mr-3">🔒</Text>
                <TextInput
                  className="flex-1 py-4 text-gray-800 text-base"
                  placeholder="Au moins 6 caractères"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={setPassword}
                  value={password}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </View>

            {/* Confirm Password Input */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Confirmer le mot de passe</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                <Text className="text-gray-400 text-lg mr-3">🔒</Text>
                <TextInput
                  className="flex-1 py-4 text-gray-800 text-base"
                  placeholder="Confirmez votre mot de passe"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={setConfirmPassword}
                  value={confirmPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className={`bg-blue-600 rounded-xl py-4 mb-4 shadow-md ${loading ? 'opacity-70' : ''}`}
              activeOpacity={0.8}
            >
              {loading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Inscription en cours...</Text>
                </View>
              ) : (
                <Text className="text-white font-bold text-lg text-center">S'inscrire</Text>
              )}
            </TouchableOpacity>

            {/* Terms and Conditions */}
            <Text className="text-gray-400 text-xs text-center mt-2">
              En vous inscrivant, vous acceptez nos conditions générales
            </Text>
          </View>

          {/* Sign In Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600 text-base">Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/SignInScreen')} disabled={loading}>
              <Text className="text-blue-600 font-bold text-base">Se connecter</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="mt-8">
            <Text className="text-gray-400 text-xs text-center">
              © 2024 Portail Scolaire. Tous droits réservés.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}