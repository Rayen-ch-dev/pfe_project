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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { login } from "../api/auth";
import { StatusBar } from "expo-status-bar";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      const res = await login({ email, password });
      const token = res.data.token;
      const user = res.data.user;
      
      await authLogin(token, user);
      Alert.alert("Succès", "Connexion réussie");
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("Login failed:", err);
      
      let errorMessage = "Échec de la connexion";
      
      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        errorMessage = "Impossible de se connecter au serveur. Assurez-vous que le backend est en cours d'exécution sur le port 5000.";
      } else if (err.response?.status === 401) {
        errorMessage = "Email ou mot de passe invalide";
      } else if (err.response?.status === 404) {
        errorMessage = "Point de connexion non trouvé. Vérifiez si /api/auth/login existe sur le backend.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Alert.alert("Erreur de connexion", errorMessage);
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
          <View className="items-center mb-12">
            <View className="w-24 h-24 bg-blue-600 rounded-full items-center justify-center mb-4 shadow-lg">
              <Text className="text-white text-4xl font-bold">📚</Text>
            </View>
            <Text className="text-3xl font-bold text-blue-800 mb-2">Portail Scolaire</Text>
            <Text className="text-gray-600 text-base">Connectez-vous pour continuer à apprendre</Text>
          </View>

          {/* Form Card */}
          <View className="bg-white rounded-2xl shadow-xl p-6 mb-6">
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
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Mot de passe</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
                <Text className="text-gray-400 text-lg mr-3">🔒</Text>
                <TextInput
                  className="flex-1 py-4 text-gray-800 text-base"
                  placeholder="Entrez votre mot de passe"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={setPassword}
                  value={password}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity 
              onPress={() => Alert.alert("Réinitialisation", "Fonctionnalité de réinitialisation du mot de passe bientôt disponible")}
              className="mb-6"
              disabled={loading}
            >
              <Text className="text-blue-600 text-right text-sm font-semibold">Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`bg-blue-600 rounded-xl py-4 mb-4 shadow-md ${loading ? 'opacity-70' : ''}`}
              activeOpacity={0.8}
            >
              {loading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Connexion en cours...</Text>
                </View>
              ) : (
                <Text className="text-white font-bold text-lg text-center">Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Demo Credentials Card */}
            <View className="bg-blue-50 rounded-lg p-3 mt-2 border border-blue-100">
              <Text className="text-blue-800 text-xs text-center font-medium mb-1">
                📝 Identifiants de démonstration
              </Text>
              <Text className="text-gray-600 text-xs text-center">
                Email: student@school.com
              </Text>
              <Text className="text-gray-600 text-xs text-center">
                Mot de passe: password123
              </Text>
            </View>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600 text-base">Pas encore de compte ? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/SignUpScreen')} disabled={loading}>
              <Text className="text-blue-600 font-bold text-base">S'inscrire</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="mt-8">
            <Text className="text-gray-400 text-xs text-center">
              © 2026 Portail Scolaire. Tous droits réservés.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}