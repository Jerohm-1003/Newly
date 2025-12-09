import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  TextInput,
  FlatList,
  ScrollView,
  StatusBar,
  Linking,
  Modal,
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import type { Screen } from "../types";
import { query, where, onSnapshot } from "firebase/firestore";
import { auth } from "../firebase/firebaseConfig";

interface HomeScreenProps {
  onEnterShop?: () => void;
  goToScreen: (screen: Screen, params?: any) => void;
}

interface Product {
  id: string;
  name: string;
  category: string;
  glbUri: string;
  image: string;
  price: number;
  username?: string;
  contactNo?: string;
  material?: string;
  color?: string;
  size?: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ goToScreen }) => {
  const screenWidth = Dimensions.get("window").width;
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
    const [arGuideVisible, setArGuideVisible] = useState(false);

  const flatListRef = useRef<FlatList<any>>(null);

  // Color Palete / Theme of the app
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

  const sliderImages = [
    require("../assets/cart_icon.png"),
    require("../assets/Slide1pic.jpg"),
    require("../assets/Slide2pic.jpg"),
    require("../assets/Slide3pic.jpg"),
  ];

  // Auto slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % sliderImages.length;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const collections = [
          "livingroom_products",
          "office_products",
          "bedroom_products",
        ];
        let allProducts: Product[] = [];

        for (const col of collections) {
          const snapshot = await getDocs(collection(firestore, col));
          snapshot.forEach((doc) => {
            allProducts.push({
              id: doc.id,
              ...(doc.data() as Omit<Product, "id">),
            });
          });
        }
        setProducts(allProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  // Notifications listener
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", user.uid),
      where("status", "==", "unread")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });
    return () => unsub();
  }, []);
  const filteredProducts = products.filter((item) => {
    const queryText = searchQuery.toLowerCase();

    return (
      item.name?.toLowerCase().includes(queryText) ||
      item.category?.toLowerCase().includes(queryText) ||
      item.glbUri?.toLowerCase().includes(queryText) ||
      item.username?.toLowerCase().includes(queryText) ||
      item.contactNo?.toLowerCase().includes(queryText) ||
      item.material?.toLowerCase().includes(queryText) ||
      item.color?.toLowerCase().includes(queryText) ||
      item.size?.toLowerCase().includes(queryText)
    );
  });

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

  const categories = [
    {
      id: "living",
      icon: "🛋️",
      label: "Living Room",
      screen: "livingroom",
      gradient: ["#E8DDD3", "#D4C4B7"],
    },

    {
      id: "bedroom",
      icon: "🛏️",
      label: "Bedroom",
      screen: "broomt",
      gradient: ["#C4B4A7", "#B4A497"],
    },
    {
      id: "office",
      icon: "📚🪑",
      label: "office",
      screen: "office",
      gradient: ["#B4A497", "#A49487"],
    },

    {
      id: "ar",
      icon: "📱",
      label: "AR View",
      screen: "furniture",
      gradient: ["#B4A497", "#A49487"],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Modern Sidebar Drawer */}
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
                  goToScreen?.("furniture");
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
                  goToScreen?.("settings");
                  toggleMenu();
                }}
              >
                <Text style={styles.drawerItemIcon}>⚙️</Text>
                <Text
                  style={[styles.drawerItemText, { color: colors.textPrimary }]}
                >
                  Settings
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

      {/* Modern Header */}
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchWrapper,
              { backgroundColor: colors.cardBg, borderColor: colors.border },
            ]}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search furniture..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text
                  style={[styles.clearIcon, { color: colors.textSecondary }]}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results */}
        {/* Search Results with Images */}
        {searchQuery.length > 0 ? (
          <View style={styles.searchResults}>
            {filteredProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.searchResultCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => goToScreen("productDetails", { product: item })}
              >
                <View style={styles.searchResultRow}>
                  {/* Thumbnail */}
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.searchResultImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.searchResultImage,
                        {
                          backgroundColor: "#EEE",
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      <Text style={{ color: "#999", fontSize: 12 }}>
                        No Image
                      </Text>
                    </View>
                  )}

                  {/* Info */}
                  <View style={styles.searchResultInfo}>
                    <Text
                      style={[
                        styles.searchResultName,
                        { color: colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.searchResultCategory,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.category}
                    </Text>
                    <Text
                      style={[
                        styles.searchResultPrice,
                        { color: colors.accent },
                      ]}
                    >
                      ₱{item.price.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <>
            {/* Modern Hero Carousel */}
            <View style={styles.carouselContainer}>
              <FlatList
                ref={flatListRef}
                data={sliderImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / (screenWidth - 32)
                  );
                  setActiveIndex(index);
                }}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                  <View
                    style={[styles.carouselItem, { width: screenWidth - 32 }]}
                  >
                    <Image
                      source={item}
                      style={styles.carouselImage}
                      resizeMode="cover"
                    />
                    <View style={styles.carouselOverlay}>
                      <Text style={styles.carouselTitle}>
                        Transform Your Space
                      </Text>
                      <Text style={styles.carouselSubtitle}>
                        with AR Technology
                      </Text>
                    </View>
                  </View>
                )}
              />

              {/* Modern Dots Indicator */}
              <View style={styles.dotsContainer}>
                {sliderImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        width: index === activeIndex ? 24 : 8,
                        backgroundColor:
                          index === activeIndex
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                Browse Categories
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Find your perfect furniture
              </Text>
            </View>

            {/* Modern Category Grid */}
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: colors.cardBg },
                  ]}
                  onPress={() => goToScreen?.(category.screen as Screen)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.categoryIconCircle,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Feature Highlight */}
            <View
              style={[styles.featureCard, { backgroundColor: colors.primary }]}
            >
