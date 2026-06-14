import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { getUserTickets, createReservation, getMonthlyMealsCount, getAgentStatistics } from "../api/tickets";

const { width } = Dimensions.get("window");

// Simple bar chart component
const BarChart: React.FC<{
  data: { hour: string; count: number }[];
  maxValue: number;
  color: string;
}> = ({ data, maxValue, color }) => {
  const barWidth = (width - 80) / data.length - 8;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 80, gap: 8 }}>
      {data.map((item, i) => {
        const barH = maxValue > 0 ? Math.round((item.count / maxValue) * 72) : 0;
        return (
          <View key={i} style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4 }}>{item.count}</Text>
            <View style={{ width: barWidth, height: barH || 4, backgroundColor: color, borderRadius: 4, opacity: item.count === 0 ? 0.2 : 1 }} />
            <Text style={{ fontSize: 9, color: "#9ca3af", marginTop: 4 }}>{item.hour}</Text>
          </View>
        );
      })}
    </View>
  );
};

// Donut ring component
const DonutRing: React.FC<{
  scanned: number;
  total: number;
  size: number;
  color: string;
  label: string;
}> = ({ scanned, total, size, color, label }) => {
  const pct = total > 0 ? Math.round((scanned / total) * 100) : 0;
  const remaining = total - scanned;
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: size * 0.13,
        borderColor: "#f3f4f6",
        alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        {/* Filled arc approximation using two half-circles */}
        <View style={{
          position: "absolute", width: size, height: size,
          borderRadius: size / 2,
          borderWidth: size * 0.13,
          borderColor: color,
          borderRightColor: pct > 50 ? color : "transparent",
          borderBottomColor: pct > 25 ? color : "transparent",
          borderLeftColor: pct > 75 ? color : "transparent",
          borderTopColor: "transparent",
          transform: [{ rotate: "-90deg" }],
        }} />
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: size * 0.18, fontWeight: "700", color: "#1f2937" }}>{pct}%</Text>
          <Text style={{ fontSize: size * 0.1, color: "#6b7280" }}>passés</Text>
        </View>
      </View>
      <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>{label}</Text>
      <Text style={{ fontSize: 11, color: "#9ca3af" }}>{scanned}/{total}</Text>
    </View>
  );
};

