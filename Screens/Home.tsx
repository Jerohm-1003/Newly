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
import type { Screen } from "../types"; // Adjust if needed

interface HomeScreenProps {
  onEnterShop?: () => void;
  onCart?: () => void;
  goToScreen?: (screen: Screen) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onEnterShop,
  onCart,
  goToScreen,
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
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => goToScreen?.("UploadF")}
            >
              <Text style={styles.menuText}>Upload Furniture</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => goToScreen?.("OpenAR")}
            >
              <Text style={styles.menuText}>TESTER</Text>
            </TouchableOpacity>

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

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.imageSlider}>
          <Image
            source={require("../assets/cart_icon.png")}
            style={styles.sliderImage}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.sectionTitle}>Shop by Category</Text>

        {/* Separated Category Buttons */}
        <View style={styles.categoryGrid}>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => goToScreen?.("livingroom")}
          >
            <Text style={styles.categoryIcon}>🛋️</Text>
            <Text style={styles.categoryLabel}>Living Room</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => goToScreen?.("droomt")}
          >
            <Text style={styles.categoryIcon}>🍽️</Text>
            <Text style={styles.categoryLabel}>Dining</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => goToScreen?.("broomt")}
          >
            <Text style={styles.categoryIcon}>🛏️</Text>
            <Text style={styles.categoryLabel}>Bedroom</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToScreen?.("home")}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToScreen?.("home")}
        >
          <Text style={styles.navIcon}>📥</Text>
          <Text style={styles.navLabel}>Inbox</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onCart}>
          <Text style={styles.navIcon}>🛒</Text>
          <Text style={styles.navLabel}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToScreen?.("profile")}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;

// STYLES (same as your current one, unchanged)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D8C5B4",
  },
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
  logoImage: {
    width: 100,
    height: 40,
  },
  mainContent: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  tab: {
    backgroundColor: "#BFA890",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tabText: {
    color: "#3E2E22",
    fontWeight: "600",
  },
  imageSlider: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  sliderImage: {
    width: "100%",
    height: 180,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4D392B",
    marginTop: 20,
    marginLeft: 20,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingVertical: 20,
  },
  categoryButton: {
    width: "40%",
    backgroundColor: "#EBDDCB",
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    alignItems: "center",
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryLabel: {
    marginTop: 8,
    fontWeight: "600",
    color: "#3E2E22",
  },
  bottomNav: {
    backgroundColor: "#3E2E22",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  navItem: {
    alignItems: "center",
  },
  navIcon: {
    color: "white",
    fontSize: 22,
  },
  navLabel: {
    color: "white",
    fontSize: 12,
    marginTop: 2,
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
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#A89580",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
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
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1,
  },
});
