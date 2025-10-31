import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Animated,
  Dimensions,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import { auth, firestore } from "../firebase/firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import type { Screen } from "./App";

const { width } = Dimensions.get("window");

interface Order {
  buyerReceived: boolean;
  id: string;
  productName: string;
  price: number;
  quantity: number;
  description: string;
  username: string;
  contactNo: string;
  address: {
    fullName: string;
    province: string;
    barangay: string;
    street: string;
    zipCode: string;
  };
  status: string;
  userId: string;
  sellerId: string;
  productId: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category?: string;
  images?: string[];
  status?: string;
}

interface Payment {
  liquidated: boolean;
  id: string;
  amount: number;
  status: string;
  orderId: string;
  sellerId: string;
}

interface SellerPartProps {
  goBack: () => void;
  goToScreen: (screen: Screen, params?: any) => void;
}

const SellerPart: React.FC<SellerPartProps> = ({ goToScreen }) => {
  const [step, setStep] = useState(2);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [isSeller, setIsSeller] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [liquidations, setLiquidations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "products">("orders");
  const [liquidationStats, setLiquidationStats] = useState({
    liquidatedCount: 0,
    notLiquidatedCount: 0,
    activeView: "liquidated" as "liquidated" | "pending",
  });
  const [liquidationModalVisible, setLiquidationModalVisible] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const user = auth.currentUser;
  const totalSales = liquidations
    .filter((p) => p.liquidated && p.status === "approved")
    .reduce((sum, p) => sum + (p.amount || p.totalPrice || 0), 0);
  const adminCut = totalSales * 0.2;
  const sellerEarnings = totalSales - adminCut;

  // -------------------------------
  // Check user role
  useEffect(() => {
    const checkUser = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.role === "seller" || data.isSeller) {
            setIsSeller(true);
            setStep(3);
          } else {
            setIsSeller(false);
            setStep(2);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [user]);

  // -------------------------------
  // Fetch Orders
  useEffect(() => {
    if (!user || !isSeller) return;
    const ordersRef = collection(firestore, "orders");
    const q = query(ordersRef, where("sellerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedOrders: Order[] = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let buyerInfo = { username: "", contactNo: "" };
          if (data.userId) {
            const buyerSnap = await getDoc(
              doc(firestore, "users", data.userId)
            );
            if (buyerSnap.exists()) {
              buyerInfo = {
                username: buyerSnap.data().username || "",
                contactNo: buyerSnap.data().contactNumber || "",
              };
            }
          }
          return {
            id: docSnap.id,
            productName: data.productName || "",
            price: data.price || 0,
            quantity: data.quantity || 1,
            description: data.description || "",
            username: buyerInfo.username,
            contactNo: buyerInfo.contactNo,
            address: {
              fullName: data.address?.fullName || "",
              street: data.address?.street || "",
              barangay: data.address?.barangay || "",
              province: data.address?.province || "",
              zipCode: data.address?.zipCode || "",
            },
            status: data.status || "pending",
            userId: data.userId || "",
            sellerId: data.sellerId || "",
            productId: data.productId || "",
            buyerReceived: data.buyerReceived || false,
          };
        })
      );
      setOrders(fetchedOrders);
    });
    return () => unsubscribe();
  }, [user, isSeller]);

  // -------------------------------
  // Fetch Uploaded Products
  useEffect(() => {
    if (!user || !isSeller) return;
    const productsRef = collection(firestore, "products");
    const q = query(productsRef, where("uploadedBy", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Product[];
      setProducts(fetched);
    });
    return () => unsubscribe();
  }, [user, isSeller]);

  // -------------------------------
  // Fetch Payments / Liquidations
  // -------------------------------
  // Fetch Payments / Liquidations (detailed)
  useEffect(() => {
    if (!user || !isSeller) return;
    const paymentsRef = collection(firestore, "payments");
    const q = query(paymentsRef, where("sellerId", "==", user.uid));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allPayments = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Payment[];

      const liquidated = allPayments.filter((p) => p.liquidated);
      const notLiquidated = allPayments.filter((p) => !p.liquidated);

      setLiquidationStats((prev) => ({
        ...prev,
        liquidatedCount: liquidated.length,
        notLiquidatedCount: notLiquidated.length,
      }));

      // ✅ Keep both lists, show detailed info later
      setLiquidations(allPayments);
    });

    return () => unsubscribe();
  }, [user, isSeller]);

  // -------------------------------
  const handleRegisterBusiness = async () => {
    if (!businessName || !ownerName || !shopAddress || !contactNumber) {
      Alert.alert("Error", "Please fill all business info fields.");
      return;
    }
    if (!user) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }
    try {
      await setDoc(
        doc(firestore, "users", user.uid),
        {
          isSeller: true,
          role: "seller",
          sellerInfo: {
            businessName,
            ownerName,
            shopAddress,
            contactNumber,
            createdAt: new Date(),
          },
        },
        { merge: true }
      );
      setIsSeller(true);
      setModalMessage("Your shop has been registered successfully!");
      setModalVisible(true);
      setStep(3);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not register your shop.");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(firestore, "orders", orderId), { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setModalMessage(`Order marked as ${newStatus}`);
      setModalVisible(true);
    } catch {
      setModalMessage("Could not update order.");
      setModalVisible(true);
    }
  };

  const toggleDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: drawerOpen ? -width : 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setDrawerOpen(!drawerOpen));
  };

  // -------------------------------
  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3E2E22" />
      </View>
    );

  // STEP 2: Upgrade Buyer → Seller
  if (!isSeller && step === 2) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Become a Seller</Text>
        <Text style={styles.desc}>
          Provide your shop details to start selling your furniture.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Business / Shop Name"
          value={businessName}
          onChangeText={setBusinessName}
          placeholderTextColor="#6B4F3B"
        />
        <TextInput
          style={styles.input}
          placeholder="Owner Full Name"
          value={ownerName}
          onChangeText={setOwnerName}
          placeholderTextColor="#6B4F3B"
        />
        <TextInput
          style={styles.input}
          placeholder="Shop Address"
          value={shopAddress}
          onChangeText={setShopAddress}
          placeholderTextColor="#6B4F3B"
        />
        <TextInput
          style={styles.input}
          placeholder="Contact Number"
          keyboardType="phone-pad"
          value={contactNumber}
          onChangeText={setContactNumber}
          placeholderTextColor="#6B4F3B"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleRegisterBusiness}
        >
          <Text style={styles.buttonText}>Submit Shop Info</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // -------------------------------
  // STEP 3: Dashboard
  return (
    <View style={styles.container}>
      {/* Header */}
      {/* Header with Back Button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={goToScreen ? () => goToScreen("profile") : () => {}}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleDrawer}>
            <Text style={styles.headerIcon}>☰</Text>
          </TouchableOpacity>
        </View>

        <Image
          source={require("../assets/cart_icon.png")}
          style={styles.logoImage}
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
                goToScreen("UploadF");
              }}
            >
              <Text style={styles.drawerText}>Upload Products</Text>
            </TouchableOpacity>
            <View style={styles.liquidationSidebar}>
              <Text style={styles.liqSidebarTitle}>💸 Liquidation Status</Text>
              <Text style={styles.liqSidebarItem}>
                ✅ Naliquidate na: {liquidationStats.liquidatedCount}
              </Text>
              <Text style={styles.liqSidebarItem}>
                ⏳ Hindi pa: {liquidationStats.notLiquidatedCount}
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "orders" && styles.tabActive]}
          onPress={() => setActiveTab("orders")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "orders" && styles.tabTextActive,
            ]}
          >
            Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "products" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("products")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "products" && styles.tabTextActive,
            ]}
          >
            My Products
          </Text>
        </TouchableOpacity>
      </View>

      {/* ORDERS TAB */}
      {activeTab === "orders" ? (
        orders.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => (
              <View style={styles.orderCard}>
                <Text style={styles.productName}>{item.productName}</Text>
                <Text style={styles.detailText}>
                  Description: {item.description}
                </Text>
                <Text style={styles.detailText}>Buyer: {item.username}</Text>
                <Text style={styles.detailText}>Contact: {item.contactNo}</Text>
                <Text style={styles.detailText}>
                  Address:{" "}
                  {`${item.address.street}, ${item.address.barangay}, ${item.address.province}, ${item.address.zipCode}`}
                </Text>
                <Text style={styles.detailText}>Quantity: {item.quantity}</Text>
                <Text style={styles.detailText}>Price: ₱{item.price}</Text>
                <Text style={styles.statusText}>Status: {item.status}</Text>
                <Text style={styles.statusText}>
                  Status: {item.buyerReceived ? "✅ Received by buyer " : ""}
                  <Text>{item.username}</Text>
                </Text>

                {item.status === "pending" && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.buttonApprove}
                      onPress={() => updateOrderStatus(item.id, "approved")}
                    >
                      <Text style={styles.buttonText}>Approve ✅</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.buttonReject}
                      onPress={() => updateOrderStatus(item.id, "rejected")}
                    >
                      <Text style={styles.buttonText}>Reject ❌</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />
        )
      ) : (
        /* PRODUCTS TAB */
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.detailText}>₱{item.price}</Text>
              <Text style={styles.detailText}>
                Description: {item.description}
              </Text>
              {item.status && (
                <Text style={styles.statusText}>
                  Status: {item.status.toUpperCase()}
                </Text>
              )}
            </View>
          )}
        />
      )}

      {/* Modal */}
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
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Liquidation Summary */}
      {/* 🔸 Liquidation Overview Section */}
      {/* 🔸 Liquidation Overview Button */}
      <View style={styles.liquidationContainer}>
        <TouchableOpacity
          style={styles.overviewButton}
          onPress={() => setLiquidationModalVisible(true)}
        >
          <Text style={styles.overviewButtonText}>
            💸 View Liquidation Overview
          </Text>
        </TouchableOpacity>

        {/* Modal for Liquidation Overview */}
        <Modal
          visible={liquidationModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setLiquidationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: "85%" }]}>
              <Text style={styles.modalTitle}>💸 Liquidation Overview</Text>

              {/* Summary */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>
                  Total Sales: ₱{totalSales.toFixed(2)}
                </Text>
                <Text style={styles.summaryText}>
                  Admin Commission: ₱{adminCut.toFixed(2)}
                </Text>
                <Text style={styles.summaryText}>
                  Seller Earnings: ₱{sellerEarnings.toFixed(2)}
                </Text>
              </View>

              {/* Toggle Buttons */}
              <View style={styles.toggleButtons}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    liquidationStats.activeView === "liquidated" &&
                      styles.toggleBtnActive,
                  ]}
                  onPress={() =>
                    setLiquidationStats((prev) => ({
                      ...prev,
                      activeView: "liquidated",
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.toggleText,
                      liquidationStats.activeView === "liquidated" &&
                        styles.toggleTextActive,
                    ]}
                  >
                    💰 Liquidated ({liquidationStats.liquidatedCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    liquidationStats.activeView === "pending" &&
                      styles.toggleBtnActive,
                  ]}
                  onPress={() =>
                    setLiquidationStats((prev) => ({
                      ...prev,
                      activeView: "pending",
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.toggleText,
                      liquidationStats.activeView === "pending" &&
                        styles.toggleTextActive,
                    ]}
                  >
                    ⏳ Pending ({liquidationStats.notLiquidatedCount})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* List */}
              <FlatList
                data={
                  liquidationStats.activeView === "liquidated"
                    ? liquidations.filter((p) => p.liquidated)
                    : liquidations.filter((p) => !p.liquidated)
                }
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.liquidateCard}>
                    <Text style={styles.productName}>
                      {item.productName || "— Multiple Products —"}
                    </Text>
                    <Text style={styles.liquidationText}>
                      💵 Amount: ₱
                      {(item.amount || item.totalPrice || 0).toFixed(2)}
                    </Text>
                    <Text style={styles.liquidationText}>
                      Status: {item.liquidated ? "✅ Liquidated" : "⏳ Pending"}
                    </Text>
                    {item.status && (
                      <Text style={styles.liquidationText}>
                        Approval:{" "}
                        {item.status === "approved"
                          ? "✔️ Approved"
                          : item.status}
                      </Text>
                    )}
                    {item.liquidatedAt && (
                      <Text style={styles.liquidationText}>
                        Date:{" "}
                        {item.liquidatedAt?.toDate
                          ? item.liquidatedAt.toDate().toLocaleDateString()
                          : ""}
                      </Text>
                    )}
                    {item.orderId && (
                      <Text style={styles.liquidationText}>
                        Order ID: {item.orderId}
                      </Text>
                    )}
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyMsg}>
                    {liquidationStats.activeView === "liquidated"
                      ? "No liquidated payments yet."
                      : "No pending liquidations yet."}
                  </Text>
                }
              />

              {/* Close Button */}
              <TouchableOpacity
                style={[styles.modalButton, { marginTop: 16 }]}
                onPress={() => setLiquidationModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

export default SellerPart;

// -------------------------------
// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8E1" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#3E2723",
  },
  desc: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
    color: "#5D4037",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#6B4F3B",
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    color: "#3E2723",
  },
  button: {
    backgroundColor: "#6B4F3B",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  buttonText: { color: "#FFF8E1", fontWeight: "600" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#6B4F3B",
  },
  headerIcon: { fontSize: 24, color: "#FFF8E1" },
  logoImage: { width: 40, height: 40, resizeMode: "contain" },
  drawer: {
    width: width * 0.7,
    backgroundColor: "#FFF8E1",
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    paddingTop: 50,
    paddingHorizontal: 12,
    zIndex: 5,
  },
  drawerItem: { paddingVertical: 12 },
  drawerText: { fontSize: 18, color: "#3E2723" },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 4,
  },
  tabContainer: {
    flexDirection: "row",
    margin: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#D7CCC8",
    alignItems: "center",
  },
  tabActive: { backgroundColor: "#6B4F3B" },
  tabText: { color: "#3E2723", fontWeight: "500" },
  tabTextActive: { color: "#FFF8E1" },
  orderCard: {
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
  },
  productName: { fontSize: 18, fontWeight: "600", color: "#3E2723" },
  detailText: { fontSize: 14, color: "#5D4037" },
  statusText: { marginTop: 4, fontWeight: "600", color: "#BF360C" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  buttonApprove: {
    backgroundColor: "#388E3C",
    padding: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 4,
    alignItems: "center",
  },
  buttonReject: {
    backgroundColor: "#D32F2F",
    padding: 8,
    borderRadius: 6,
    flex: 1,
    marginLeft: 4,
    alignItems: "center",
  },
  emptyText: { fontSize: 16, color: "#3E2723" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF8E1",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 12,
    color: "#3E2723",
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: "#6B4F3B",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    width: "50%",
    alignItems: "center",
  },
  modalButtonText: { color: "#FFF8E1", fontWeight: "600" },
  liquidationContainer: {
    padding: 16,
    backgroundColor: "#FFF3E0",
    marginTop: 10,
    borderRadius: 8,
  },
  liquidationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3E2723",
    marginBottom: 8,
  },
  liquidationText: { color: "#3E2723" },
  liquidationSidebar: {
    marginTop: 24,
    padding: 12,
    backgroundColor: "#FFF3E0",
    borderRadius: 10,
  },
  liqSidebarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3E2723",
    marginBottom: 6,
  },
  liqSidebarItem: {
    fontSize: 14,
    color: "#5D4037",
    marginVertical: 2,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButtonText: {
    fontSize: 22,
    color: "#FFF8E1",
    marginRight: 10,
  },
  toggleButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  toggleBtn: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#EADBC8",
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#3E2E22",
  },
  toggleText: { color: "#3E2E22", fontWeight: "bold", fontSize: 14 },
  toggleTextActive: { color: "#fff" },
  liquidateCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
  },
  emptyMsg: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
  },
  summaryBox: {
    backgroundColor: "#EADBC8",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  summaryText: {
    color: "#3E2723",
    fontWeight: "600",
    marginVertical: 2,
  },
  overviewButton: {
    backgroundColor: "#6B4F3B",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  overviewButtonText: {
    color: "#FFF8E1",
    fontWeight: "700",
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3E2723",
    marginBottom: 10,
  },
});
