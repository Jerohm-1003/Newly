import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { auth, firestore } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import type { Screen } from "./App";

interface AdminDashboardScreenProps {
  goToScreen: (target: Screen, params?: any) => void;
}

// --- Payment interface ---
interface Payment {
  id: string;
  userId: string;
  productId?: string;
  products?: { id: string; name: string; quantity: number; price: number }[];
  productName?: string;
  quantity?: number;
  price?: number;
  method?: string;
  referenceId?: string;
  status: string;
  isBulk?: boolean;
  createdAt?: any;
  updatedAt?: any;
  amount?: number; // ✅ Add this
  totalPrice?: number; // ✅ Add this
}

// --- Product interface ---
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  glbUri?: string;
  status: string;
  uploadedBy?: string;
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  goToScreen,
}) => {
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [approvedProducts, setApprovedProducts] = useState<Product[]>([]);
  const [rejectedProducts, setRejectedProducts] = useState<Product[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<
    | "pendingProducts"
    | "approvedProducts"
    | "rejectedProducts"
    | "pendingPayments"
    | "approvedPayments"
    | "declinedPayments"
    | "buyerReceived"
  >("pendingProducts");
  const [receivedOrders, setReceivedOrders] = useState<any[]>([]);

  // --- Check admin role ---
  // --- Check admin role ---
  const checkAdmin = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (!userDoc.exists()) {
        Alert.alert("Access Denied", "User record not found.");
        setLoading(false);
        return;
      }

      const data = userDoc.data();
      if (data?.role === "admin") {
        setIsAdmin(true);
        await fetchAllProducts();
      } else {
        Alert.alert("Access Denied", "You are not authorized.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to verify admin.");
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch products ---
  const fetchProductsByStatus = async (status: string) => {
    const q = query(
      collection(firestore, "products"),
      where("status", "==", status)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      ...(d.data() as Product), // spread first
      id: d.id, // overwrite/add Firestore doc ID
    }));
  };

  const fetchAllProducts = async () => {
    try {
      const pending = await fetchProductsByStatus("pending");
      const approved = await fetchProductsByStatus("approved");
      const rejected = await fetchProductsByStatus("rejected");

      setPendingProducts(pending);
      setApprovedProducts(approved);
      setRejectedProducts(rejected);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch products.");
    }
  };

  // --- Fetch payments with live updates ---
  const fetchPayments = () => {
    const paymentsRef = collection(firestore, "payments");
    const q = query(
      paymentsRef,
      where("status", "in", ["pending", "approved", "declined"])
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data: Payment[] = snapshot.docs.map((d) => ({
        ...(d.data() as Payment),
        id: d.id, // always ensure Firestore doc ID is used
      }));
      setPayments(
        data.sort((a, b) => {
          const aTime = a.updatedAt?.toDate?.() ?? a.createdAt?.toDate?.() ?? 0;
          const bTime = b.updatedAt?.toDate?.() ?? b.createdAt?.toDate?.() ?? 0;
          return bTime - aTime;
        })
      );
    });
    return unsub;
  };

  // --- Listen for buyer-received orders ---
  const listenToBuyerReceived = () => {
    const ordersRef = collection(firestore, "orders");
    const q = query(ordersRef, where("buyerReceived", "==", true));

    const unsub = onSnapshot(q, async (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      await enrichReceivedOrders(data);
    });

    return unsub;
  };

  // --- Fetch buyer details for received orders ---
  const enrichReceivedOrders = async (orders: any[]) => {
    const enriched = await Promise.all(
      orders.map(async (order) => {
        let buyerInfo = { username: "Unknown", contactNo: "N/A" };
        let sellerInfo = { username: "Unknown" };

        try {
          // Fetch buyer info
          if (order.userId) {
            const buyerSnap = await getDoc(
              doc(firestore, "users", order.userId)
            );
            if (buyerSnap.exists()) {
              buyerInfo = {
                username: buyerSnap.data().username || "Unknown",
                contactNo: buyerSnap.data().contactNumber || "N/A",
              };
            }
          }

          // Fetch seller info
          if (order.sellerId) {
            const sellerSnap = await getDoc(
              doc(firestore, "users", order.sellerId)
            );
            if (sellerSnap.exists()) {
              sellerInfo = {
                username: sellerSnap.data().username || "Unknown Seller",
              };
            }
          }
        } catch (err) {
          console.warn("Error fetching buyer/seller:", err);
        }

        return {
          ...order,
          buyerInfo,
          sellerInfo,
        };
      })
    );

    setReceivedOrders(enriched);
  };

  useEffect(() => {
    checkAdmin();
    fetchAllProducts();
    const unsubPayments = fetchPayments();
    const unsubReceived = listenToBuyerReceived(); // ✅ new line
    return () => {
      unsubPayments();
      unsubReceived();
    };
  }, []);

  // --- Approve/reject product ---
  // --- Approve/reject product ---
  const handleProductApproval = async (
    product: Product,
    newStatus: "approved" | "rejected"
  ) => {
    try {
      const productRef = doc(firestore, "products", product.id);
      await updateDoc(productRef, { status: newStatus });

      if (newStatus === "approved") {
        const collectionMap: Record<string, string> = {
          Sofa: "livingroom_products",
          Chair: "livingroom_products",
          TVStand: "livingroom_products",
          Bed: "bedroom_products",
          Wardrobe: "bedroom_products",
          Desks: "bedroom_products",
          DiningChair: "dining_products",
          Cabinet: "dining_products",
          DiningTable: "dining_products",
        };
        const targetParent = collectionMap[product.category];
        if (targetParent) {
          const targetRef = doc(firestore, targetParent, product.id);
          await setDoc(targetRef, {
            name: product.name,
            price: product.price,
            description: product.description || "",
            category: product.category,
            image: product.image || "",
            glbUri: product.glbUri || "",
            status: "approved",
          });
        }
      }

      if (product.uploadedBy) {
        await addDoc(collection(firestore, "notifications"), {
          userId: product.uploadedBy,
          message:
            newStatus === "approved"
              ? `✅ Your product "${product.name}" has been approved!`
              : `❌ Your product "${product.name}" has been rejected.`,
          status: "unread",
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert("Success", `Product ${newStatus}`);
      await fetchAllProducts();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update product.");
    }
  };

  // --- Approve/reject payment ---
  // --- Approve/reject payment ---
  const handlePaymentApproval = async (
    payment: Payment,
    newStatus: "approved" | "declined"
  ) => {
    try {
      // ✅ Compute total amount properly
      const amount = payment.isBulk
        ? payment.products?.reduce((sum, x) => sum + x.price * x.quantity, 0) ||
          0
        : (payment.price || 0) * (payment.quantity || 0);

      const paymentRef = doc(firestore, "payments", payment.id);
      await updateDoc(paymentRef, {
        status: newStatus,
        amount, // 🔥 Store computed amount here
        updatedAt: serverTimestamp(),
      });

      // ✅ Notify user
      await addDoc(collection(firestore, "notifications"), {
        userId: payment.userId,
        message:
          newStatus === "approved"
            ? `✅ Your payment for ${
                payment.isBulk ? "bulk items" : `"${payment.productName}"`
              } (₱${amount}) has been approved.`
            : `❌ Your payment for ${
                payment.isBulk ? "bulk items" : `"${payment.productName}"`
              } has been declined.`,
        status: "unread",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", `Payment ${newStatus}`);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update payment.");
    }
  };

  // --- Render products ---
  const renderProducts = (list: Product[], isPending: boolean) =>
    list.map((p) => (
      <View key={p.id} style={styles.card}>
        <Text style={styles.name}>{p.name}</Text>
        <Text style={styles.description}>{p.description}</Text>
        <Text style={styles.price}>₱{p.price}</Text>
        <Text style={styles.category}>Category: {p.category}</Text>
        <Text style={styles.status}>Status: {p.status}</Text>
        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => handleProductApproval(p, "approved")}
              style={[styles.button, { backgroundColor: "#6AA84F" }]}
            >
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleProductApproval(p, "rejected")}
              style={[styles.button, { backgroundColor: "#CC0000" }]}
            >
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    ));

  // --- Render payments ---
  // --- Render payments ---
  const renderPayments = (list: Payment[], isPending: boolean) =>
    list.map((p) => {
      let totalAmount = 0;

      // ✅ Prefer Firestore’s stored amount or totalPrice first
      if (p.amount && Number(p.amount) > 0) {
        totalAmount = Number(p.amount);
      } else if (p.totalPrice && Number(p.totalPrice) > 0) {
        totalAmount = Number(p.totalPrice);
      }
      // ✅ If not available, compute manually
      else if (p.isBulk && Array.isArray(p.products) && p.products.length > 0) {
        totalAmount = p.products.reduce(
          (sum, x) => sum + (Number(x.price) || 0) * (Number(x.quantity) || 1),
          0
        );
      } else {
        totalAmount = (Number(p.price) || 0) * (Number(p.quantity) || 0);
      }

      return (
        <View key={p.id} style={styles.card}>
          <Text style={styles.name}>
            {p.isBulk ? "Bulk Payment" : p.productName}
          </Text>
          {p.isBulk && (
            <Text style={styles.description}>
              Products: {p.products?.map((x) => x.name).join(", ")}
            </Text>
          )}
          <Text style={styles.price}>₱{totalAmount.toLocaleString()}</Text>
          <Text style={styles.status}>Status: {p.status}</Text>

          {/* If pending → Approve/Decline buttons */}
          {isPending && (
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => handlePaymentApproval(p, "approved")}
                style={[styles.button, { backgroundColor: "#6AA84F" }]}
              >
                <Text style={styles.buttonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handlePaymentApproval(p, "declined")}
                style={[styles.button, { backgroundColor: "#CC0000" }]}
              >
                <Text style={styles.buttonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ✅ Liquidate button for approved payments */}
          {!isPending && p.status === "approved" && (
            <TouchableOpacity
              style={styles.liquidateBtn}
              onPress={async () => {
                try {
                  const paymentRef = doc(firestore, "payments", p.id);
                  const snap = await getDoc(paymentRef);

                  if (!snap.exists()) {
                    Alert.alert("Error", "Payment not found.");
                    return;
                  }

                  const paymentData = snap.data();
                  if (paymentData?.liquidated) {
                    Alert.alert(
                      "Already Done",
                      "This payment is already liquidated."
                    );
                    return;
                  }

                  // ✅ Compute total amount again to ensure alignment
                  const totalAmount =
                    p.amount && Number(p.amount) > 0
                      ? Number(p.amount)
                      : p.totalPrice && Number(p.totalPrice) > 0
                      ? Number(p.totalPrice)
                      : p.isBulk && Array.isArray(p.products)
                      ? p.products.reduce(
                          (sum, x) =>
                            sum +
                            (Number(x.price) || 0) * (Number(x.quantity) || 1),
                          0
                        )
                      : (Number(p.price) || 0) * (Number(p.quantity) || 0);

                  // ✅ Compute commissions
                  const adminRate = 0.1; // 10% commission
                  const adminCommission = totalAmount * adminRate;
                  const sellerEarnings = totalAmount - adminCommission;

                  // ✅ Update payment doc with liquidation info + aligned amount
                  await updateDoc(paymentRef, {
                    liquidated: true,
                    liquidatedAt: serverTimestamp(),
                    amount: totalAmount,
                    adminCommission,
                    sellerEarnings,
                  });

                  // ✅ Record liquidation history
                  await addDoc(collection(firestore, "liquidations"), {
                    paymentId: p.id,
                    sellerId: paymentData?.sellerId || "",
                    amount: totalAmount,
                    adminCommission,
                    sellerEarnings,
                    status: "completed",
                    createdAt: serverTimestamp(),
                  });

                  // ✅ Notify seller
                  if (paymentData?.sellerId) {
                    await addDoc(collection(firestore, "notifications"), {
                      userId: paymentData.sellerId,
                      message: `💸 Your payment for ${
                        p.productName || "items"
                      } has been liquidated. Earnings: ₱${sellerEarnings.toFixed(
                        2
                      )}`,
                      status: "unread",
                      createdAt: serverTimestamp(),
                    });
                  }

                  Alert.alert("Success", "Payment liquidated successfully!");
                } catch (err) {
                  console.error(err);
                  Alert.alert("Error", "Failed to liquidate payment.");
                }
              }}
            >
              <Text style={styles.liquidateBtnText}>💸 Liquidate</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    });

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3E2E22" />
      </View>
    );
  if (!isAdmin)
    return (
      <View style={styles.center}>
        <Text>You are not authorized to access this screen.</Text>
      </View>
    );

  // Filter view
  let content: JSX.Element[] = [];
  switch (view) {
    case "pendingProducts":
      content = renderProducts(pendingProducts, true);
      break;
    case "approvedProducts":
      content = renderProducts(approvedProducts, false);
      break;
    case "rejectedProducts":
      content = renderProducts(rejectedProducts, false);
      break;
    case "pendingPayments":
      content = renderPayments(
        payments.filter((p) => p.status === "pending"),
        true
      );
      break;
    case "approvedPayments":
      content = renderPayments(
        payments.filter((p) => p.status === "approved"),
        false
      );
      break;
    case "declinedPayments":
      content = renderPayments(
        payments.filter((p) => p.status === "declined"),
        false
      );
      break;

    case "buyerReceived":
      content = receivedOrders.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.name}>Buyer: {r.buyerInfo?.username}</Text>
          <Text style={styles.description}>
            Contact: {r.buyerInfo?.contactNo}
          </Text>
          <Text style={styles.description}>
            Seller: {r.sellerInfo?.username}
          </Text>
          <Text style={styles.price}>Amount: ₱{r.amount || "N/A"}</Text>
          <Text style={styles.status}>
            Status: {r.status || "Approved"} ✅ Received
          </Text>
          <Text style={styles.description}>
            Reference: {r.referenceId || "N/A"}
          </Text>
          <Text style={styles.description}>
            Items:{" "}
            {r.cartItems
              ? r.cartItems
                  .map((x: any) => `${x.name} x${x.quantity}`)
                  .join(", ")
              : r.productName || "N/A"}
          </Text>
          <Text style={styles.description}>
            Received Date:{" "}
            {r.updatedAt?.toDate
              ? r.updatedAt.toDate().toLocaleString()
              : r.createdAt?.toDate
              ? r.createdAt.toDate().toLocaleString()
              : "N/A"}
          </Text>
        </View>
      ));
      break;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setView("pendingProducts")}>
          <Text
            style={[styles.tab, view === "pendingProducts" && styles.activeTab]}
          >
            Pending Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("approvedProducts")}>
          <Text
            style={[
              styles.tab,
              view === "approvedProducts" && styles.activeTab,
            ]}
          >
            Approved Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("rejectedProducts")}>
          <Text
            style={[
              styles.tab,
              view === "rejectedProducts" && styles.activeTab,
            ]}
          >
            Rejected Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("pendingPayments")}>
          <Text
            style={[styles.tab, view === "pendingPayments" && styles.activeTab]}
          >
            Pending Payments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("approvedPayments")}>
          <Text
            style={[
              styles.tab,
              view === "approvedPayments" && styles.activeTab,
            ]}
          >
            Approved Payments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("declinedPayments")}>
          <Text
            style={[
              styles.tab,
              view === "declinedPayments" && styles.activeTab,
            ]}
          >
            Declined Payments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("buyerReceived")}>
          <Text
            style={[styles.tab, view === "buyerReceived" && styles.activeTab]}
          >
            Buyer Received
          </Text>
        </TouchableOpacity>
      </View>

      {content.length > 0 ? (
        content
      ) : (
        <Text style={styles.noDataText}>No items in this view.</Text>
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await signOut(auth);
          goToScreen("lreg");
        }}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#F5F0E1" },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    color: "#3E2E22",
  },
  card: {
    backgroundColor: "#FFF8F0",
    padding: 18,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  name: { fontSize: 20, fontWeight: "bold", color: "#3E2E22", marginBottom: 4 },
  description: { fontSize: 14, color: "#6B5B4B", marginBottom: 4 },
  price: { fontSize: 16, color: "#6AA84F", fontWeight: "600", marginBottom: 4 },
  category: { fontSize: 14, color: "#8B6E4F", marginBottom: 2 },
  status: { fontSize: 14, color: "#3E2E22", marginBottom: 8 },
  actions: { flexDirection: "row", marginTop: 10 },
  button: { flex: 1, padding: 10, marginHorizontal: 5, borderRadius: 8 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  logoutButton: {
    backgroundColor: "#3E2E22",
    padding: 14,
    borderRadius: 10,
    marginTop: 30,
    marginBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  tab: {
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    color: "#7D6C5E",
    marginBottom: 6,
  },
  activeTab: {
    fontWeight: "700",
    color: "#3E2E22",
    textDecorationLine: "underline",
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#8B6E4F",
    marginVertical: 20,
  },
  liquidateBtn: {
    marginTop: 10,
    backgroundColor: "#6B4F3B",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  liquidateBtnText: {
    color: "#FFF8E1",
    fontWeight: "700",
  },
});

export default AdminDashboardScreen;
