import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { firestore } from "../firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

interface Address {
  fullName: string;
  street: string;
  barangay: string;
  province: string;
  zipCode: string;
}

interface CartItem {
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  totalPrice: number;
  address: Address;
  cartItems?: CartItem[];
  productName?: string; // fallback if cartItems is missing
  status: string;
  buyerReceived?: boolean;
  createdAt?: any;
}

interface Payment {
  method: string;
  referenceId: string;
  orderId: string;
}

interface OrderHistoryProps {
  userId: string;
  goBack: () => void;
}

const OrderHistoryScreen: React.FC<OrderHistoryProps> = ({
  userId,
  goBack,
}) => {
  const [orders, setOrders] = useState<(Order & Partial<Payment>)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const markOrderReceived = async (orderId: string) => {
    try {
      await updateDoc(doc(firestore, "orders", orderId), {
        buyerReceived: true,
      });
      Alert.alert("Success", "Order marked as received!");
      fetchOrders(); // refresh after marking
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not mark order as received");
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersQuery = query(
        collection(firestore, "orders"),
        where("userId", "==", userId)
      );
      const orderSnap = await getDocs(ordersQuery);

      const ordersData = await Promise.all(
        orderSnap.docs.map(async (orderDoc) => {
          const orderData = orderDoc.data() as Order;

          // Fetch payment for this order
          const paymentsQuery = query(
            collection(firestore, "payments"),
            where("orderId", "==", orderDoc.id)
          );
          const paymentSnap = await getDocs(paymentsQuery);
          const paymentData = paymentSnap.docs[0]?.data() as
            | Payment
            | undefined;

          return {
            ...orderData, // spread first
            method: paymentData?.method || "N/A",
            referenceId: paymentData?.referenceId || "N/A",
            id: orderDoc.id, // overwrite or ensure correct id
          };
        })
      );

      setOrders(ordersData);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3E2E22" />
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Error loading orders.</Text>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );

  if (orders.length === 0)
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No orders found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Order History</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const productNames = item.cartItems
            ? item.cartItems.map((p) => `${p.name} x${p.quantity}`).join(", ")
            : item.productName || "N/A";

          const fullAddress = item.address
            ? `${item.address.fullName}, ${item.address.street}, ${item.address.barangay}, ${item.address.province}, ${item.address.zipCode}`
            : "N/A";

          return (
            <View style={styles.orderCard}>
              <Text style={styles.orderText}>
                Date:{" "}
                {item.createdAt?.toDate
                  ? item.createdAt.toDate().toLocaleString()
                  : "Processing..."}
              </Text>
              <Text style={styles.orderText}>
                Reference: {item.referenceId}
              </Text>
              <Text style={styles.orderText}>Amount: ₱{item.totalPrice}</Text>
              <Text
                style={[
                  styles.orderText,
                  item.status === "approved"
                    ? { color: "green" }
                    : item.status === "declined"
                    ? { color: "red" }
                    : { color: "orange" },
                ]}
              >
                Status: {item.status}
              </Text>
              <Text style={styles.orderText}>Method: {item.method}</Text>
              <Text style={styles.orderText}>Address: {fullAddress}</Text>
              <Text style={styles.orderText}>Items: {productNames}</Text>

              {!item.buyerReceived && item.status === "approved" && (
                <TouchableOpacity
                  style={{
                    marginTop: 8,
                    backgroundColor: "#388E3C",
                    padding: 8,
                    borderRadius: 6,
                  }}
                  onPress={() => markOrderReceived(item.id)}
                >
                  <Text style={{ color: "#FFF" }}>Mark as Received ✅</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D8C5B4", padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3E2E22",
    marginBottom: 10,
  },
  backButton: { marginBottom: 10 },
  backText: { color: "#3E2E22", fontWeight: "bold" },
  orderCard: {
    backgroundColor: "#E5D1BC",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  orderText: { color: "#3E2E22" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#3E2E22", fontSize: 16 },
});

export default OrderHistoryScreen;
