import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, TextInput, Modal, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  getPackages, purchasePackage, purchaseCustomTickets,
  getUserTickets, Package,
} from "../api/tickets";

interface EnhancedPackage extends Package {
  tickets: number;
}

// ─── Modal types ────────────────────────────────────────────────────────────

type ModalState =
  | { type: "none" }
  | { type: "confirm_package"; pkg: EnhancedPackage }
  | { type: "confirm_custom"; tickets: number; price: number }
  | { type: "success"; title: string; packageName: string; tickets: number; price: number; onOk: () => void }
  | { type: "error"; message: string };

// ─── Reusable Purchase Modal ─────────────────────────────────────────────────

const PurchaseModal = ({
  state,
  purchasing,
  onConfirm,
  onCancel,
}: {
  state: ModalState;
  purchasing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  const visible = state.type !== "none";

  const isSuccess = state.type === "success";
  const isError = state.type === "error";
  const isConfirm = state.type === "confirm_package" || state.type === "confirm_custom";

  const headerTitle = isSuccess
    ? "Réservation confirmée"
    : isError
    ? "Erreur"
    : "Confirmation d'achat";

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={ms.overlay}>
        <View style={ms.card}>

          {/* Header */}
          <View style={[ms.header, isSuccess && ms.headerSuccess, isError && ms.headerError]}>
            {isSuccess && (
              <View style={ms.successIcon}>
                <Ionicons name="checkmark" size={24} color="#fff" />
              </View>
            )}
            {isError && (
              <View style={ms.errorIcon}>
                <Ionicons name="close" size={24} color="#fff" />
              </View>
            )}
            {isConfirm && (
              <Text style={ms.headerSub}>CONFIRMATION D'ACHAT</Text>
            )}
            <Text style={ms.headerTitle}>{headerTitle}</Text>
          </View>

          {/* Body */}
          <View style={ms.body}>

            {/* Error */}
            {isError && state.type === "error" && (
              <>
                <Text style={ms.errorText}>{state.message}</Text>
                <TouchableOpacity style={ms.btnFillFull} onPress={onCancel}>
                  <Text style={ms.btnFillText}>OK</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Confirm package or custom */}
            {isConfirm && (state.type === "confirm_package" || state.type === "confirm_custom") && (
              <>
                <View style={ms.summaryBox}>
                  {state.type === "confirm_package" && (
                    <>
                      <SummaryRow label="Package" value={state.pkg.name} />
                      <View style={ms.divider} />
                    </>
                  )}
                  <SummaryRow
                    label="Tickets"
                    value={`${state.type === "confirm_package" ? state.pkg.tickets : state.tickets} tickets`}
                  />
                  <View style={ms.divider} />
                  <SummaryRow
                    label="Montant total"
                    value={`${(state.type === "confirm_package" ? state.pkg.price : state.price).toFixed(2)} DT`}
                    large
                  />
                </View>
                <View style={ms.note}>
                  <Text style={ms.noteText}>
                    Rendez-vous à notre bureau pour régler le paiement. Votre réservation sera validée après paiement.
                  </Text>
                </View>
                <View style={ms.btnRow}>
                  <TouchableOpacity style={ms.btnOutline} onPress={onCancel} disabled={purchasing}>
                    <Text style={ms.btnOutlineText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={ms.btnFill} onPress={onConfirm} disabled={purchasing}>
                    {purchasing
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={ms.btnFillText}>Confirmer</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Success */}
            {isSuccess && state.type === "success" && (
              <>
                <View style={ms.summaryBox}>
                  <SummaryRow label="Package" value={state.packageName} />
                  <View style={ms.divider} />
                  <SummaryRow label="Tickets" value={`${state.tickets} tickets`} />
                  <View style={ms.divider} />
                  <SummaryRow label="Montant" value={`${state.price.toFixed(2)} DT`} large />
                </View>
                <View style={ms.note}>
                  <Text style={ms.noteText}>
                    Rendez-vous à notre bureau pour payer. Votre réservation sera validée après réception du paiement.
                  </Text>
                </View>
                <TouchableOpacity style={ms.btnFillFull} onPress={state.onOk}>
                  <Text style={ms.btnFillText}>OK</Text>
                </TouchableOpacity>
              </>
            )}

          </View>
        </View>
      </View>
    </Modal>
  );
};

const SummaryRow = ({ label, value, large }: { label: string; value: string; large?: boolean }) => (
  <View style={ms.row}>
    <Text style={ms.rowLabel}>{label}</Text>
    <Text style={[ms.rowValue, large && ms.rowValueLg]}>{value}</Text>
  </View>
);

// ─── Modal Styles ────────────────────────────────────────────────────────────

const BLUE = "#185FA5";
const BLUE_LIGHT = "#E6F1FB";
const BLUE_BORDER = "#B5D4F4";
const BLUE_TEXT = "#0C447C";

const ms = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(10,30,60,0.55)",
    justifyContent: "center", alignItems: "center", padding: 20,
  },
  card: {
    width: "100%", maxWidth: 340,
    backgroundColor: "#fff", borderRadius: 16,
    overflow: "hidden", borderWidth: 0.5, borderColor: BLUE_BORDER,
  },
  header: {
    backgroundColor: BLUE, padding: 20, paddingBottom: 16,
  },
  headerSuccess: { backgroundColor: "#0F6E56" },
  headerError:   { backgroundColor: "#A32D2D" },
  headerSub: {
    fontSize: 11, color: "#85B7EB", fontWeight: "500",
    letterSpacing: 1, marginBottom: 4,
  },
  headerTitle: { fontSize: 18, color: "#fff", fontWeight: "500" },
  successIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  errorIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  body: { padding: 20 },
  summaryBox: {
    backgroundColor: BLUE_LIGHT, borderRadius: 8,
    padding: 14, marginBottom: 14,
    borderWidth: 0.5, borderColor: BLUE_BORDER,
  },
  row: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 2,
  },
  rowLabel: { fontSize: 13, color: BLUE },
  rowValue:  { fontSize: 14, fontWeight: "500", color: BLUE_TEXT },
  rowValueLg:{ fontSize: 18 },
  divider: { height: 0.5, backgroundColor: BLUE_BORDER, marginVertical: 10 },
  note: {
    borderLeftWidth: 3, borderLeftColor: "#378ADD",
    backgroundColor: "#f0f7ff", borderRadius: 4,
    padding: 10, marginBottom: 20,
  },
  noteText: { fontSize: 12, color: BLUE, lineHeight: 18 },
  btnRow: { flexDirection: "row", gap: 10 },
  btnOutline: {
    flex: 1, padding: 11, borderRadius: 8,
    borderWidth: 1.5, borderColor: BLUE_BORDER, alignItems: "center",
  },
  btnOutlineText: { fontSize: 14, fontWeight: "500", color: BLUE },
  btnFill: {
    flex: 1, padding: 11, borderRadius: 8,
    backgroundColor: BLUE, alignItems: "center",
  },
  btnFillFull: {
    width: "100%", padding: 12, borderRadius: 8,
    backgroundColor: BLUE, alignItems: "center",
  },
  btnFillText: { fontSize: 14, fontWeight: "500", color: "#fff" },
  errorText: { fontSize: 14, color: "#A32D2D", marginBottom: 20, lineHeight: 20 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

interface EnhancedPackage extends Package {
  tickets: number;
}

export default function Tickets() {
  const [packages, setPackages] = useState<EnhancedPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [customTickets, setCustomTickets] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [userTickets, setUserTickets] = useState(0);
  const [modal, setModal] = useState<ModalState>({ type: "none" });

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
      const enhancedPackages: EnhancedPackage[] = response.data.map((pkg: Package) => ({
        ...pkg,
        tickets: Math.round(pkg.price / 0.2),
      }));
      setPackages(enhancedPackages);
    } catch {
      setPackages([
        { id: "1", name: "Package 1 Semaine",  price: 2.4, tickets: 12 },
        { id: "2", name: "Package 2 Semaines", price: 4.8, tickets: 24 },
        { id: "3", name: "Package 1 Mois",     price: 9.6, tickets: 48 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserTickets = async () => {
    try {
      if (!token) return;
      const response = await getUserTickets(token);
      setUserTickets(response.data.remainingTickets || 0);
    } catch {
      // keep default
    }
  };

  const handlePurchasePackage = (packageId: string) => {
    if (!token) {
      setModal({ type: "error", message: "Vous devez être connecté pour acheter des tickets." });
      return;
    }
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) {
      setModal({ type: "error", message: "Package non trouvé." });
      return;
    }
    setModal({ type: "confirm_package", pkg });
  };

  const confirmPackagePurchase = async () => {
    if (modal.type !== "confirm_package") return;
    const { pkg } = modal;
    setPurchasing(true);
    try {
      await purchasePackage(pkg.id, token!);
      setModal({
        type: "success",
        title: "Réservation confirmée",
        packageName: pkg.name,
        tickets: pkg.tickets,
        price: pkg.price,
        onOk: () => {
          setModal({ type: "none" });
          loadUserTickets();
          router.back();
        },
      });
    } catch {
      setModal({ type: "error", message: "Échec de la réservation du package. Veuillez réessayer." });
    } finally {
      setPurchasing(false);
    }
  };

  const handleCustomPurchase = () => {
    const count = parseInt(customTickets);
    if (!count || count < 1) {
      setModal({ type: "error", message: "Veuillez entrer un nombre valide de tickets." });
      return;
    }
    if (count > 100) {
      setModal({ type: "error", message: "Maximum 100 tickets par achat." });
      return;
    }
    if (!token) {
      setModal({ type: "error", message: "Vous devez être connecté pour acheter des tickets." });
      return;
    }
    setModal({ type: "confirm_custom", tickets: count, price: count * 0.2 });
  };

  const confirmCustomPurchase = async () => {
    if (modal.type !== "confirm_custom") return;
    const { tickets, price } = modal;
    setPurchasing(true);
    try {
      await purchaseCustomTickets(tickets, token!);
      setModal({
        type: "success",
        title: "Réservation confirmée",
        packageName: "Personnalisé",
        tickets,
        price,
        onOk: () => {
          setModal({ type: "none" });
          setShowCustom(false);
          setCustomTickets("");
          loadUserTickets();
          router.back();
        },
      });
    } catch {
      setModal({ type: "error", message: "Échec de la réservation des tickets. Veuillez réessayer." });
    } finally {
      setPurchasing(false);
    }
  };

  const handleConfirm = () => {
    if (modal.type === "confirm_package") confirmPackagePurchase();
    else if (modal.type === "confirm_custom") confirmCustomPurchase();
  };

  const handleCancel = () => setModal({ type: "none" });

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-blue-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-4 text-base">Chargement des packages...</Text>
      </View>
    );
  }

  // ── Access guard ─────────────────────────────────────────────────────────
  if (user?.role !== "STUDENT") {
    return (
      <View className="flex-1 bg-blue-50 items-center justify-center">
        <View className="w-16 h-16 bg-red-500 rounded-full items-center justify-center mb-4">
          <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
        </View>
        <Text className="text-gray-800 text-xl font-bold mb-2">Accès Restreint</Text>
        <Text className="text-gray-600 text-base text-center px-6">
          Cette page est uniquement accessible aux étudiants.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-blue-600 rounded-xl px-6 py-3 mt-6">
          <Text className="text-white font-semibold">Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────
  return (
    <>
      <PurchaseModal
        state={modal}
        purchasing={purchasing}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
        <StatusBar style="dark" />

        {/* Header */}
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
          <View className="bg-white/10 rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-blue-100 text-xs">Tickets actuels</Text>
                <Text className="text-white text-2xl font-bold">{userTickets}</Text>
              </View>
              <Ionicons name="ticket-outline" size={32} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Packages */}
        <View className="px-6 py-6">
          <Text className="text-gray-800 text-xl font-bold mb-4">Packages Disponibles</Text>

          {packages.map(pkg => (
            <TouchableOpacity
              key={pkg.id}
              onPress={() => handlePurchasePackage(pkg.id)}
              disabled={purchasing}
              className={`bg-white rounded-xl p-5 mb-4 shadow-sm border border-gray-100 ${purchasing ? "opacity-60" : ""}`}
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
                    <Text className="text-gray-500 text-sm ml-2">
                      ({(pkg.price / pkg.tickets).toFixed(2)} DT/ticket)
                    </Text>
                  </View>
                </View>
                <View className="bg-blue-600 rounded-full p-3">
                  <Ionicons name="add-outline" size={20} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Custom Package */}
          <TouchableOpacity
            onPress={() => setShowCustom(!showCustom)}
            className="bg-purple-600 rounded-xl p-5 mb-4 shadow-sm"
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
              <Ionicons name={showCustom ? "chevron-up" : "chevron-down"} size={20} color="white" />
            </View>
          </TouchableOpacity>

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
                  editable={!purchasing}
                />
              </View>

              {customTickets ? (
                <Text className="text-gray-500 text-sm mt-2 text-right">
                  Total: {(parseInt(customTickets) * 0.2).toFixed(2)} DT
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={handleCustomPurchase}
                disabled={purchasing || !customTickets}
                className={`bg-green-600 rounded-xl py-4 mt-4 ${purchasing || !customTickets ? "opacity-60" : ""}`}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center">
                  <Ionicons name="cart-outline" size={24} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Acheter {customTickets || "0"} tickets
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Info */}
          <View className="bg-blue-50 rounded-xl p-4 mt-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle-outline" size={20} color="#2563EB" style={{ marginRight: 8, marginTop: 1 }} />
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold mb-2">Information:</Text>
                <Text className="text-gray-600 text-sm leading-relaxed">
                  Après avoir choisi un package, votre réservation sera enregistrée.
                  Veuillez vous rendre à notre bureau pour payer et valider votre package.
                  Les tickets seront ajoutés à votre compte après validation du paiement.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 pb-10">
          <Text className="text-gray-400 text-xs text-center">
            © 2026 Portail de Restauration Universitaire. Tous droits réservés.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}