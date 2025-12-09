import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, firestore } from "../firebase/firebaseConfig";
import CustomAlert from "./CustomAlert"; // adjust path if needed
import type { Screen } from "./App";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
  status?: string;
  description?: string;
}

interface SellerPartProps {
  goToScreen: (screen: Screen, params?: any) => void;
}

const SellerPart: React.FC<SellerPartProps> = ({ goToScreen }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // CustomAlert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    const fetchSellerProducts = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(firestore, "products"),
          where("uploader", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);

        const items: Product[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as Product);
        });

        setProducts(items);
      } catch (error) {
        console.error("Error fetching seller products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProducts();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSuccessVisible(true);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "rejected":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status || "Pending"}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>₱{item.price.toLocaleString()}</Text>
        {item.category && <Text style={styles.category}>{item.category}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Products</Text>
          <Text style={styles.subtitle}>
            {products.length} {products.length === 1 ? "item" : "items"}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => goToScreen("UploadF")}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadIcon}>+</Text>
            <Text style={styles.uploadText}>Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => setAlertVisible(true)}
          >
            <Text style={styles.logoutText}>⎋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading your products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📦</Text>
          </View>
          <Text style={styles.emptyTitle}>No products yet</Text>
          <Text style={styles.emptyText}>
            Start by uploading your first product
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => goToScreen("UploadF")}
          >
            <Text style={styles.emptyButtonText}>Upload Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Logout Confirmation Alert */}
      <CustomAlert
        visible={alertVisible}
        type="question"
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        showCancel
        onConfirm={() => {
          setAlertVisible(false);
          handleLogout();
        }}
        onCancel={() => setAlertVisible(false)}
      />

      {/* Logout Success Alert */}
      <CustomAlert
        visible={successVisible}
        type="success"
        title="Logged Out"
        message="You have been successfully logged out."
        confirmText="OK"
        onConfirm={() => {
          setSuccessVisible(false);
          goToScreen("lreg");
        }}
      />
    </View>
  );
};

export default SellerPart;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButton: {
    marginLeft: 10,
    backgroundColor: "#E4E4E7",
    borderRadius: 50,
    padding: 8,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  uploadButton: {
    backgroundColor: "#000000",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
  },
  uploadIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    marginRight: 4,
  },
  uploadText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#F5F5F7",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 32,
  },
  statusBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  info: {
    marginLeft: 12,
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 6,
  },
  category: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    backgroundColor: "#F3F4F6",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#000000",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
