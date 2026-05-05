import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useAuth } from "../context/AuthContext";
import * as Crypto from 'expo-crypto';

interface ScanResult {
  id: string;
  firstName: string;
  lastName: string;
  todayReservations: Array<{
    id: string;
    date: string;
    mealType: string;
    status: string;
    mealDate: string;
  }>;
  totalReservationsToday: number;
}

// Secret key for signature - In production, this should come from secure storage or environment variables
const SECRET_KEY = "YourSecureSignatureKey123!@#";

// Helper function to get status text
const getStatusText = (status: string) => {
  switch (status) {
    case 'CONFIRMED': return 'Confirmée';
    case 'PENDING': return 'En attente';
    case 'USED': return 'Utilisée';
    case 'CANCELLED': return 'Annulée';
    case 'COMPLETED': return 'Terminée';
    default: return status;
  }
};

// Generate secure QR code with SHA-256 signature
const generateSecureQRCode = async (userId: string): Promise<string> => {
  try {
    // Create signature using SHA-256
    const dataToSign = userId + SECRET_KEY;
    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      dataToSign
    );
    
    // Return userId.signature format
    return `${userId}.${signature}`;
  } catch (error) {
    console.error("QR generation error:", error);
    return userId; // Fallback to plain userId if signature fails
  }
};

// Verify QR code signature
export const verifyQRCode = async (qrData: string): Promise<{ userId: string; isValid: boolean }> => {
  try {
    // Split QR data into userId and signature
    const parts = qrData.split('.');
    if (parts.length !== 2) {
      return { userId: '', isValid: false };
    }
    
    const [userId, receivedSignature] = parts;
    
    // Recompute expected signature
    const dataToSign = userId + SECRET_KEY;
    const expectedSignature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      dataToSign
    );
    
    // Verify signature
    const isValid = receivedSignature === expectedSignature;
    
    return { userId, isValid };
  } catch (error) {
    console.error("QR verification error:", error);
    return { userId: '', isValid: false };
  }
};

