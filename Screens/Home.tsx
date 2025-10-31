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
} from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import type { Screen } from "../types";
import { query, where, onSnapshot } from "firebase/firestore";
import { auth } from "../firebase/firebaseConfig";

interface HomeScreenProps {
  onEnterShop?: () => void;
  onCart?: () => void;
  goToScreen: (screen: Screen, params?: any) => void;
}

interface Product {
  id: string;
  name: string;
  category: string;
  glbUri: string;
  image: string;
  price: number;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onEnterShop,
  onCart,
  goToScreen,
}) => {
  const screenWidth = Dimensions.get("window").width;
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 🔹 Carousel static images
  const sliderImages = [
    require("../assets/cart_icon.png"),
    require("../assets/Slide1pic.jpg"),
    require("../assets/Slide2pic.jpg"),
    require("../assets/Slide3pic.jpg"),
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<any>>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🔹 Auto slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % sliderImages.length;
      setActiveIndex(nextIndex);

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 4000); // slide every 4 seconds

    return () => clearInterval(interval);
  }, [activeIndex]);

  // 🔹 Fetch products from multiple collections
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const collections = [
          "livingroom_products",
          "dining_products",
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

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(firestore, "notifications"), // top-level collection
      where("userId", "==", user.uid), // only this user
      where("status", "==", "unread") // only unread
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size); // update badge count
    });

    return () => unsub();
  }, []);

  // 🔹 Search filter (check name, category, and glbUri)
  const filteredProducts = products.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query) ||
      item.glbUri?.toLowerCase().includes(query)
    );
  });

  // 🔹 Handle navigation based on category
  const handleNavigate = (category: string) => {
    if (!goToScreen) return;

    switch (category.toLowerCase()) {
      case "sofa":
      case "chair":
      case "tvstand":
      case "livingroom":
        goToScreen("livingroom");
        break;

      case "dining":
      case "table":
        goToScreen("droomt");
        break;

      case "bedroom":
      case "bed":
      case "wardrobe":
        goToScreen("broomt");
        break;

      default:
        goToScreen("furniture"); // fallback
    }
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

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => goToScreen("settings")}
        >
          <Text style={styles.headerIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={{ padding: 12 }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search furniture..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Search Results */}
      {searchQuery.length > 0 ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.searchResultItem}
              onPress={() => goToScreen("productDetails", { product: item })}
            >
              <Text style={styles.searchResultName}>{item.name}</Text>
              <Text style={styles.searchResultPrice}>₱{item.price}</Text>
              <Text style={styles.searchResultCategory}>{item.category}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <>
          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.imageSlider}>
              <FlatList
                ref={flatListRef}
                data={sliderImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / screenWidth
                  );
                  setActiveIndex(index);
                }}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                  <Image
                    source={item}
                    style={[styles.sliderImage, { width: screenWidth - 32 }]}
                    resizeMode="cover"
                  />
                )}
              />

              {/* 🔹 Dots Indicator */}
              <View style={styles.dotsContainer}>
                {sliderImages.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      { opacity: index === activeIndex ? 1 : 0.3 },
                    ]}
                  />
                ))}
              </View>
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
        </>
      )}

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
          onPress={() => goToScreen?.("inbox")}
        >
          <Text style={styles.navIcon}>📥</Text>
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
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

// STYLES
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
  imageSlider: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  sliderImage: {
    height: 180,
    borderRadius: 12,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3E2E22",
    marginHorizontal: 4,
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
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#000",
  },
  searchResultItem: {
    backgroundColor: "#fff",
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  searchResultPrice: {
    fontSize: 14,
    color: "#333",
  },
  searchResultCategory: {
    fontSize: 12,
    color: "#555",
  },
  notifBadge: {
    position: "absolute",
    right: -6,
    top: -4,
    backgroundColor: "red",
    borderRadius: 8,
    minWidth: 16,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  settingsButton: {
    padding: 6,
  },

  notifBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});
