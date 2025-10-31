import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, firestore } from "../firebase/firebaseConfig";

interface Payment {
  id: string;
  productName?: string;
  products?: { id: string; name: string; quantity: number; price: number }[];
  isBulk?: boolean;
  status: string;
  quantity?: number;
  price?: number;
  createdAt?: any;
  updatedAt?: any;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt?: any;
}

interface Order {
  id: string;
  productName?: string;
  products?: { id: string; name: string; quantity: number }[];
  totalPrice?: number;
  createdAt?: any;
  status?: string;
}

interface InboxProps {
  goBack: () => void;
}

const Inbox: React.FC<InboxProps> = ({ goBack }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // ✅ 1. Done payments
    const paymentsQuery = query(
      collection(firestore, "payments"),
      where("userId", "==", user.uid),
      where("status", "==", "done")
    );

    // ✅ 2. User notifications
    const notifQuery = query(
      collection(firestore, "notifications"),
      where("userId", "==", user.uid)
    );

    // ✅ 3. Orders (new order confirmation)
    const ordersQuery = query(
      collection(firestore, "orders"),
      where("userId", "==", user.uid)
    );

    // Payment listener
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      const payments = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        source: "payment",
      }));
      updateNotifications(payments, "payment");
    });

    // Notifications listener
    const unsubNotifs = onSnapshot(notifQuery, (snapshot) => {
      const notifDocs = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        source: "notification",
      }));
      updateNotifications(notifDocs, "notification");
    });

    // Orders listener
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      const orderDocs = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        source: "order",
      }));
      updateNotifications(orderDocs, "order");
    });

    const updateNotifications = (newItems: any[], sourceType: string) => {
      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.source !== sourceType);
        return mergeAndSort([...filtered, ...newItems]);
      });
      setLoading(false);
    };

    return () => {
      unsubPayments();
      unsubNotifs();
      unsubOrders();
    };
  }, []);

  const mergeAndSort = (items: any[]) => {
    return items.sort((a, b) => {
      const aTime =
        a.updatedAt?.toDate?.() ?? a.createdAt?.toDate?.() ?? new Date(0);
      const bTime =
        b.updatedAt?.toDate?.() ?? b.createdAt?.toDate?.() ?? new Date(0);
      return bTime.getTime() - aTime.getTime();
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3E2E22" />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No notifications yet.</Text>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📩 Inbox</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => {
          // ✅ Payment Notification
          if (item.source === "payment") {
            const productNames = item.isBulk
              ? item.products?.map((p: any) => p.name).join(", ") || "products"
              : item.productName || "a product";
            const totalAmount =
              item.totalPrice ??
              item.amountPaid ??
              (item.isBulk
                ? item.products?.reduce(
                    (sum: number, p: any) =>
                      sum + (p.price || 0) * (p.quantity || 1),
                    0
                  ) || 0
                : (item.price || 0) * (item.quantity || 1));

            return (
              <View style={styles.notificationCard}>
                <Text style={styles.notificationText}>
                  ✅ Your payment for{" "}
                  {item.isBulk ? "these products" : "“" + productNames + "”"}{" "}
                  has been approved.
                </Text>
                {item.isBulk && (
                  <Text style={styles.notificationText} numberOfLines={1}>
                    Products: {productNames}
                  </Text>
                )}
                <Text style={styles.amountText}>
                  Amount Paid: ₱{totalAmount}
                </Text>
                <Text style={styles.dateText}>
                  {item.updatedAt?.toDate
                    ? item.updatedAt.toDate().toLocaleString()
                    : item.createdAt?.toDate
                    ? item.createdAt.toDate().toLocaleString()
                    : "Processing..."}
                </Text>
              </View>
            );
          }

          // 🛒 Order Notification
          if (item.source === "order") {
            const orderProducts = item.products
              ?.map((p: any) => `${p.name} x${p.quantity}`)
              .join(", ");
            return (
              <View style={styles.notificationCard}>
                <Text style={styles.notificationText}>
                  🛒 Order placed successfully!
                </Text>
                {orderProducts && (
                  <Text style={styles.notificationText} numberOfLines={1}>
                    Items: {orderProducts}
                  </Text>
                )}
                <Text style={styles.amountText}>
                  Total: ₱{item.totalPrice || 0}
                </Text>
                <Text style={styles.dateText}>
                  {item.createdAt?.toDate
                    ? item.createdAt.toDate().toLocaleString()
                    : "Just now"}
                </Text>
              </View>
            );
          }

          // 🔔 Regular notification
          return (
            <View style={styles.notificationCard}>
              <Text style={styles.notificationText}>
                🔔 {item.message || "Notification"}
              </Text>
              <Text style={styles.dateText}>
                {item.createdAt?.toDate
                  ? item.createdAt.toDate().toLocaleString()
                  : "Just now"}
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

export default Inbox;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D8C5B4" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#3E2E22", fontSize: 16 },
  backButton: { marginTop: 10 },
  backText: { color: "#3E2E22", fontWeight: "bold" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3dcbe",
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
  },
  backBtn: {
    backgroundColor: "#EADBC8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#3E2E22" },
  notificationCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  notificationText: { fontSize: 15, color: "#3E2E22" },
  amountText: {
    fontSize: 14,
    color: "#3E2E22",
    marginTop: 4,
    fontWeight: "600",
  },
  dateText: { fontSize: 12, color: "#555", marginTop: 6 },
});
