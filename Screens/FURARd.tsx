import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { firestore } from "../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { Screen } from "./App";

const { width } = Dimensions.get("window");

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  prefabKey?: string;
  glbUri?: string;
}

interface Props {
  category: "Chair" | "Sofa" | "TVStand" | "Shelves" | "Table";
  goToScreen: (screen: Screen, params?: any) => void;
}

const FURARD: React.FC<Props> = ({ category, goToScreen }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const [isLowToHigh, setIsLowToHigh] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true); // start loading

        const q = query(
          collection(firestore, "livingroom_products"),
          where("category", "==", category)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const productsData: Product[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];

          setProducts(productsData);
          setFilteredProducts(productsData);
          setIsLoading(false); // stop loading only if data found
        } else {
          console.log("No products found — keeping loading spinner visible...");
          // keep isLoading = true (don’t set to false)
        }
      } catch (error) {
        console.error("Error fetching products: ", error);
        // keep loading if there’s an error
      }
    };

    fetchProducts();
  }, [category]);

  const toggleDrawer = () => {
    if (drawerOpen) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setDrawerOpen(false));
    } else {
      setDrawerOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const toggleSort = () => {
    const sorted = [...products];
    if (isLowToHigh) sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => a.price - b.price);

    setFilteredProducts(sorted);
    setIsLowToHigh(!isLowToHigh);
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.cardBg, borderColor: colors.border },
      ]}
      onPress={() => goToScreen("productDetails", { product: item })}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.image} />
      </View>
      <View style={styles.cardContent}>
        <Text
          style={[styles.name, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Text style={[styles.price, { color: colors.accent }]}>
          ₱{item.price.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Modern Drawer */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ marginTop: 12, color: colors.textSecondary }}>
            Loading products...
          </Text>
        </View>
      ) : (
        <>
          {drawerOpen && (
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={toggleDrawer}
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
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={toggleDrawer}
                  >
                    <Text
                      style={[
                        styles.closeButtonText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={[styles.drawerTitle, { color: colors.textPrimary }]}
                  >
                    Menu
                  </Text>
                </View>

                <View style={styles.drawerContent}>
                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => {
                      toggleDrawer();
                      goToScreen("home");
                    }}
                  >
                    <Text style={styles.drawerItemIcon}>🏠</Text>
                    <Text
                      style={[
                        styles.drawerItemText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Home
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => {
                      toggleDrawer();
                      goToScreen("furniture");
                    }}
                  >
                    <Text style={styles.drawerItemIcon}>🪑</Text>
                    <Text
                      style={[
                        styles.drawerItemText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      All Furniture
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.drawerItem}
                    onPress={() => {
                      toggleDrawer();
                      goToScreen("profile");
                    }}
                  >
                    <Text style={styles.drawerItemIcon}>👤</Text>
                    <Text
                      style={[
                        styles.drawerItemText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Profile
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

          {/* Modern Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={toggleDrawer}
            >
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

            <Image
              source={require("../assets/cart_icon.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => goToScreen("settings")}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Category Title & Sort */}
          <View style={styles.controlsContainer}>
            <View style={styles.categoryHeader}>
              <Text
                style={[styles.categoryTitle, { color: colors.textPrimary }]}
              >
                {category === "Chair" && "Chairs"}
                {category === "Sofa" && "Sofas"}
                {category === "TVStand" && "TV Stands"}
                {category === "Shelves" && "Shelves"}
                {category === "Table" && "Tables"}
              </Text>
              <Text
                style={[styles.productCount, { color: colors.textSecondary }]}
              >
                {filteredProducts.length} items
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.sortButton, { borderColor: colors.border }]}
              onPress={toggleSort}
              activeOpacity={0.7}
            >
              <Text style={[styles.sortIcon, { color: colors.textSecondary }]}>
                ⇅
              </Text>
              <Text
                style={[styles.sortButtonText, { color: colors.textPrimary }]}
              >
                {isLowToHigh ? "Low to High" : "High to Low"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Products Grid */}
          <FlatList
            data={filteredProducts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

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
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  headerLogo: {
    width: 90,
    height: 30,
  },
  settingsIcon: {
    fontSize: 20,
  },

  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryHeader: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  productCount: {
    fontSize: 14,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  sortIcon: {
    fontSize: 16,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },

  list: {
    padding: 12,
    paddingBottom: 100,
  },
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F5F5F5",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardContent: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    minHeight: 36,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default FURARD;