export default function QR() {
  const { user, token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [secureQRValue, setSecureQRValue] = useState<string>("");
  const [validatingMeal, setValidatingMeal] = useState(false);

  // Route protection - Only students can access this page
  if (user && user.role !== "STUDENT") {
    return (
      <View style={styles.container}>
        <View style={styles.lockIconContainer}>
          <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.errorText}>Accès Restreint</Text>
        <Text style={styles.errorSubtext}>
          Cette page est uniquement accessible aux étudiants.
        </Text>
        <TouchableOpacity 
          onPress={() => console.log("Return to home")}
          style={styles.returnButton}
        >
          <Text style={styles.returnButtonText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // STUDENT VIEW: Show their secure QR code
  if (user?.role === "STUDENT") {
    const getUserIdFromToken = () => {
      if (!token) return "No user ID";
      
      try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.id || "No user ID";
      } catch (error) {
        console.error("Failed to decode token:", error);
        return "Invalid token";
      }
    };

    const userId = getUserIdFromToken();

    // Generate secure QR code on component mount
    React.useEffect(() => {
      const generateQR = async () => {
        const secureValue = await generateSecureQRCode(userId);
        setSecureQRValue(secureValue);
      };
      generateQR();
    }, [userId]);

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Your QR Code</Text>
        <Text style={styles.subtitle}>User ID: {userId}</Text>
        <Text style={styles.subtitle}>Secure QR: {secureQRValue.substring(0, 50)}...</Text>
        {secureQRValue ? (
          <QRCode value={secureQRValue} size={200} />
        ) : (
          <Text style={styles.subtitle}>Generating secure QR code...</Text>
        )}
      </View>
    );
  }

  // AGENT VIEW: Show scanner
  if (user?.role === "AGENT_RESTAURANT") {
    const handleBarCodeScanned = async ({ data }: { data: string }) => {
      console.log('QR Code scanned:', data);
      
      if (scanned) return;
      
      setScanned(true);
      setLoading(true);

      try {
        // Verify QR code signature
        console.log('Verifying QR code signature...');
        const verification = await verifyQRCode(data);
        console.log('Verification result:', verification);
        
        if (!verification.isValid) {
          Alert.alert("Invalid QR Code", "This QR code is not valid or has been tampered with.");
          return;
        }
        
        const { userId } = verification;
        console.log('Verified user ID:', userId);

        console.log('Making API call to:', `${process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.18:5000"}/api/agent-restaurant/scan/${userId}`);
        console.log('Token:', token ? 'Present' : 'Missing');
        
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

        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('Error response:', errorText);
          throw new Error(`Failed to scan QR code: ${response.status}`);
        }

        const result = await response.json();
        console.log('Scan result:', result);
        console.log('Result keys:', Object.keys(result));
        console.log('Has todayReservations:', 'todayReservations' in result);
        console.log('todayReservations length:', result.todayReservations?.length);
        console.log('totalReservationsToday:', result.totalReservationsToday);
        setScanResult(result);
      } catch (error: any) {
        console.error("Scan error:", error);
        Alert.alert("Erreur", error.message || "Échec du scan");
      } finally {
        setLoading(false);
      }
    };

    const resetScan = () => {
      setScanned(false);
      setScanResult(null);
    };

    const validateMeal = async (mealType: 'LUNCH' | 'DINNER') => {
      if (!scanResult || !token) return;
      
      setValidatingMeal(true);
      try {
        // Find the reservation for this meal type
        const reservation = scanResult.todayReservations.find(r => r.mealType === mealType);
        
        if (!reservation) {
          Alert.alert("Erreur", `Aucune réservation pour ${mealType === 'LUNCH' ? 'le déjeuner' : 'le dîner'} aujourd'hui`);
          return;
        }

        if (reservation.status === 'USED') {
          Alert.alert("Erreur", `Ce repas (${mealType === 'LUNCH' ? 'déjeuner' : 'dîner'}) a déjà été utilisé`);
          return;
        }

        // Call API to validate the meal
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.18:5000"}/api/agent-restaurant/validate-meal`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              studentId: scanResult.id,
              reservationId: reservation.id,
              mealType: mealType
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to validate meal: ${response.status}`);
        }

        const result = await response.json();
        
        Alert.alert(
          "Succès",
          `${scanResult.firstName} ${scanResult.lastName}\n${mealType === 'LUNCH' ? 'Déjeuner' : 'Dîner'} validé avec succès!`,
          [
            {
              text: "OK",
              onPress: () => resetScan()
            }
          ]
        );
        
      } catch (error: any) {
        console.error("Meal validation error:", error);
        Alert.alert("Erreur", "Échec de la validation du repas.");
      } finally {
        setValidatingMeal(false);
      }
    };

    // Permission loading
    if (!permission) {
      console.log('Camera permission loading...');
      return (
        <View style={styles.container}>
          <Text>Demande d'autorisation caméra...</Text>
        </View>
      );
    }

    // Permission denied
    if (!permission.granted) {
      console.log('Camera permission denied:', permission);
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>Accès caméra refusé</Text>
          <TouchableOpacity style={styles.resetButton} onPress={requestPermission}>
            <Text style={styles.resetButtonText}>Autoriser la caméra</Text>
          </TouchableOpacity>
        </View>
      );
    }

    console.log('Camera permission granted, showing scanner');

    return (
      <View style={styles.agentContainer}>
        <Text style={styles.title}>Scanner QR Code</Text>

        {/* CAMERA */}
        {!scanned ? (
          <View style={styles.scannerContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={({ type, data }) => {
                console.log('Barcode detected:', { type, data });
                if (type === 'qr' && !scanned) {
                  handleBarCodeScanned({ data });
                }
              }}
            />
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanText}>
                Scannez le QR code de l'étudiant
              </Text>
              <Text style={styles.debugText}>
                Pointez la caméra vers un code QR
              </Text>
            </View>
          </View>
        ) : (
          // RESULT
          <View style={styles.resultContainer}>
            {loading ? (
              <Text style={styles.loadingText}>Traitement en cours...</Text>
            ) : scanResult ? (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                  Informations de l'étudiant
                </Text>
                <Text style={styles.info}>
                  {scanResult.firstName} {scanResult.lastName}
                </Text>
                <Text style={styles.subtitle}>
                  Réservations du jour: {scanResult.totalReservationsToday}
                </Text>
                
                {/* Debug info */}
                <Text style={{fontSize: 10, color: 'red'}}>
                  DEBUG: Keys: {JSON.stringify(Object.keys(scanResult))}
                </Text>
                <Text style={{fontSize: 10, color: 'red'}}>
                  DEBUG: todayReservations: {JSON.stringify(scanResult.todayReservations)}
                </Text>
                
                {scanResult.todayReservations.length > 0 ? (
                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Repas du jour</Text>
                    
                    <View style={styles.mealSummaryRow}>
                      <View style={styles.mealSummaryItem}>
                        <Text style={styles.mealIcon}>🍽️</Text>
                        <Text style={styles.mealLabel}>Déjeuner</Text>
                        <Text style={styles.mealCount}>
                          {scanResult.todayReservations.filter(r => r.mealType === 'LUNCH').length}
                        </Text>
                      </View>
                      
                      <View style={styles.mealSummaryItem}>
                        <Text style={styles.mealIcon}>🌙</Text>
                        <Text style={styles.mealLabel}>Dîner</Text>
                        <Text style={styles.mealCount}>
                          {scanResult.todayReservations.filter(r => r.mealType === 'DINNER').length}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.totalMealsText}>
                      Total: {scanResult.totalReservationsToday} repas
                    </Text>
                    
                    {/* Validation Buttons */}
                    <View style={styles.validationButtonsContainer}>
                      <TouchableOpacity
                        style={[
                          styles.validationButton,
                          scanResult.todayReservations.filter(r => r.mealType === 'LUNCH').length === 0 && styles.validationButtonDisabled,
                          scanResult.todayReservations.find(r => r.mealType === 'LUNCH' && r.status === 'USED') && styles.validationButtonUsed
                        ]}
                        onPress={() => validateMeal('LUNCH')}
                        disabled={validatingMeal || scanResult.todayReservations.filter(r => r.mealType === 'LUNCH').length === 0}
                      >
                        {validatingMeal ? (
                          <Text style={styles.validationButtonText}>Validation...</Text>
                        ) : (
                          <Text style={styles.validationButtonText}>
                            {scanResult.todayReservations.find(r => r.mealType === 'LUNCH' && r.status === 'USED') ? '✅ Déjeuner' : 'Valider Déjeuner'}
                          </Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.validationButton,
                          scanResult.todayReservations.filter(r => r.mealType === 'DINNER').length === 0 && styles.validationButtonDisabled,
                          scanResult.todayReservations.find(r => r.mealType === 'DINNER' && r.status === 'USED') && styles.validationButtonUsed
                        ]}
                        onPress={() => validateMeal('DINNER')}
                        disabled={validatingMeal || scanResult.todayReservations.filter(r => r.mealType === 'DINNER').length === 0}
                      >
                        {validatingMeal ? (
                          <Text style={styles.validationButtonText}>Validation...</Text>
                        ) : (
                          <Text style={styles.validationButtonText}>
                            {scanResult.todayReservations.find(r => r.mealType === 'DINNER' && r.status === 'USED') ? '✅ Dîner' : 'Valider Dîner'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noReservationsText}>
                    Aucune réservation pour aujourd'hui
                  </Text>
                )}
                
                <TouchableOpacity style={styles.resetButton} onPress={resetScan}>
                  <Text style={styles.resetButtonText}>Scanner à nouveau</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text>Erreur de scan</Text>
                <TouchableOpacity style={styles.resetButton} onPress={resetScan}>
                  <Text style={styles.resetButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  // Fallback for other roles
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>Access Denied</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  agentContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Scanner styles
  scannerContainer: {
    flex: 1,
    margin: 15,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#0A66C2",
    borderRadius: 10,
  },
  scanText: {
    marginTop: 20,
    color: "white",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 10,
  },
  debugText: {
    marginTop: 10,
    color: "white",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
    borderRadius: 8,
    fontSize: 12,
  },
  resultContainer: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    textAlign: "center",
  },
  resultCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  info: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  mealsContainer: {
    marginVertical: 10,
  },
  resetButton: {
    marginTop: 15,
    backgroundColor: "#0A66C2",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resetButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  // Reservations styles
  reservationsContainer: {
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  reservationsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  reservationItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#0A66C2",
  },
  reservationType: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  reservationStatus: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  reservationTime: {
    fontSize: 12,
    color: "#888",
  },
  noReservationsText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginVertical: 15,
  },
  // Summary styles
  summaryContainer: {
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  mealSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  mealSummaryItem: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e9ecef",
    minWidth: 120,
  },
  mealIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  mealLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 3,
  },
  mealCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0A66C2",
  },
  totalMealsText: {
    textAlign: "center",
    fontSize: 14,
    color: "#6c757d",
    marginTop: 10,
    fontStyle: "italic",
  },
  // Validation buttons styles
  validationButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    marginHorizontal: 10,
  },
  validationButton: {
    flex: 1,
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  validationButtonDisabled: {
    backgroundColor: "#6c757d",
    opacity: 0.6,
  },
  validationButtonUsed: {
    backgroundColor: "#17a2b8",
  },
  validationButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});