<Text style={styles.featureTitle}>✨ Place Multiple Furniture</Text>
<Text style={styles.featureDescription}>
  Spawn and arrange multiple furniture pieces in your space before buying.
</Text>

              <TouchableOpacity
                style={[
                  styles.featureButton,
                  { backgroundColor: colors.accent },
                ]}
                onPress={() => setArGuideVisible(true)}              >
                <Text
                  style={[styles.featureButtonText, { color: colors.primary }]}
                >
                  Try Now
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
            <Modal
        animationType="fade"
        transparent={true}
        visible={arGuideVisible}
        onRequestClose={() => setArGuideVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.minimalModal, { backgroundColor: colors.cardBg }]}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              📱 AR Furniture Setup Guide
            </Text>

            <ScrollView
              style={{ maxHeight: 320, marginVertical: 8 }}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[styles.modalMessage, { color: colors.textSecondary }]}
              >
                • Ensure a{" "}
                <Text style={{ fontWeight: "600" }}>clear surrounding</Text>{" "}
                area for accurate surface recognition.{"\n\n"}• Slowly{" "}
                <Text style={{ fontWeight: "600" }}>move your phone</Text> to
                scan the environment.{"\n\n"}• Point your camera toward the{" "}
                <Text style={{ fontWeight: "600" }}>floor</Text> to avoid
                floating furniture.{"\n\n"}• When a valid placement area is
                detected, a{" "}
                <Text style={{ fontWeight: "600" }}>spawn indicator</Text> will
                appear.{"\n\n"}• Tap on the indicator to{" "}
                <Text style={{ fontWeight: "600" }}>spawn</Text> the furniture.
                {"\n\n"}• Tap the furniture to{" "}
                <Text style={{ fontWeight: "600" }}>highlight</Text> it — this
                enables <Text style={{ fontWeight: "600" }}>move</Text>,{" "}
                <Text style={{ fontWeight: "600" }}>rotate</Text>, or{" "}
                <Text style={{ fontWeight: "600" }}>reposition</Text> controls.
                {"\n\n"}• If you see a{" "}
                <Text style={{ fontWeight: "600" }}>shade or red tint</Text>, it
                means you’re in an{" "}
                <Text style={{ fontWeight: "600" }}>
                  invalid placement area
                </Text>
                .{"\n\n"}• Try scanning again in a well-lit, flat surface area
                for better detection.
              </Text>
            </ScrollView>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { backgroundColor: colors.border },
                ]}
                onPress={() => setArGuideVisible(false)}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setArGuideVisible(false);
                  Linking.openURL("arfurniture://multiple")

                }}
              >
                <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>
                  Proceed to AR
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modern Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          { backgroundColor: colors.cardBg, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToScreen?.("home")}
        >
          <View
            style={[
              styles.navIconContainer,
              styles.navActive,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={styles.navIconActive}>🏠</Text>
          </View>
          <Text
            style={[
              styles.navLabel,
              styles.navLabelActive,
              { color: colors.primary },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goToScreen?.("Wishlist")}
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
          onPress={() => goToScreen?.("profile")}
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
  headerLogo: {
    width: 90,
    height: 30,
  },
  settingsIcon: {
    fontSize: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
  },
  clearIcon: {
    fontSize: 16,
    padding: 4,
  },
  searchResults: {
    paddingHorizontal: 20,
  },
  searchResultCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchResultContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  searchResultCategory: {
    fontSize: 14,
  },
  searchResultPrice: {
    fontSize: 18,
    fontWeight: "700",
  },
  carouselContainer: {
    marginTop: 4,
    paddingHorizontal: 16,
  },
  carouselItem: {
    borderRadius: 16,
    overflow: "hidden",
    height: 160,
  },
  carouselImage: {
    width: "100%",
    height: "100%",
  },
  carouselOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 14,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  carouselSubtitle: {
    fontSize: 13,
    color: "#FFFFFF",
    marginTop: 2,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
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
  categoryGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  categoryCard: {
    width: (Dimensions.get("window").width - 56) / 2,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  categoryArrow: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryArrowText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  featureCard: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 24,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 15,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 16,
  },
  featureButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  featureButtonText: {
    fontSize: 15,
    fontWeight: "600",
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
  badge: {
    position: "absolute",
    top: 0,
    right: 8,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  navLabelActive: {
    fontWeight: "600",
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchResultImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
  },
  minimalModal: {
  width: "88%",
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 20,
  alignItems: "center",
  elevation: 10,
  shadowColor: "#000",
  shadowOpacity: 0.2,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
},

modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.45)",
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 20,
},

modalTitle: {
  fontSize: 20,
  fontWeight: "700",
  textAlign: "center",
  marginBottom: 12,
},

modalMessage: {
  fontSize: 14,
  lineHeight: 20,
  textAlign: "left",
},

modalButtonRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  width: "100%",
  marginTop: 18,
},

modalButton: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  marginHorizontal: 6,
},

cancelButton: {
  backgroundColor: "#E5E5E5",
},

modalButtonText: {
  fontSize: 15,
  fontWeight: "600",
},
});

export default HomeScreen;
