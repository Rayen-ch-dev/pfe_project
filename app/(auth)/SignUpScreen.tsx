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
  Image,
  Modal
} from "react-native";
import { useRouter } from "expo-router";
import { register } from "../api/auth";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const router = useRouter();

  const pickDocument = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Vous devez autoriser l\'accès à la caméra pour prendre une photo');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocumentImage(result.assets[0].uri);
        setShowDocumentModal(false);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };

  const selectDocumentFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocumentImage(result.assets[0].uri);
        setShowDocumentModal(false);
      }
    } catch (error) {
      console.error('Error selecting document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const convertImageToBase64 = async (imageUri: string): Promise<string> => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Impossible de convertir l\'image');
    }
  };

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

    if (!documentImage) {
      Alert.alert("Erreur", "Veuillez télécharger un document d'identification");
      return;
    }

    setLoading(true);
    try {
      // Convert image to base64
      const base64Image = await convertImageToBase64(documentImage);
      
      await register({ 
        firstName, 
        lastName, 
        email, 
        password, 
        documentImage: base64Image 
      });
      
      Alert.alert(
        "Succès", 
        "Compte créé avec succès ! Votre compte est en attente d'approbation par l'administrateur. Vous serez notifié une fois approuvé."
      );
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

            {/* Document Upload Section */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Document d'identification</Text>
              <Text className="text-gray-500 text-xs mb-3">Carte étudiante, carte d'identité ou certificat d'immatriculation</Text>
              
              <TouchableOpacity
                onPress={() => setShowDocumentModal(true)}
                disabled={loading}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50"
                activeOpacity={0.7}
              >
                {documentImage ? (
                  <View className="items-center">
                    <Image 
                      source={{ uri: documentImage }} 
                      className="w-24 h-24 rounded-lg mb-2"
                      resizeMode="cover"
                    />
                    <Text className="text-green-600 text-sm font-medium">Document téléchargé </Text>
                    <TouchableOpacity
                      onPress={() => setShowDocumentModal(true)}
                      className="mt-2"
                    >
                      <Text className="text-blue-600 text-xs underline">Changer le document</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="items-center">
                    <Text className="text-gray-600 text-sm font-medium text-center">
                      Appuyez pour télécharger un document
                    </Text>
                    <Text className="text-gray-400 text-xs text-center mt-1">
                      Photo ou galerie
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
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
              2026 Portail de Restauration Universitaire. Tous droits réservés.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Document Selection Modal */}
      <Modal
        visible={showDocumentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDocumentModal(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-6 text-center">
              Sélectionner un document
            </Text>
            
            <View className="space-y-4">
              <TouchableOpacity
                onPress={pickDocument}
                className="bg-blue-600 rounded-xl p-4 flex-row items-center justify-center"
                activeOpacity={0.8}
              >
                <Text className="text-white text-2xl mr-3">📷</Text>
                <Text className="text-white font-semibold text-base">
                  Prendre une photo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={selectDocumentFromGallery}
                className="bg-green-600 rounded-xl p-4 flex-row items-center justify-center"
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-base">
                  Choisir depuis la galerie
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDocumentModal(false)}
                className="bg-gray-200 rounded-xl p-4"
                activeOpacity={0.8}
              >
                <Text className="text-gray-800 font-semibold text-center">
                  Annuler
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-6 p-4 bg-gray-50 rounded-xl">
              <Text className="text-gray-600 text-xs text-center">
                Documents acceptés : Carte étudiante, Carte d'identité, Certificat d'immatriculation
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}