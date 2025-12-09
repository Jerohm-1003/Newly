import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { auth, firestore } from "../firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Screen } from "./App";

interface Notification {
  id: string;
  type: "wishlist" | "password_change" | string;
  message: string;
  status: "read" | "unread";
  createdAt: any;
}

interface InboxProps {
  goToScreen: (screen: Screen, params?: any) => void;
  goBack: () => void;
}

const Inbox: React.FC<InboxProps> = ({ goToScreen }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifList: Notification[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Notification, "id">),
        }));

        // Sort by date desc
        notifList.sort((a, b) => {
          const aTime = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : 0;
          const bTime = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : 0;
          return bTime - aTime;
        });

        setNotifications(notifList);
        setLoading(false);
      },
      (err) => {
        console.log("🔥 Snapshot error:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notifId: string) => {
    try {
      const ref = doc(firestore, "notifications", notifId);
      await updateDoc(ref, { status: "read" });
    } catch (err) {
      console.log("Failed to mark read:", err);
    }
  };

  const deleteNotification = async (notifId: string) => {
    try {
      await deleteDoc(doc(firestore, "notifications", notifId));
    } catch (err) {
      console.log("❌ Delete error:", err);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View
      style={[
        styles.notificationCard,
        { backgroundColor: item.status === "unread" ? "#FFF9E6" : "#FFFFFF" },
      ]}
    >
      <TouchableOpacity style={{ flex: 1 }} onPress={() => markAsRead(item.id)}>
        <Text
          style={[
            styles.messageText,
            { fontWeight: item.status === "unread" ? "700" : "400" },
          ]}
        >
          {item.message}
        </Text>

        <Text style={styles.typeText}>
          {item.type === "wishlist"
            ? "Wishlist"
            : item.type === "password_change"
            ? "Account"
            : item.type}
        </Text>

        <Text style={styles.dateText}>
          {item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleString()
            : ""}
        </Text>
      </TouchableOpacity>

      {/* DELETE BUTTON */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteNotification(item.id)}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>X</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2D2416" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => goToScreen("settings")}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inbox</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2D2416"
          style={{ marginTop: 40 }}
        />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  header: {
    height: 80,
    backgroundColor: "#2D2416",
    justifyContent: "flex-end",
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backText: { color: "#FFF", fontSize: 16, marginBottom: 4 },
  headerTitle: { color: "#FFF", fontSize: 22, fontWeight: "700" },

  notificationCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },

  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#B3261E",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  messageText: { fontSize: 16, color: "#1A1A1A" },
  typeText: { fontSize: 12, color: "#8B7355", marginTop: 4 },
  dateText: { fontSize: 12, color: "#8B7355", marginTop: 2 },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#6B6B6B" },
});

export default Inbox;
