import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Modal,
  Animated,
  Dimensions,
  TextInput,
  Alert,
} from "react-native";
import { auth, firestore } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { CartItem } from "./App";
import type { Screen } from "../types";

const { width } = Dimensions.get("window");

interface Product {
  uploadedBy: string;
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  prefabKey?: string;
  username?: string;
  contactNo?: string | null;
  description: string;
}

interface ProductDetailsProps {
  product: Product;
  goToScreen: (screen: Screen, params?: any) => void;
  addToCart: (item: CartItem) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  goToScreen,
  addToCart,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [buyNowModalVisible, setBuyNowModalVisible] = useState(false);

  // Address fields
  const [fullName, setFullName] = useState("");
  const [province, setProvince] = useState("");
  const [barangay, setBarangay] = useState("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [currentReferenceId, setCurrentReferenceId] = useState<string | null>(
    null
  );
  const [currentTotal, setCurrentTotal] = useState<number>(0);
  const [currentProductName, setCurrentProductName] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Drawer animation
  const slideAnim = useRef(new Animated.Value(-width)).current;

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

  const handleARView = () => {
    if (!product.prefabKey) return;
    Linking.openURL(
      `arfurniture://start?category=${product.category}&prefabKey=${product.prefabKey}`
    );
  };

  const handleProductReview = () => {
    if (!product.prefabKey) return;
    Linking.openURL(
      `arfurniture://review?category=${product.category}&prefabKey=${product.prefabKey}`
    );
  };

  const handleAddToCart = () => {
    const user = auth.currentUser;
    if (!user) {
      setModalMessage("Please log in to add items to your cart.");
      setModalVisible(true);
      goToScreen("lreg");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });

