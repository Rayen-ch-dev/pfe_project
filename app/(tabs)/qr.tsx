import { View, Text, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../context/AuthContext";

export default function QR() {
  const { token } = useAuth();
  
  // Extract user ID from JWT token
  const getUserIdFromToken = () => {
    if (!token) return "No user ID";
    
    try {
      // Simple JWT decode without verification (just for getting the ID)
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.id || "No user ID";
    } catch (error) {
      console.error("Failed to decode token:", error);
      return "Invalid token";
    }
  };

  const userId = getUserIdFromToken();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your QR Code</Text>
      <Text style={styles.subtitle}>User ID: {userId}</Text>
      <QRCode value={userId} size={200} />
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
});