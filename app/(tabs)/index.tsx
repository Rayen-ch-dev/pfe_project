import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { getUserTickets, createReservation, getMonthlyMealsCount } from "../api/tickets";

export default function Index() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [remainingTickets, setRemainingTickets] = useState(0);
  const [monthlyMealsCount, setMonthlyMealsCount] = useState(0);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [dinnerCount, setDinnerCount] = useState(1);
  const [lunchCount, setLunchCount] = useState(1);

  useEffect(() => {
    if (token) {
      loadUserTickets();
    }
  }, [token]);

  const loadUserTickets = async () => {
    try {
      if (!token) return;
      const [ticketsResponse, mealsResponse] = await Promise.all([
        getUserTickets(token),
        getMonthlyMealsCount(token)
      ]);
      setRemainingTickets(ticketsResponse.data.remainingTickets || 0);
      setMonthlyMealsCount(mealsResponse.data.mealsCount || 0);
    } catch (error: any) {
      console.error("Failed to load user data:", error);
    }
  };

  const handleReserveMeal = async (mealType: 'LUNCH' | 'DINNER', count: number) => {
    try {
      // Enhanced validation with better user feedback
      if (!token) {
        Alert.alert(
          "⚠️ Connexion requise", 
          "Vous devez être connecté pour faire une réservation.\n\nVeuillez vous connecter et réessayer.",
          [{ text: "OK" }]
        );
        return;
      }

      if (!user || user.role !== "STUDENT") {
        Alert.alert(
          "⚠️ Accès refusé",
          "Seuls les étudiants peuvent faire des réservations.",
          [{ text: "OK" }]
        );
        return;
      }

      if (remainingTickets < count) {
        const mealName = mealType === 'LUNCH' ? 'déjeuner' : 'dîner';
        Alert.alert(
          "🎫 Tickets insuffisants",
          `Vous n'avez pas assez de tickets pour réserver ${count} ${mealName}(s).\n\n` +
          `Tickets disponibles: ${remainingTickets}\n` +
          `Tickets requis: ${count}\n\n` +
          `Veuillez acheter un package pour obtenir plus de tickets.`,
          [
            { text: "Annuler", style: "cancel" },
            { 
              text: "Acheter des tickets", 
              onPress: () => router.push("/(tabs)/tickets")
            }
          ]
        );
        return;
      }

      if (count < 1 || count > 2) {
        Alert.alert(
          "⚠️ Quantité invalide",
          "Vous pouvez réserver maximum 2 repas du même type par jour.\n\nLimite: 2 déjeuners et 2 dîners maximum par jour.",
          [{ text: "OK" }]
        );
        return;
      }

      const now = new Date();
      const startOfLocalDay = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

      /** Déjeuner jour J : entre veille 19h et J 8h30. */
      const isWithinLunchReservationWindow = (t: Date, mealDay: Date) => {
        const dayStart = startOfLocalDay(mealDay);
        const windowEnd = new Date(dayStart);
        windowEnd.setHours(8, 30, 0, 0);
        const windowStart = new Date(dayStart);
        windowStart.setDate(windowStart.getDate() - 1);
        windowStart.setHours(19, 0, 0, 0);
        const x = t.getTime();
        return x >= windowStart.getTime() && x < windowEnd.getTime();
      };

      /** Dîner jour J : entre veille 19h et J 14h. */
      const isWithinDinnerReservationWindow = (t: Date, mealDay: Date) => {
        const dayStart = startOfLocalDay(mealDay);
        const windowEnd = new Date(dayStart);
        windowEnd.setHours(14, 0, 0, 0);
        const windowStart = new Date(dayStart);
        windowStart.setDate(windowStart.getDate() - 1);
        windowStart.setHours(19, 0, 0, 0);
        const x = t.getTime();
        return x >= windowStart.getTime() && x < windowEnd.getTime();
      };

      const LUNCH_WINDOW_HINT =
        "Déjeuner : de 19h00 la veille jusqu'à 8h30 le jour du repas.";
      const DINNER_WINDOW_HINT =
        "Dîner : de 19h00 la veille jusqu'à 14h le jour du repas.";

      let restrictionMessage = "";
      let canReserve = false;
      let reservationDate = new Date();

      if (mealType === 'DINNER') {
        for (let offset = 0; offset < 3; offset++) {
          const candidate = new Date(now);
          candidate.setDate(candidate.getDate() + offset);
          if (!isWithinDinnerReservationWindow(now, candidate)) continue;
          reservationDate = new Date(candidate);
          reservationDate.setHours(19, 0, 0, 0);
          canReserve = true;
          break;
        }
        if (!canReserve) {
          restrictionMessage =
            "Ce n'est pas dans la fenêtre de réservation du dîner. " + DINNER_WINDOW_HINT;
        }
      } else if (mealType === 'LUNCH') {
        for (let offset = 0; offset < 3; offset++) {
          const candidate = new Date(now);
          candidate.setDate(candidate.getDate() + offset);
          if (!isWithinLunchReservationWindow(now, candidate)) continue;
          reservationDate = new Date(candidate);
          reservationDate.setHours(12, 0, 0, 0);
          canReserve = true;
          break;
        }

        if (!canReserve) {
          restrictionMessage =
            "Ce n'est pas dans la fenêtre de réservation du déjeuner. " + LUNCH_WINDOW_HINT;
        }
      }

      if (!canReserve && restrictionMessage) {
        Alert.alert(
          "⏰ Horaire de réservation",
          `${restrictionMessage}\n\n• ${DINNER_WINDOW_HINT}\n• ${LUNCH_WINDOW_HINT}`,
          [{ text: "OK" }]
        );
        return;
      }

      // Check existing reservations for the target day to enforce daily limits
      const targetDayStart = new Date(reservationDate);
      targetDayStart.setHours(0, 0, 0, 0); // Start of target day
      const targetDayEnd = new Date(reservationDate);
      targetDayEnd.setHours(23, 59, 59, 999); // End of target day

      const checkResponse = await createReservation("CHECK", targetDayStart, token, {
        forMealType: mealType,
      });
      const priorCount = checkResponse.data?.existingReservations ?? 0;
      const dayText =
        reservationDate.toDateString() === now.toDateString() ? "aujourd'hui" : "demain";

      if (priorCount >= 2 && count > 2 - priorCount) {
        const mealName = mealType === "LUNCH" ? "déjeuner" : "dîner";
        Alert.alert(
          "⚠️ Limite atteinte",
          `Vous avez déjà ${priorCount} réservation(s) de ${mealName} pour ${dayText}.\n\n` +
            `Limite maximale: 2 ${mealName}s par jour.\n` +
            `Vous pouvez encore en réserver: ${2 - priorCount}`,
          [{ text: "OK" }]
        );
        return;
      }

      // Show loading indicator
      
      Alert.alert(
        "🔄 Réservation en cours",
        `Création de ${count} réservation(s) pour ${mealType === 'LUNCH' ? 'déjeuner' : 'dîner'} ${dayText}...`,
        [{ text: "OK" }]
      );
      
      let successfulReservations = 0;
      let alreadyExistingCount = 0;
      let errorMessages: string[] = [];

      // Process reservations one by one with better error handling
      for (let i = 0; i < count; i++) {
        const currentReservationDate = new Date(reservationDate);
        if (mealType === 'LUNCH') {
          currentReservationDate.setHours(12, 0, 0, 0);
        } else {
          currentReservationDate.setHours(19, 0, 0, 0);
        }
        
        try {
          const response = await createReservation(mealType, currentReservationDate, token);
          
          if (response.data?.message?.includes("successfully")) {
            successfulReservations++;
          } else {
            errorMessages.push(`Réservation ${i + 1}: ${response.data?.message || 'Erreur inconnue'}`);
          }
        } catch (singleError: any) {
          const errorMessage = singleError.response?.data?.message || singleError.message || 'Erreur réseau';
          
          if (errorMessage.includes("already exists")) {
            alreadyExistingCount++;
          } else if (errorMessage.includes("No tickets available")) {
            errorMessages.push(`Plus de tickets disponibles pour la réservation ${i + 1}`);
          } else if (errorMessage.includes("Server error")) {
            errorMessages.push(`Erreur serveur pour la réservation ${i + 1}`);
          } else {
            errorMessages.push(`Réservation ${i + 1}: ${errorMessage}`);
          }
        }
      }

      // Enhanced user feedback based on results
      const mealName = mealType === 'LUNCH' ? 'déjeuner' : 'dîner';
      
      if (successfulReservations > 0) {
        let title = "✅ Réservation réussie";
        let message = `${successfulReservations} ${mealName}(s) réservé(s) avec succès ${dayText}!`;
        
        if (alreadyExistingCount > 0) {
          title = "⚠️ Réservation partielle";
          message = `${successfulReservations} ${mealName}(s) créé(s) avec succès!\n${alreadyExistingCount} réservation(s) existaient déjà.`;
        }
        
        if (errorMessages.length > 0 && errorMessages.length < 3) {
          message += `\n\nErreurs:\n${errorMessages.join('\n')}`;
        }
        
        Alert.alert(
          title,
          message,
          [{ text: "OK", onPress: () => loadUserTickets() }]
        );
        
      } else if (alreadyExistingCount > 0) {
        Alert.alert(
          "ℹ️ Information",
          `Impossible d’ajouter ces réservations : la limite est de 2 ${mealName}s par jour pour la même date, ou une réservation identique existe déjà.`,
          [{ text: "OK" }]
        );
      } else {
        let errorMessage = "Aucune réservation n'a pu être créée.";
        
        if (errorMessages.length > 0) {
          errorMessage = `Erreurs rencontrées:\n${errorMessages.slice(0, 3).join('\n')}`;
          if (errorMessages.length > 3) {
            errorMessage += `\n...et ${errorMessages.length - 3} autre(s) erreur(s)`;
          }
        }
        
        Alert.alert(
          "❌ Échec de la réservation",
          errorMessage,
          [
            { text: "Annuler", style: "cancel" },
            { text: "Réessayer", onPress: () => handleReserveMeal(mealType, count) }
          ]
        );
      }

      // Always refresh tickets after attempt
      loadUserTickets();
      
    } catch (error: any) {
      console.error("Critical reservation error:", error);
      
      Alert.alert(
        "❌ Erreur système",
        "Une erreur technique est survenue. Veuillez réessayer plus tard ou contacter le support.\n\nDétails: " + 
        (error.message || "Erreur inconnue"),
        [
          { text: "OK" },
          { 
            text: "Réessayer", 
            onPress: () => handleReserveMeal(mealType, count) 
          }
        ]
      );
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email?.split('@')[0] || "Étudiant";
  };

  const getRoleLabel = () => {
    if (user?.role === "STUDENT") return "Étudiant";
    if (user?.role === "AGENT_RESTAURANT") return "Agent Restaurant";
    return "Utilisateur";
  };

  const getFeatures = () => {
    if (user?.role === "STUDENT") {
      return [
        { icon: "📱", title: "Mon QR Code", description: "Présentez votre QR code pour vos repas", color: "#2563EB", route: "/(tabs)/qr" },
        {
          icon: "🍽", title: "Réserver un repas", description: "Utilisez vos tickets pour réserver", color: "#10B981",
          onPress: () => {
            console.log('Reservation button pressed');
            setShowReservationModal(true);
          }
        },
        { icon: "🔔", title: "Notifications", description: "Restez informé des actualités", color: "#EF4444", route: null },
      ];
    } else if (user?.role === "AGENT_RESTAURANT") {
      return [
        { icon: "📷", title: "Scanner QR", description: "Scannez les QR codes des étudiants", color: "#2563EB", route: "/(tabs)/scan" },
        { icon: "📊", title: "Statistiques", description: "Consultez les repas servis", color: "#10B981", route: null },
      ];
    }
    return [];
  };

  const features = getFeatures();

  return (
    // FIX 1: Single root <View> wrapping both ScrollView and Modal
    <View style={{ flex: 1 }}>
      <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View className="bg-blue-600 pt-12 pb-8 px-6 rounded-b-3xl shadow-lg">
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
                <Text className="text-white text-2xl font-bold">{monthlyMealsCount}</Text>
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

          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                console.log('Feature pressed:', feature.title);
                if (feature.onPress) {
                  feature.onPress();
                } else if (feature.route) {
                  router.push(feature.route);
                }
              }}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100 active:opacity-80"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: `${feature.color}15` }}>
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

        {/* Recent Activity - Only for Students */}
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
            2026 Portail Scolaire. Tous droits réservés.
          </Text>
        </View>
      </ScrollView>

      {/* FIX 2: Modal is now a proper sibling of ScrollView inside the root View */}
      <Modal
        visible={showReservationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReservationModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-2xl p-6 m-4 w-11/12">
            <Text className="text-xl font-bold text-gray-800 mb-4">Réserver vos repas</Text>
            <Text className="text-gray-600 text-sm mb-6">Combien de repas voulez-vous réserver?</Text>

            {/* Dinner */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">🌙 Dîner</Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  className="bg-gray-100 rounded-lg w-8 h-8 items-center justify-center mr-2"
                  onPress={() => setDinnerCount(Math.max(0, dinnerCount - 1))}
                >
                  <Text className="text-xl">-</Text>
                </TouchableOpacity>
                <TextInput
                  className="bg-gray-100 rounded-lg px-3 py-2 text-center flex-1"
                  keyboardType="numeric"
                  value={dinnerCount.toString()}
                  onChangeText={(text) => setDinnerCount(parseInt(text) || 0)}
                  placeholder="0"
                />
                <TouchableOpacity
                  className="bg-blue-500 rounded-lg w-8 h-8 items-center justify-center ml-2"
                  onPress={() => setDinnerCount(dinnerCount + 1)}
                >
                  <Text className="text-xl text-white">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Lunch */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">☀️ Déjeuner</Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  className="bg-gray-100 rounded-lg w-8 h-8 items-center justify-center mr-2"
                  onPress={() => setLunchCount(Math.max(0, lunchCount - 1))}
                >
                  <Text className="text-xl">-</Text>
                </TouchableOpacity>
                <TextInput
                  className="bg-gray-100 rounded-lg px-3 py-2 text-center flex-1"
                  keyboardType="numeric"
                  value={lunchCount.toString()}
                  onChangeText={(text) => setLunchCount(parseInt(text) || 0)}
                  placeholder="0"
                />
                <TouchableOpacity
                  className="bg-blue-500 rounded-lg w-8 h-8 items-center justify-center ml-2"
                  onPress={() => setLunchCount(lunchCount + 1)}
                >
                  <Text className="text-xl text-white">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row justify-between mt-6 gap-3">
              <TouchableOpacity
                className="bg-gray-200 rounded-lg px-6 py-3 flex-1 items-center"
                onPress={() => setShowReservationModal(false)}
              >
                <Text className="text-gray-700 font-semibold">Annuler</Text>
              </TouchableOpacity>

              {/* FIX 3: async sequential calls, totalMeals defined before use */}
              <TouchableOpacity
                className="bg-green-500 rounded-lg px-6 py-3 flex-1 items-center"
                onPress={async () => {
                  const totalMeals = dinnerCount + lunchCount;
                  if (totalMeals === 0) {
                    Alert.alert("Erreur", "Veuillez sélectionner au moins un repas.");
                    return;
                  }
                  if (totalMeals > remainingTickets) {
                    Alert.alert("Erreur", `Pas assez de tickets pour ${totalMeals} repas. Vous avez ${remainingTickets} tickets.`);
                    return;
                  }
                  if (dinnerCount > 0) await handleReserveMeal('DINNER', dinnerCount);
                  if (lunchCount > 0) await handleReserveMeal('LUNCH', lunchCount);
                  setShowReservationModal(false);
                }}
              >
                <Text className="text-white font-semibold">Réserver ({dinnerCount + lunchCount} repas)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}