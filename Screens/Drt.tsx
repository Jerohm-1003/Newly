import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import type { Screen } from "../types";

interface LivingRoomScreenProps {
  goToScreen: (screen: Screen) => void;
  goBack: () => void;
}

const DRoomtScreen: React.FC<LivingRoomScreenProps> = ({
  goToScreen,
  goBack,
}) => {
  const screenWidth = Dimensions.get("window").width;
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;
  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: -screenWidth,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };
  return (
    <View style={styles.container}>
      {/* Sidebar Drawer Menu */}
      {menuVisible && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        >
          <Animated.View
            style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
          >
            <TouchableOpacity style={styles.backButton} onPress={toggleMenu}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => goToScreen?.("furniture")}
            >
              <Text style={styles.menuText}>Furniture</Text>
            </TouchableOpacity>

            <View style={styles.menuItem}>
              <Text style={styles.menuText}>Home Office</Text>
            </View>
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>Home Decoration</Text>
            </View>
            <View style={styles.menuItem}>
              <Text style={styles.menuText}>Help</Text>
            </View>

            <View style={styles.drawerBottomImage}>
              <Image
                source={require("../assets/cart_icon.png")}
                style={styles.sfImage}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu}>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
        <Image
          source={require("../assets/cart_icon.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.headerIcon}>⚙️</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => goToScreen("home")}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Dining Room Furniture</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => goToScreen("DiningChair")}
          >
            <Text style={styles.optionText}>🪑 Dining Chair</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => goToScreen("Cabinet")}
          >
            <Text style={styles.optionText}>🗄️ Cabinet</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => goToScreen("DiningTable")}
          >
            <Text style={styles.optionText}>🍽️ Dining Table</Text>
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

export default DRoomtScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D8C5B4" },
  header: {
    backgroundColor: "#3E2E22",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerIcon: {
    color: "white",
    fontSize: 24,
  },
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
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#CBB8A6",
    paddingVertical: 16,
  },
  menuText: {
    fontSize: 16,
    color: "#3E2E22",
    fontWeight: "500",
  },
  drawerBottomImage: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 40,
  },
  sfImage: {
    width: 100,
    height: 80,
  },
  logoImage: {
    width: 100,
    height: 40,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "70%",
    height: "100%",
    backgroundColor: "#D8C5B4",
    padding: 20,
    zIndex: 2,
    justifyContent: "flex-start",
  },
});
