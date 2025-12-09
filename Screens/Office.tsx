import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
} from "react-native";
import type { Screen } from "../types";

interface OfficeScreenProps {
  goToScreen: (screen: Screen, params?: any) => void;
  goBack: () => void;
}

const OfficeScreen: React.FC<OfficeScreenProps> = ({ goToScreen, goBack }) => {
  const screenWidth = Dimensions.get("window").width;
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;

  // Color Palette - Theme
  const colors = {
    primary: "#2D2416",
    secondary: "#8B7355",
    accent: "#D4A574",
    background: "#FAF8F5",
    cardBg: "#FFFFFF",
    textPrimary: "#1A1A1A",
    textSecondary: "#6B6B6B",
    border: "#E8E8E8",
  };

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

  const furnitureTypes = [
    {
      id: "officechair",
      icon: "🪑",
      label: "Office Chair",
      screen: "officechair",
    },

    {
      id: "bookshelf",
      icon: "🧑‍💻",
      label: "Laptop Stand / Computer Table",
      screen: "laptopstand",
    },
    

  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Modern Sidebar Drawer (matching Home.tsx) */}
      {menuVisible && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        >
          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX: slideAnim }],
                backgroundColor: colors.cardBg,
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={toggleMenu}>
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  ✕
                </Text>
              </TouchableOpacity>
              <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>
                Menu
              </Text>
            </View>

            <View style={styles.drawerContent}>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  goToScreen("furniture");
                  toggleMenu();
                }}
              >
                <Text style={styles.drawerItemIcon}>🪑</Text>
                <Text
                  style={[styles.drawerItemText, { color: colors.textPrimary }]}
                >
                  All Furniture
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => {
                  goToScreen("home");
                  toggleMenu();
                }}
              >
                <Text style={styles.drawerItemIcon}>🏠</Text>
                <Text
                  style={[styles.drawerItemText, { color: colors.textPrimary }]}
                >
                  Home
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.drawerItem}>
                <Text style={styles.drawerItemIcon}>❓</Text>
                <Text
                  style={[styles.drawerItemText, { color: colors.textPrimary }]}
                >
                  Help & Support
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.drawerFooter}>
              <Image
                source={require("../assets/cart_icon.png")}
                style={styles.drawerLogo}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.drawerFooterText,
                  { color: colors.textSecondary },
                ]}
              >
                ShopFur v1.0
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Modern Header (matching Home.tsx) */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.headerButton} onPress={toggleMenu}>
          <View style={styles.menuIconContainer}>
            <View
              style={[styles.menuLine, { backgroundColor: colors.cardBg }]}
            />
            <View
              style={[
                styles.menuLine,
                { backgroundColor: colors.cardBg, width: 18 },
              ]}
            />
            <View
              style={[styles.menuLine, { backgroundColor: colors.cardBg }]}
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Office</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => goToScreen("home")}
        >
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.heroSection, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroIcon}>🍳</Text>
          <Text style={styles.heroTitle}>Office Collection</Text>
          <Text style={styles.heroSubtitle}>
            Discover stylish & functional office furniture
          </Text>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Choose Furniture Type
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            Select a category to browse
          </Text>
        </View>

        {/* Modern Furniture Type Grid */}
        <View style={styles.furnitureGrid}>
          {furnitureTypes.map((furniture) => (
            <TouchableOpacity
              key={furniture.id}
              style={[styles.furnitureCard, { backgroundColor: colors.cardBg }]}
              onPress={() => goToScreen(furniture.screen as Screen)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.furnitureIconCircle,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text style={styles.furnitureIcon}>{furniture.icon}</Text>
              </View>
              <Text
                style={[styles.furnitureLabel, { color: colors.textPrimary }]}
              >
                {furniture.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.cardBg, borderColor: colors.border },
          ]}
        >
          <Text style={styles.infoIcon}>💡</Text>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
              AR Preview Available
            </Text>
            <Text
              style={[styles.infoDescription, { color: colors.textSecondary }]}
            >
              Use AR to visualize kitchen furniture in your space before
              purchasing
            </Text>
          </View>
        </View>

        {/* Tips Card */}
        <View style={[styles.tipsCard, { backgroundColor: colors.accent }]}>
          <View style={styles.tipsHeader}>
            <Text style={styles.tipsIcon}>✨</Text>
            <Text style={styles.tipsTitle}>Office Design Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Measure your space before selecting furniture
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Consider workplace needs and workflow
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Match furniture style with your office theme
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modern Bottom Navigation (matching Home.tsx) */}
      <View
        style={[
          styles.bottomNav,
          { backgroundColor: colors.cardBg, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToScreen("home")}
        >
          <View style={styles.navIconContainer}>
            <Text style={[styles.navIcon, { color: colors.textSecondary }]}>
              🏠
            </Text>
          </View>
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToScreen("Wishlist")}
        >
          <View style={styles.navIconContainer}>
            <Text style={[styles.navIcon, { color: colors.textSecondary }]}>
              ♡
            </Text>
          </View>
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>
            Wishlist
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToScreen("profile")}
        >
          <View style={styles.navIconContainer}>
            <Text style={[styles.navIcon, { color: colors.textSecondary }]}>
              👤
            </Text>
          </View>
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "80%",
    maxWidth: 320,
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  drawerHeader: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  closeButton: {
    alignSelf: "flex-start",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  drawerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  drawerContent: {
    flex: 1,
    paddingTop: 16,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  drawerItemIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  drawerFooter: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  drawerLogo: {
    width: 80,
    height: 60,
    marginBottom: 8,
  },
  drawerFooterText: {
    fontSize: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    paddingTop: 20,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconContainer: {
    width: 24,
    gap: 4,
  },
  menuLine: {
    height: 2,
    width: 24,
    borderRadius: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerBackIcon: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  heroSection: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
  },
  heroIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#FFFFFF",
    opacity: 0.9,
    textAlign: "center",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 15,
  },
  furnitureGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  furnitureCard: {
    width: (Dimensions.get("window").width - 56) / 2,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  furnitureIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  furnitureIcon: {
    fontSize: 28,
  },
  furnitureLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tipsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  tipsIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tipBullet: {
    fontSize: 20,
    color: "#FFFFFF",
    marginRight: 8,
    marginTop: -2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
    opacity: 0.95,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    alignItems: "center",
    gap: 4,
  },
  navIconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: {
    fontSize: 24,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default OfficeScreen;
