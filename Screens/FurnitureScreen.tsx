import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
  Dimensions,
} from "react-native";
import type { Screen } from "./App";

interface FurnitureScreenProps {
  goBack: () => void;
  goToScreen: (screen: Screen) => void;
}

const FurnitureScreen: React.FC<FurnitureScreenProps> = ({
  goBack,
  goToScreen,
}) => {
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

  const categories = [
    {
      label: "Living Room",
      screen: "livingroom" as Screen,
      icon: "🛋️",
      description: "Sofas, Shelves, TVStand, & Tables",
      color: "#E8DDD3",
    },
    {
      label: "Bedroom",
      screen: "broomt" as Screen,
      icon: "🛏️",
      description: "Beds & Wardrobe / Drawer / Cabinet",
      color: "#D4C4B7",
    },
    {
      label: "Office Room",
      screen: "office" as Screen,
      icon: "🧑‍💻",
      description: "Laptop Stand / Computer Table",
      color: "#C4B4A7",
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={goBack} style={styles.headerButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Browse Furniture</Text>

        <TouchableOpacity
          onPress={() => goToScreen("settings")}
          style={styles.headerButton}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Explore Our Collections
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Find the perfect furniture for every room
          </Text>
        </View>

        {/* Category Cards */}
        <View style={styles.categoriesContainer}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={category.label}
              style={[styles.categoryCard, { backgroundColor: colors.cardBg }]}
              onPress={() => goToScreen(category.screen)}
              activeOpacity={0.7}
            >
              {/* Icon Circle */}
              <View
                style={[styles.iconCircle, { backgroundColor: category.color }]}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
              </View>

              {/* Content */}
              <View style={styles.categoryContent}>
                <Text
                  style={[styles.categoryLabel, { color: colors.textPrimary }]}
                >
                  {category.label}
                </Text>
                <Text
                  style={[
                    styles.categoryDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {category.description}
                </Text>
              </View>

              {/* Arrow */}
              <View
                style={[
                  styles.arrowContainer,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.arrowText}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feature Banner */}
        <View
          style={[styles.featureBanner, { backgroundColor: colors.primary }]}
        >
          <View style={styles.featureContent}>
            <Text style={styles.featureIcon}>✨</Text>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>AR Preview Available</Text>
              <Text style={styles.featureDescription}>
                Visualize furniture in your space before buying
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modern Bottom Navigation */}
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
  backIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  settingsIcon: {
    fontSize: 20,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryContent: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
  featureBanner: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  featureContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    lineHeight: 20,
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
    position: "relative",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  navActive: {
    borderRadius: 24,
  },
  navIcon: {
    fontSize: 24,
  },
  navIconActive: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  navLabelActive: {
    fontWeight: "600",
  },
});

export default FurnitureScreen;
