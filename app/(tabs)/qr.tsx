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
  totalMeals: number;
  usedMeals: number;
  remainingMeals: number;
}

// Secret key for signature - In production, this should come from secure storage or environment variables
const SECRET_KEY = "YourSecureSignatureKey123!@#";

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
const verifyQRCode = async (qrData: string): Promise<{ userId: string; isValid: boolean }> => {
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

        console.log('Making API call to:', `${process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.15:5000"}/api/agent-restaurant/scan/${userId}`);
        console.log('Token:', token ? 'Present' : 'Missing');
        
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.15:5000"}/api/agent-restaurant/scan/${userId}`,
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
                <View style={styles.mealsContainer}>
                  <Text>Total: {scanResult.totalMeals}</Text>
                  <Text>Utilisés: {scanResult.usedMeals}</Text>
                  <Text>Restants: {scanResult.remainingMeals}</Text>
                </View>
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
});
