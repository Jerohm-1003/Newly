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
  ScrollView,
  StatusBar,
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
  getDocs,
} from "firebase/firestore";
import type { Screen } from "../types";
import CustomAlert from "./CustomAlert";

const { width } = Dimensions.get("window");

interface Product {
  code: React.JSX.Element;
  address: React.JSX.Element;
  uploadedBy: string;
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  prefabKey?: string;
  username?: string;
  contact?: string;

  contactNo?: string;
  description: string;
  material?: string;
  color?: string;
  size?: string;
}

interface ProductDetailsProps {
  product: Product;
  goToScreen: (screen: Screen, params?: any) => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  goToScreen,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [currentProductName, setCurrentProductName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [arGuideVisible, setArGuideVisible] = useState(false);
  const [sellerName, setSellerName] = useState<string>("");
  const [loginAlertVisible, setLoginAlertVisible] = useState(false);

  useEffect(() => {
    const fetchSellerName = async () => {
      try {
        // Assuming `uploadedBy` is the UID of the seller
        if (!product.uploadedBy) return;

        const sellerDocRef = doc(firestore, "users", product.uploadedBy);
        const sellerSnap = await getDoc(sellerDocRef);

        if (sellerSnap.exists()) {
          const data = sellerSnap.data();
          setSellerName(data.username || "Unknown Seller");
        } else {
          setSellerName("Unknown Seller");
        }
      } catch (error) {
        console.error("Error fetching seller info:", error);
        setSellerName("Unknown Seller");
      }
    };

    fetchSellerName();
  }, [product.uploadedBy]);
  useEffect(() => {
    const fetchFullProductData = async () => {
      try {
        setLoading(true);

        let productDoc = null;

        // Try finding it in the 'products' collection
        const mainRef = doc(firestore, "products", product.id);
        const mainSnap = await getDoc(mainRef);

        if (mainSnap.exists()) {
          productDoc = { id: mainSnap.id, ...mainSnap.data() };
        } else {
          // If not in 'products', check the category collection
          const categoryRef = doc(
            firestore,
            `${product.category.toLowerCase()}_products`,
            product.id
          );
          const categorySnap = await getDoc(categoryRef);

          if (categorySnap.exists()) {
            productDoc = { id: categorySnap.id, ...categorySnap.data() };
          }
        }

        if (productDoc) {
          // merge to include missing fields like material, color, etc.
          Object.assign(product, productDoc);
        }
      } catch (error) {
        console.error("Error fetching full product info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFullProductData();
  }, [product.id]);

  // Color Palette / Theme
  const colors = {
    primary: "#2D2416",
    secondary: "#8B7355",
    accent: "#D4A574",
    background: "#FAF8F5",
    cardBg: "#FFFFFF",
    textPrimary: "#1A1A1A",
    textSecondary: "#6B6B6B",
    border: "#E8E8E8",
    success: "#27AE60",
    warning: "#F39C12",
  };

  // Top Navigation Burger
  const slideAnim = useRef(new Animated.Value(-width)).current;

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

  const handleARView = () => {
    if (!product.prefabKey) return;
    Linking.openURL(
      `arfurniture://start?category=${product.category}&prefabKey=${product.prefabKey}`
    );
  };

  // Add to wishlist function
  const handleAddToWishlist = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoginAlertVisible(true);
      return;
    }

    try {
      // Reference to user's wishlist subcollection
      const wishlistRef = collection(firestore, "users", user.uid, "wishlist");

      // Check if product already exists in wishlist
      const q = query(wishlistRef, where("id", "==", product.id));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setModalMessage("This item is already in your Wishlist ❤️");
        setModalVisible(true);
        return;
      }

      // Add product to wishlist
      await addDoc(wishlistRef, {
        ...product,
        addedAt: serverTimestamp(),
      });

      // After adding to wishlist
      await addDoc(collection(firestore, "notifications"), {
        userId: user.uid,
        type: "wishlist",
        message: `You added "${product.name}" to your Wishlist.`,
        status: "unread",
        productName: product.name,
        price: product.price,
        productId: product.id,
        createdAt: serverTimestamp(),
      });

      setModalMessage("Added to your Wishlist ❤️");
      setModalVisible(true);
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      setModalMessage("Failed to add to Wishlist. Try again.");
      setModalVisible(true);
    }
  };

  const handleProductReview = () => {
    if (!product.prefabKey) return;
    Linking.openURL(
      `arfurniture://review?category=${product.category}&prefabKey=${product.prefabKey}`
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.headerButton} onPress={toggleDrawer}>
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

        <Text style={styles.headerTitle}>Product Details</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => goToScreen("home")}
        >
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Modern Drawer */}
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
              <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>
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
                  style={[styles.drawerItemText, { color: colors.textPrimary }]}
                >
                  Home
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
                  style={[styles.drawerItemText, { color: colors.textPrimary }]}
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image with AR Buttons */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.image} />

          {product.prefabKey && (
            <View style={styles.overlayButtons}>
              <TouchableOpacity
                style={[
                  styles.overlayButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => setArGuideVisible(true)}
              >
                <Text style={styles.overlayButtonText}>👓 AR View</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.overlayButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleProductReview}
              >
                <Text style={styles.overlayButtonText}>📦 Preview</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Product Info Card */}
        <View style={[styles.productCard, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.productName, { color: colors.textPrimary }]}>
            {product.name}
          </Text>

          <Text style={[styles.productPrice, { color: colors.primary }]}>
            ₱ {product.price.toLocaleString()}
          </Text>

          {product.username && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>👤</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Seller: {product.username}
              </Text>
            </View>
          )}
          {product.contact && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📞</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Contact No: {product.contact}
              </Text>
            </View>
          )}

          {product.code && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🔗</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                CODE: {product.code}
              </Text>
            </View>
          )}

          {product.material && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🪵</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Material: {product.material}
              </Text>
            </View>
          )}
          {product.color && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🎨</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Color: {product.color}
              </Text>
            </View>
          )}

          {product.size && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📏</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Size: {product.size}
              </Text>
            </View>
          )}

          {product.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🏢</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Address: {product.address}
              </Text>
            </View>
          )}

          {product.description && (
            <View style={styles.descriptionSection}>
              <Text
                style={[styles.descriptionTitle, { color: colors.textPrimary }]}
              >
                Description
              </Text>
              <Text
                style={[
                  styles.descriptionText,
                  { color: colors.textSecondary },
                ]}
              >
                {product.description}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Modern Bottom Action Bar */}
      <View
        style={[
          styles.bottomActionBar,
          { backgroundColor: colors.cardBg, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.buyNowButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={handleAddToWishlist}
        >
          <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
            add to Wishlist
          </Text>
        </TouchableOpacity>
      </View>
      {/* AR Guidance Modal */}
      {/* AR Guidance Modal */}
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
                  handleARView();
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

      {/* Modern Buy Now Modal */}

      {/* Feedback Modal */}
      {/* Feedback Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.feedbackModal,
              { backgroundColor: colors.cardBg, borderRadius: 16 },
            ]}
          >
            <Text
              style={[
                styles.feedbackMessage,
                { color: colors.textPrimary, textAlign: "center" },
              ]}
            >
              {modalMessage}
            </Text>

            <TouchableOpacity
              style={[
                styles.feedbackButton,
                { backgroundColor: colors.primary, marginTop: 20 },
              ]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.feedbackButtonText, { color: "#FFFFFF" }]}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <CustomAlert
        visible={loginAlertVisible}
        type="warning"
        title="Login Required"
        message="Please log in first"
        confirmText="OK"
        showCancel={false} // Only 1 button
        onConfirm={() => {
          setLoginAlertVisible(false);

          goToScreen("lreg"); // ← redirect after pressing OK
        }}
      />

      {/* Bottom Nav */}
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
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 360,
    backgroundColor: "#F5F5F5",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlayButtons: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  overlayButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  overlayButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  productCard: {
    margin: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  productName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
  },
  descriptionSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bottomActionBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buyNowButton: {},
  actionButtonText: {
    fontWeight: "700",
    fontSize: 15,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  addressInput: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    flex: 0.8,
  },
  modalButtonText: {
    fontWeight: "700",
    fontSize: 15,
  },
  qrProductName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  qrImageContainer: {
    width: 220,
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  qrInfoContainer: {
    width: "100%",
    marginBottom: 20,
  },
  qrLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  qrValue: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  qrPrice: {
    fontSize: 24,
    fontWeight: "700",
  },
  minimalModal: {
    width: "88%",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  feedbackModal: {
    width: "80%",
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  feedbackMessage: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  feedbackButton: {
    width: "60%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProductDetails;
