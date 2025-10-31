// FURARD.tsx
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
  category: "Chair" | "Sofa" | "TVStand";
  goToScreen: (screen: Screen, params?: any) => void;
  addToCart: (item: Product) => void;
}

const FURARD: React.FC<Props> = ({ category, goToScreen, addToCart }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  // Sorting toggle state
  const [isLowToHigh, setIsLowToHigh] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(firestore, "livingroom_products"),
          where("category", "==", category)
        );
        const querySnapshot = await getDocs(q);
        const productsData: Product[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error("Error fetching products: ", error);
      }
    };
    fetchProducts();
  }, [category]);

  const toggleDrawer = () => {
    if (drawerOpen) {
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setDrawerOpen(false));
    } else {
      setDrawerOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
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
      style={styles.card}
      onPress={() => goToScreen("productDetails", { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>₱{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>

        <Image
          source={require("../assets/cart_icon.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />

        {/* Settings icon */}
        <Text style={styles.headerIcon}>⚙️</Text>
      </View>

      {/* Drawer */}
      {drawerOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleDrawer}
        >
          <Animated.View
            style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
          >
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                toggleDrawer();
                goToScreen("home");
              }}
            >
              <Text style={styles.drawerText}>🏠 Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                toggleDrawer();
                goToScreen("cart");
              }}
            >
              <Text style={styles.drawerText}>🛒 Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                toggleDrawer();
                goToScreen("profile");
              }}
            >
              <Text style={styles.drawerText}>👤 Profile</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Single Sorting Button */}
      <View style={styles.sortContainer}>
        <TouchableOpacity style={styles.sortButton} onPress={toggleSort}>
          <Text style={styles.sortButtonText}>
            Sort: {isLowToHigh ? "Low to High" : "High to Low"} ▼
          </Text>
        </TouchableOpacity>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
      />

      {/* Bottom Navigation */}
      <BottomNav onNavigate={goToScreen} />
    </View>
  );
};

const BottomNav = ({
  onNavigate,
}: {
  onNavigate: (screen: Screen, params?: any) => void;
}) => {
  const navItems: { icon: string; label: string; target: Screen }[] = [
    { icon: "🏠", label: "Home", target: "home" },
    { icon: "📥", label: "Inbox", target: "cart" },
    { icon: "🛒", label: "Cart", target: "cart" },
    { icon: "👤", label: "Profile", target: "profile" },
  ];

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.navItem}
          onPress={() => onNavigate(item.target)}
        >
          <Text style={styles.navIcon}>{item.icon}</Text>
          <Text style={styles.navLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdf6ec" },

  // Header
  header: {
    backgroundColor: "#3E2E22",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerIcon: { color: "white", fontSize: 24 },
  logoImage: { width: 100, height: 40 },

  // Drawer
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: "#fffaf3",
    paddingTop: 60,
    zIndex: 1000,
    borderRightWidth: 1,
    borderColor: "#ddd",
  },
  drawerItem: { padding: 16 },
  drawerText: { fontSize: 18, color: "#3e2723", fontWeight: "600" },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 999,
  },

  // Sorting button
  sortContainer: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#f8e6d2",
  },
  sortButton: {
    backgroundColor: "#3E2E22",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sortButtonText: { color: "white", fontWeight: "600" },

  // Product cards
  list: { padding: 10 },
  card: {
    flex: 1,
    margin: 10,
    padding: 10,
    backgroundColor: "#fffaf3",
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  image: { width: 120, height: 120, marginBottom: 10, borderRadius: 8 },
  name: { fontSize: 16, fontWeight: "700", color: "#3e2723" },
  price: { fontSize: 14, color: "#d35400", marginTop: 4 },

  // Bottom nav
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#3E2E22",
    paddingVertical: 10,
  },
  navItem: { alignItems: "center" },
  navIcon: { color: "white", fontSize: 22 },
  navLabel: { color: "white", fontSize: 12, marginTop: 2 },
});

export default FURARD;
