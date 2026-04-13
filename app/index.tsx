import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function App() {
  const handleExplore = () => {
    console.log("Exploration started!");
  };

  const handleServices = () => {
    console.log("Viewing services!");
  };

  return (
    <View style={styles.container}>
      <View style={styles.overlay} />
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📚</Text>
        </View>
        <Text style={styles.welcomeText}>Bienvenue</Text>
        <Text style={styles.title}>Chez</Text>
        <View style={styles.separator} />
        <Text style={styles.arabic}>
          ديوان الخدمات الجامعية للوسط
        </Text>
        
        <TouchableOpacity 
          style={styles.mainButton}
          onPress={handleExplore}
          activeOpacity={0.9}
        >
          <Text style={styles.mainButtonText}>Commencer l&apos;exploration</Text>
          <Text style={styles.mainButtonArrow}>→</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleServices}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Découvrir nos services</Text>
        </TouchableOpacity>
        
        <View style={styles.decorationLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A66C2",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10, 102, 194, 0.95)",
  },
  card: {
    backgroundColor: "white",
    paddingVertical: 45,
    paddingHorizontal: 35,
    borderRadius: 25,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  iconContainer: {
    backgroundColor: "#0A66C2",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 35,
  },
  welcomeText: {
    fontSize: 18,
    color: "#7f8c8d",
    fontWeight: "500",
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    color: "#0A66C2",
    fontWeight: "bold",
    marginBottom: 15,
  },
  separator: {
    width: 50,
    height: 3,
    backgroundColor: "#0A66C2",
    marginVertical: 15,
    borderRadius: 2,
  },
  arabic: {
    fontSize: 20,
    textAlign: "center",
    color: "#2c3e50",
    fontWeight: "600",
    lineHeight: 38,
    writingDirection: "rtl",
    marginTop: 10,
    marginBottom: 30,
  },
  mainButton: {
    backgroundColor: "#0A66C2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: "100%",
    marginBottom: 12,
    shadowColor: "#0A66C2",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  mainButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  mainButtonArrow: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#0A66C2",
  },
  secondaryButtonText: {
    color: "#0A66C2",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  decorationLine: {
    width: 80,
    height: 2,
    backgroundColor: "#e0e0e0",
    marginTop: 25,
    borderRadius: 1,
  },
});