export default function Index() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [remainingTickets, setRemainingTickets] = useState(0);
  const [monthlyMealsCount, setMonthlyMealsCount] = useState(0);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [dinnerCount, setDinnerCount] = useState(1);
  const [lunchCount, setLunchCount] = useState(1);

  const [stats, setStats] = useState({
    totalExpected: 0,
    scanned: 0,
    lunch: { expected: 0, scanned: 0 },
    dinner: { expected: 0, scanned: 0 },
    hourly: Array.from({ length: 12 }, (_, i) => ({ hour: `${i + 11}h`, count: 0 })),
    recentScans: [],
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (token) {
      loadUserTickets();
      if (user?.role === "AGENT_RESTAURANT") loadAgentStats();
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

  const loadAgentStats = async () => {
    try {
      if (!token) return;
      const response = await getAgentStatistics(token);
      setStats(response.data);
      setLastRefresh(new Date());
    } catch (error: any) {
      console.error("Failed to load agent stats:", error);
    }
  };

  const handleReserveMeal = async (mealType: 'LUNCH' | 'DINNER', count: number) => {
    try {
      if (!token) { Alert.alert("⚠️ Connexion requise", "Vous devez être connecté.", [{ text: "OK" }]); return; }
      if (!user || user.role !== "STUDENT") { Alert.alert("⚠️ Accès refusé", "Seuls les étudiants peuvent faire des réservations.", [{ text: "OK" }]); return; }
      if (remainingTickets < count) {
        Alert.alert("🎫 Tickets insuffisants",
          `Tickets disponibles: ${remainingTickets}\nTickets requis: ${count}`,
          [{ text: "Annuler", style: "cancel" }, { text: "Acheter des tickets", onPress: () => router.push("/(tabs)/tickets") }]);
        return;
      }
      if (count < 1 || count > 2) { Alert.alert("⚠️ Quantité invalide", "Maximum 2 repas du même type par jour.", [{ text: "OK" }]); return; }

      const now = new Date();
      const startOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const isWithinLunchWindow = (t: Date, d: Date) => {
        const s = new Date(startOfLocalDay(d)); s.setDate(s.getDate() - 1); s.setHours(19, 0, 0, 0);
        const e = new Date(startOfLocalDay(d)); e.setHours(8, 30, 0, 0);
        return t.getTime() >= s.getTime() && t.getTime() < e.getTime();
      };
      const isWithinDinnerWindow = (t: Date, d: Date) => {
        const s = new Date(startOfLocalDay(d)); s.setDate(s.getDate() - 1); s.setHours(19, 0, 0, 0);
        const e = new Date(startOfLocalDay(d)); e.setHours(14, 0, 0, 0);
        return t.getTime() >= s.getTime() && t.getTime() < e.getTime();
      };

      let canReserve = false;
      let reservationDate = new Date();
      const windowCheck = mealType === 'LUNCH' ? isWithinLunchWindow : isWithinDinnerWindow;
      for (let offset = 0; offset < 3; offset++) {
        const candidate = new Date(now); candidate.setDate(candidate.getDate() + offset);
        if (!windowCheck(now, candidate)) continue;
        reservationDate = new Date(candidate);
        reservationDate.setHours(mealType === 'LUNCH' ? 12 : 19, 0, 0, 0);
        canReserve = true; break;
      }

      if (!canReserve) {
        Alert.alert("⏰ Horaire de réservation",
          `• Déjeuner : de 19h00 la veille jusqu'à 8h30.\n• Dîner : de 19h00 la veille jusqu'à 14h.`,
          [{ text: "OK" }]);
        return;
      }

      const checkResponse = await createReservation("CHECK", reservationDate, token, { forMealType: mealType });
      const priorCount = checkResponse.data?.existingReservations ?? 0;
      const dayText = reservationDate.toDateString() === now.toDateString() ? "aujourd'hui" : "demain";

      if (priorCount >= 2) {
        Alert.alert("⚠️ Limite atteinte", `Limite de 2 ${mealType === 'LUNCH' ? 'déjeuners' : 'dîners'} par jour atteinte pour ${dayText}.`, [{ text: "OK" }]);
        return;
      }

      let successfulReservations = 0;
      let alreadyExistingCount = 0;
      let errorMessages: string[] = [];

      for (let i = 0; i < count; i++) {
        const d = new Date(reservationDate);
        try {
          const response = await createReservation(mealType, d, token);
          if (response.data?.message?.includes("successfully")) successfulReservations++;
          else errorMessages.push(response.data?.message || 'Erreur inconnue');
        } catch (e: any) {
          const msg = e.response?.data?.message || e.message || 'Erreur réseau';
          if (msg.includes("already exists")) alreadyExistingCount++;
          else errorMessages.push(msg);
        }
      }

      const mealName = mealType === 'LUNCH' ? 'déjeuner' : 'dîner';
      if (successfulReservations > 0) {
        Alert.alert("✅ Réservation réussie", `${successfulReservations} ${mealName}(s) réservé(s) pour ${dayText}!`, [{ text: "OK", onPress: loadUserTickets }]);
      } else if (alreadyExistingCount > 0) {
        Alert.alert("ℹ️ Information", `Une réservation identique existe déjà pour ${dayText}.`, [{ text: "OK" }]);
      } else {
        Alert.alert("❌ Échec", errorMessages.slice(0, 2).join('\n'), [{ text: "OK" }]);
      }
      loadUserTickets();
    } catch (error: any) {
      Alert.alert("❌ Erreur système", error.message || "Erreur inconnue", [{ text: "OK" }]);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
  };
  const getUserName = () => {
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    return user?.email?.split('@')[0] || "Utilisateur";
  };
  const getRoleLabel = () => {
    if (user?.role === "STUDENT") return "Étudiant";
    if (user?.role === "AGENT_RESTAURANT") return "Agent Restaurant";
    return "Utilisateur";
  };

  const notYetArrived = stats.totalExpected - stats.scanned;
  const overallPct = stats.totalExpected > 0 ? Math.round((stats.scanned / stats.totalExpected) * 100) : 0;
  const maxHourly = Math.max(...stats.hourly.map(h => h.count), 1);
  const todayLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const refreshLabel = lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const features = user?.role === "STUDENT" ? [
    { icon: "📱", title: "Mon QR Code", description: "Présentez votre QR code pour vos repas", color: "#2563EB", route: "/(tabs)/qr" },
    { icon: "🍽", title: "Réserver un repas", description: "Utilisez vos tickets pour réserver", color: "#10B981", onPress: () => setShowReservationModal(true) },
    { icon: "🔔", title: "Notifications", description: "Restez informé des actualités", color: "#EF4444", route: null },
  ] : [];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View className="bg-blue-600 pt-12 pb-8 px-6 rounded-b-3xl shadow-lg">
          <View className="mb-4">
            <Text className="text-blue-100 text-base mb-1">{getGreeting()}</Text>
            <Text className="text-white text-2xl font-bold mb-1">{getUserName()}</Text>
            <View className="flex-row items-center mt-2">
              <View className="bg-blue-500 rounded-full px-3 py-1">
                <Text className="text-blue-100 text-xs font-semibold">{getRoleLabel()}</Text>
              </View>
            </View>
          </View>

          {user?.role === "STUDENT" && (
            <View className="flex-row justify-between mt-4">
              <View className="bg-white/10 rounded-xl p-4 flex-1 mr-2">
                <Text className="text-white text-2xl font-bold">{monthlyMealsCount}</Text>
                <Text className="text-blue-100 text-xs mt-1">Repas ce mois</Text>
              </View>
              <View className="bg-white/10 rounded-xl p-4 flex-1 mx-1">
                <Text className="text-white text-2xl font-bold">{remainingTickets}</Text>
                <Text className="text-blue-100 text-xs mt-1">Tickets restants</Text>
              </View>
              <TouchableOpacity className="bg-white/10 rounded-xl p-4 flex-1 ml-2 active:opacity-80" onPress={() => router.push("/(tabs)/tickets")}>
                <Text className="text-white text-2xl font-bold">+</Text>
                <Text className="text-blue-100 text-xs mt-1">Acheter tickets</Text>
              </TouchableOpacity>
            </View>
          )}

          {user?.role === "AGENT_RESTAURANT" && (
            <View className="flex-row justify-between mt-4">
              <View className="bg-white/10 rounded-xl p-4 flex-1 mr-2">
                <Text className="text-white text-2xl font-bold">{stats.scanned}</Text>
                <Text className="text-blue-100 text-xs mt-1">Passés </Text>
              </View>
              <View className="bg-white/10 rounded-xl p-4 flex-1 mx-1">
                <Text className="text-white text-2xl font-bold">{notYetArrived}</Text>
                <Text className="text-blue-100 text-xs mt-1">En attente </Text>
              </View>
              <View className="bg-white/10 rounded-xl p-4 flex-1 ml-2">
                <Text className="text-white text-2xl font-bold">{stats.totalExpected}</Text>
                <Text className="text-blue-100 text-xs mt-1">Total prévu </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── AGENT STATISTICS ── */}
        {user?.role === "AGENT_RESTAURANT" && (
          <View className="px-5 py-6 space-y-5">

            {/* Section header */}
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-gray-800 text-xl font-bold">Tableau de bord</Text>
                <Text className="text-gray-400 text-xs mt-0.5 capitalize">{todayLabel}</Text>
              </View>
              <TouchableOpacity
                onPress={loadAgentStats}
                className="flex-row items-center bg-blue-50 rounded-xl px-3 py-2"
              >
                <Text className="text-blue-600 text-xs font-semibold">↻  {refreshLabel}</Text>
              </TouchableOpacity>
            </View>

            {/* ── Overall progress card ── */}
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <Text className="text-gray-700 font-semibold mb-4">Progression globale</Text>
              <View className="flex-row items-center mb-3">
                <Text className="text-4xl font-bold text-gray-900 mr-3">{overallPct}%</Text>
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs mb-1">{stats.scanned} scannés sur {stats.totalExpected} prévus</Text>
                  <View className="bg-gray-100 rounded-full h-3 overflow-hidden">
                    <View style={{ width: `${overallPct}%`, backgroundColor: "#2563eb" }} className="h-full rounded-full" />
                  </View>
                </View>
              </View>
              <View className="flex-row mt-2 gap-4">
                <View className="flex-row items-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-1.5" />
                  <Text className="text-gray-500 text-xs">Scannés: <Text className="font-bold text-gray-800">{stats.scanned}</Text></Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-gray-200 mr-1.5" />
                  <Text className="text-gray-500 text-xs">Non arrivés: <Text className="font-bold text-gray-800">{notYetArrived}</Text></Text>
                </View>
              </View>
            </View>

            {/* ── Donut rings: Lunch & Dinner ── */}
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <Text className="text-gray-700 font-semibold mb-5">Répartition par repas</Text>
              <View className="flex-row justify-around">
                <DonutRing
                  scanned={stats.lunch.scanned}
                  total={stats.lunch.expected}
                  size={110}
                  color="#f97316"
                  label=" Déjeuner"
                />
                <DonutRing
                  scanned={stats.dinner.scanned}
                  total={stats.dinner.expected}
                  size={110}
                  color="#9333ea"
                  label=" Dîner"
                />
              </View>

              {/* Mini legend */}
              <View className="flex-row justify-around mt-5 pt-4 border-t border-gray-100">
                <View className="items-center">
                  <Text className="text-orange-500 text-xl font-bold">{stats.lunch.expected - stats.lunch.scanned}</Text>
                  <Text className="text-gray-400 text-xs">encore attendus</Text>
                  <Text className="text-gray-500 text-xs font-medium">Déjeuner</Text>
                </View>
                <View className="w-px bg-gray-100" />
                <View className="items-center">
                  <Text className="text-purple-600 text-xl font-bold">{stats.dinner.expected - stats.dinner.scanned}</Text>
                  <Text className="text-gray-400 text-xs">encore attendus</Text>
                  <Text className="text-gray-500 text-xs font-medium">Dîner</Text>
                </View>
              </View>
            </View>

            {/* ── Hourly bar chart ── */}
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <Text className="text-gray-700 font-semibold mb-1">Passages par heure</Text>
              <Text className="text-gray-400 text-xs mb-5">Aujourd'hui</Text>
              <BarChart data={stats.hourly} maxValue={maxHourly} color="#2563eb" />
            </View>

            {/* ── Status breakdown row ── */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-green-50 rounded-2xl p-4 border border-green-100 items-center">
                <Text className="text-2xl mb-1"></Text>
                <Text className="text-green-600 text-2xl font-bold">{stats.scanned}</Text>
                <Text className="text-gray-500 text-xs text-center mt-1">Déjà passés</Text>
              </View>
              <View className="flex-1 bg-yellow-50 rounded-2xl p-4 border border-yellow-100 items-center">
                <Text className="text-2xl mb-1"></Text>
                <Text className="text-yellow-500 text-2xl font-bold">{notYetArrived}</Text>
                <Text className="text-gray-500 text-xs text-center mt-1">Pas encore arrivés</Text>
              </View>
              <View className="flex-1 bg-blue-50 rounded-2xl p-4 border border-blue-100 items-center">
                <Text className="text-2xl mb-1"></Text>
                <Text className="text-blue-600 text-2xl font-bold">{stats.totalExpected}</Text>
                <Text className="text-gray-500 text-xs text-center mt-1">Total prévu</Text>
              </View>
            </View>

            {/* ── Recent scans ── */}
            <View>
              <Text className="text-gray-800 text-lg font-bold mb-3">Derniers passages</Text>
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {stats.recentScans.map((scan, index) => (
                  <View
                    key={index}
                    className={`flex-row items-center px-4 py-3 ${index < stats.recentScans.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center mr-3">
                      <Text className="text-white font-bold text-sm">
                        {scan.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-800 font-semibold text-sm">{scan.name}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">{scan.time}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${scan.mealType === 'LUNCH' ? 'bg-orange-100' : 'bg-purple-100'}`}>
                      <Text className={`text-xs font-semibold ${scan.mealType === 'LUNCH' ? 'text-orange-600' : 'text-purple-600'}`}>
                        {scan.mealType === 'LUNCH' ? ' Déjeuner' : ' Dîner'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

          </View>
        )}

        {/* ── STUDENT section ── */}
        {user?.role === "STUDENT" && (
          <>
            <View className="px-6 py-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-gray-800 text-xl font-bold">Actions rapides</Text>
              </View>
              {features.map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => { if (feature.onPress) feature.onPress(); else if (feature.route) router.push(feature.route as any); }}
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
            <View className="px-6 pb-8">
              <Text className="text-gray-800 text-xl font-bold mb-4">Activité récente</Text>
              <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center pb-3 border-b border-gray-100">
                  <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-green-600 text-lg"></Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold">Repas validé</Text>
                    <Text className="text-gray-500 text-xs mt-1">Aujourd'hui, 12:30</Text>
                  </View>
                  <Text className="text-green-600 text-xs font-semibold">Terminé</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Footer */}
        <View className="px-6 pb-10">
          <Text className="text-gray-400 text-xs text-center">
            2026 Portail de Restauration Universitaire. Tous droits réservés.
          </Text>
        </View>
      </ScrollView>

      {/* Reservation Modal */}
      <Modal visible={showReservationModal} animationType="slide" transparent onRequestClose={() => setShowReservationModal(false)}>
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-2xl p-6 m-4 w-11/12">
            <Text className="text-xl font-bold text-gray-800 mb-2">Réserver vos repas</Text>
            <Text className="text-gray-600 text-sm mb-6">Combien de repas voulez-vous réserver ?</Text>

            {/* Dinner */}
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2"> Dîner</Text>
              <View className="flex-row items-center">
                <TouchableOpacity className="bg-gray-100 rounded-lg w-8 h-8 items-center justify-center mr-2" onPress={() => setDinnerCount(Math.max(0, dinnerCount - 1))}>
                  <Text className="text-xl">-</Text>
                </TouchableOpacity>
                <TextInput className="bg-gray-100 rounded-lg px-3 py-2 text-center flex-1" keyboardType="numeric" value={dinnerCount.toString()} onChangeText={(t) => setDinnerCount(parseInt(t) || 0)} placeholder="0" />
                <TouchableOpacity className="bg-blue-500 rounded-lg w-8 h-8 items-center justify-center ml-2" onPress={() => setDinnerCount(dinnerCount + 1)}>
                  <Text className="text-xl text-white">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Lunch */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2"> Déjeuner</Text>
              <View className="flex-row items-center">
                <TouchableOpacity className="bg-gray-100 rounded-lg w-8 h-8 items-center justify-center mr-2" onPress={() => setLunchCount(Math.max(0, lunchCount - 1))}>
                  <Text className="text-xl">-</Text>
                </TouchableOpacity>
                <TextInput className="bg-gray-100 rounded-lg px-3 py-2 text-center flex-1" keyboardType="numeric" value={lunchCount.toString()} onChangeText={(t) => setLunchCount(parseInt(t) || 0)} placeholder="0" />
                <TouchableOpacity className="bg-blue-500 rounded-lg w-8 h-8 items-center justify-center ml-2" onPress={() => setLunchCount(lunchCount + 1)}>
                  <Text className="text-xl text-white">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row justify-between gap-3">
              <TouchableOpacity className="bg-gray-200 rounded-lg px-6 py-3 flex-1 items-center" onPress={() => setShowReservationModal(false)}>
                <Text className="text-gray-700 font-semibold">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-green-500 rounded-lg px-6 py-3 flex-1 items-center"
                onPress={async () => {
                  const total = dinnerCount + lunchCount;
                  if (total === 0) { Alert.alert("Erreur", "Sélectionnez au moins un repas."); return; }
                  if (total > remainingTickets) { Alert.alert("Erreur", `Pas assez de tickets (${remainingTickets} disponibles).`); return; }
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