    setModalMessage(`${product.name} added to cart!`);
    setModalVisible(true);
  };

  // ✅ Place Order in Firestore (uses uploader as sellerId)
  const handlePlaceOrder = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Please log in to place an order.");
      goToScreen("lreg");
      return;
    }

    if (!fullName || !province || !barangay || !street || !zipCode) {
      Alert.alert("Missing Fields", "Please complete all address fields.");
      return;
    }

    try {
      setLoading(true);

      // 🔹 Get latest product info from Firestore to ensure we have uploadedBy
      const productRef = doc(firestore, "products", product.id);
      const productSnap = await getDoc(productRef);

      let sellerId: string | null = null;

      if (productSnap.exists()) {
        const productData = productSnap.data();
        sellerId = productData.uploadedBy || null;
      }

      // 🔹 Fallback: use uploadedBy from prop if available
      if (!sellerId && product.uploadedBy) {
        sellerId = product.uploadedBy;
      }

      if (!sellerId) {
        Alert.alert("Error", "Unable to identify seller for this product.");
        setLoading(false);
        return;
      }

      // ✅ Create order with correct sellerId
      const orderRef = await addDoc(collection(firestore, "orders"), {
        userId: user.uid,
        sellerId: sellerId, // ✅ always auto-included now
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        totalPrice: product.price,
        address: {
          fullName,
          province,
          barangay,
          street,
          zipCode,
        },
        description: product.description || "",
        sellerName: product.username || "Unknown",
        sellerContact: product.contactNo || "Not provided",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // ✅ Create matching payment record
      const refId = Math.random().toString(36).substring(2, 10);
      await addDoc(collection(firestore, "payments"), {
        orderId: orderRef.id,
        userId: user.uid,
        sellerId: sellerId, // ✅ same link to seller
        productName: product.name,
        totalPrice: product.price,
        referenceId: refId,
        method: "QRPh",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setCurrentReferenceId(refId);
      setCurrentTotal(product.price);
      setCurrentProductName(product.name);
      Alert.alert("Success", "Order placed successfully!");
      setQrModalVisible(true);
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const paymentsRef = collection(firestore, "payments");
    const q = query(paymentsRef, where("userId", "==", user.uid));

    const unsub = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const data = change.doc.data();
        if (!data) continue;

        if (
          (change.type === "added" || change.type === "modified") &&
          (data.status === "approved" || data.status === "declined")
        ) {
          if (data.status === "approved") {
            Alert.alert(
              "✅ Payment Approved",
              `Payment for "${data.productName || "item"}" approved.`
            );
          } else if (data.status === "declined") {
            Alert.alert(
              "❌ Payment Declined",
              `Payment for "${data.productName || "item"}" declined.`
            );
          }

          // Optional: Close QR modal once processed
          setQrModalVisible(false);

          // mark as done
          try {
            const ref = doc(firestore, "payments", change.doc.id);
            await updateDoc(ref, {
              status: "done",
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            console.warn("Failed to mark payment done:", err);
          }
        }
      }
    });

    return () => unsub();
  }, []);

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

      {/* Product Info */}
      <View style={styles.itemDetailCard}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.image} />

          {product.prefabKey && (
            <View style={styles.overlayButtons}>
              <TouchableOpacity
                style={styles.overlayButton}
                onPress={handleARView}
              >
                <Text style={styles.overlayButtonText}>👓 AR View</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.overlayButton}
                onPress={handleProductReview}
              >
                <Text style={styles.overlayButtonText}>📦 Preview</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.itemName}>{product.name}</Text>
        {product.username && (
          <Text style={styles.postedBy}>Posted by: {product.username}</Text>
        )}
        {product.contactNo && (
          <Text style={styles.postedBy}>Contact: {product.contactNo}</Text>
        )}
        {product.description && (
          <Text style={styles.description}>{product.description}</Text>
        )}
        <Text style={styles.itemPrice}>₱ {product.price}</Text>
      </View>

      <View style={styles.bottomActionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={handleAddToCart}>
          <Text style={styles.actionButtonText}>🛒 Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.buyNowButton]}
          onPress={() => setBuyNowModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>💳 Buy Now</Text>
        </TouchableOpacity>
      </View>

      {/* Buy Now Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={buyNowModalVisible}
        onRequestClose={() => setBuyNowModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Enter Shipping Address</Text>

            <TextInput
              style={styles.addressInput}
              placeholder="Full Name"
              placeholderTextColor="#555"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.addressInput}
              placeholder="Province"
              placeholderTextColor="#555"
              value={province}
              onChangeText={setProvince}
            />
            <TextInput
              style={styles.addressInput}
              placeholder="Barangay"
              placeholderTextColor="#555"
              value={barangay}
              onChangeText={setBarangay}
            />
            <TextInput
              style={styles.addressInput}
              placeholder="Street / House No."
              placeholderTextColor="#555"
              value={street}
              onChangeText={setStreet}
            />
            <TextInput
              style={styles.addressInput}
              placeholder="ZIP Code"
              placeholderTextColor="#555"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handlePlaceOrder}
            >
              <Text style={styles.modalButtonText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <BottomNav onNavigate={goToScreen} />

      {/* Feedback Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                if (currentReferenceId) {
                  setQrModalVisible(true); // show QR after clicking OK
                }
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* QR Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Scan to Pay</Text>

            {currentReferenceId && (
              <>
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    marginBottom: 5,
                    color: "#555",
                  }}
                >
                  {currentProductName}
                </Text>

                <Image
                  source={require("../assets/code_hLnVjWzpqhh7xsKZLFg3EZcV.jpg")}
                  style={{ width: 200, height: 200, marginBottom: 10 }}
                />

                <Text style={{ fontSize: 12, color: "#555" }}>
                  Reference ID: {currentReferenceId}
                </Text>
                <Text style={{ fontSize: 14, marginBottom: 5, color: "#555" }}>
                  Price: ₱{currentTotal}
                </Text>
              </>
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setQrModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Bottom Nav
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

  // Product Info
  itemDetailCard: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  image: {
    width: "100%", // make it fill container width
    height: "100%", // fully fill height
    resizeMode: "cover", // make sure it covers the frame evenly
  },

  itemName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3e2723",
    marginBottom: 6,
  },
  itemPrice: { fontSize: 18, fontWeight: "600", color: "#d35400" },

  description: {
    fontSize: 14,
    color: "#5a4639",
    marginBottom: 6,
    lineHeight: 18,
  },

  postedBy: {
    fontSize: 14,
    color: "#7f6a5d",
    marginBottom: 6,
    fontStyle: "italic",
  },

  // Action Buttons
  bottomActionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },

  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#D8C3A5",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },

  actionButtonText: {
    color: "#3E2E22",
    fontWeight: "700",
    fontSize: 13,
  },

  buyNowButton: {
    backgroundColor: "#d35400",
  },

  cartButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#EBDDCB",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cartButtonText: { color: "#3E2E22", fontWeight: "600", fontSize: 14 },
  arButton: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: "#6B4F3B",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  arButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  buyNowButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Bottom Nav
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#3E2E22",
    paddingVertical: 10,
  },
  navItem: { alignItems: "center" },
  navIcon: { color: "white", fontSize: 22 },
  navLabel: { color: "white", fontSize: 12, marginTop: 2 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    width: 280,
    backgroundColor: "#fffaf3",
    borderRadius: 14,
    padding: 22,
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 18,
    textAlign: "center",
    color: "#3e2723",
  },
  modalButton: {
    backgroundColor: "#e67e22",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 10,
    marginTop: 10,
  },
  modalButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  addressInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
    color: "rgba(0,0,0,1)",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 999,
  },
  imageContainer: {
    position: "relative",
    width: "95%",
    height: 300,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(240, 226, 208, 0.2)", // lighter border so it doesn’t reflect white
    backgroundColor: "transparent", // ✅ remove white tint inside
  },

  overlayButtons: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 2, // ✅ ensure it’s above image only
  },

  overlayButton: {
    backgroundColor: "rgba(82, 61, 41, 0.45)", // 45% opacity = more transparent but still visible brown
    borderRadius: 8, // slightly smaller corners
    paddingVertical: 5, // smaller height
    paddingHorizontal: 10, // narrower width
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "transparent", // remove any white glow
  },

  overlayButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12, // a bit smaller to match the button
    backgroundColor: "transparent", // keep no white behind text
  },
});

export default ProductDetails;
