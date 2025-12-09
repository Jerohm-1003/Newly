import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import type { Screen } from "../types";

interface BRoomScreenProps {
  goToScreen: (screen: Screen) => void;
  goBack: () => void;
}

const BRoomScreen: React.FC<BRoomScreenProps> = ({ goToScreen, goBack }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/cart_icon.png")}
            style={styles.logo}
          />
          <Text style={styles.logoText}>SHOPFUR</Text>
        </View>
        <Text style={styles.headerIcon}>⚙️</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bed Room Furniture</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => goToScreen("Desks")}
          >
            <Text style={styles.optionText}>Desks & Chairs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => goToScreen("Wardrobe")}
          >
            <Text style={styles.optionText}>Wardrobe</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => goToScreen("Bed")}
          >
            <Text style={styles.optionText}>Bed</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomNav}>
        {["home", "inbox", "cart", "profile"].map((target, index) => (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => goToScreen(target as Screen)}
          >
            <Text style={styles.navIcon}>
              {["🏠", "📥", "🛒", "👤"][index]}
            </Text>
            <Text style={styles.navLabel}>
              {["Home", "Inbox", "Cart", "Profile"][index]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default BRoomScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D8C5B4" },
  header: {
    backgroundColor: "#3E2E22",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerIcon: { color: "white", fontSize: 22 },
  logoContainer: { flexDirection: "row", alignItems: "center" },
  logo: { width: 30, height: 30, marginRight: 6 },
  logoText: { color: "white", fontWeight: "bold", fontSize: 16 },
  content: { padding: 20, flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3E2E22",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  optionButton: {
    backgroundColor: "#EBDDCB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 12,
    marginBottom: 10,
  },
  optionText: { fontSize: 16, fontWeight: "600", color: "#3E2E22" },
  bottomNav: {
    backgroundColor: "#3E2E22",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  navItem: { alignItems: "center" },
  navIcon: { color: "white", fontSize: 22 },
  navLabel: { color: "white", fontSize: 12, marginTop: 2 },
  backButtonText: { color: "white", fontWeight: "600" },
  backButton: {
    backgroundColor: "#A89580",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
});
