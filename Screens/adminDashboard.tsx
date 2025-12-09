import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import {
  collection,
  getDocs,
  updateDoc,
  setDoc,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { auth, firestore } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import CustomAlert from "./CustomAlert";
import type { Screen } from "./App";

export type AdminView =
  | "pendingProducts"
  | "approvedProducts"
  | "rejectedProducts"
  | "allProducts"
  | "users";

interface AdminDashboardScreenProps {
  goToScreen: (target: Screen, params?: any) => void;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  status: string;
  image?: string;
  glbUri?: string;
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  goToScreen,
}) => {
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [approvedProducts, setApprovedProducts] = useState<Product[]>([]);
  const [rejectedProducts, setRejectedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<AdminView>("pendingProducts");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarAnim] = useState(new Animated.Value(1));

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "warning" | "info",
    onConfirm: () => {},
    showCancel: false,
    onCancel: () => {},
  });

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    onConfirm?: () => void,
    showCancel: boolean = false,
    onCancel?: () => void
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm: () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        onConfirm?.();
      },
      showCancel,
      onCancel: () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        onCancel?.();
      },
    });
  };

  const fetchAllCollections = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(firestore, "users"));
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const productsSnap = await getDocs(collection(firestore, "products"));
      const productsData = productsSnap.docs.map((d) => ({
        ...(d.data() as Product),
        id: d.id,
      }));
      setAllProducts(productsData);

      setPendingProducts(productsData.filter((p) => p.status === "pending"));
      setApprovedProducts(productsData.filter((p) => p.status === "approved"));
      setRejectedProducts(productsData.filter((p) => p.status === "rejected"));
    } catch (err) {
      console.error("Error fetching collections:", err);
      showAlert("Error", "Failed to fetch data from Firestore.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [sidebarOpen]);

  const checkAdmin = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (!userDoc.exists()) {
        showAlert("Access Denied", "User record not found.", "error");
        setLoading(false);
        return;
      }

      const data = userDoc.data();
      if (data?.role === "admin") {
        setIsAdmin(true);
        await fetchAllCollections();
      } else {
        showAlert("Access Denied", "You are not authorized.", "error");
      }
    } catch (err) {
      console.error(err);
      showAlert("Error", "Failed to verify admin.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    showAlert(
      "Confirm Delete",
      "Are you sure you want to delete this item?",
      "warning",
      async () => {
        try {
          // Delete from Firestore first
          await deleteDoc(doc(firestore, collectionName, id));

          // Update local state directly without fetching all again
          if (collectionName === "users") {
            setUsers((prev) => prev.filter((u) => u.id !== id));
          } else if (collectionName === "products") {
            setAllProducts((prev) => prev.filter((p) => p.id !== id));
            setPendingProducts((prev) => prev.filter((p) => p.id !== id));
            setApprovedProducts((prev) => prev.filter((p) => p.id !== id));
            setRejectedProducts((prev) => prev.filter((p) => p.id !== id));
          }

          // Success alert
          showAlert("Success", "Deleted successfully!", "success");
        } catch (err) {
          console.error("Error deleting:", err);
          showAlert(
            "Error",
            "Failed to delete from server. Local changes not applied.",
            "error"
          );
        }
      },
      true
    );
  };

  const handleProductApproval = async (
    product: Product,
    newStatus: "approved" | "rejected"
  ) => {
    showAlert(
      "Confirm Action",
      `Are you sure you want to ${newStatus} this product?`,
      "warning",
      async () => {
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
              BedChair: "bedroom_products",
              officechair: "office_products",
              laptopstand: "office_products",
              officedesk: "office_products",
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

          showAlert("Success", `Product ${newStatus} successfully!`, "success");
          await fetchAllCollections();
        } catch (err) {
          console.error(err);
          showAlert("Error", "Failed to update product.", "error");
        }
      },
      true
    );
  };

  const handleViewChange = (newView: AdminView) => {
    setView(newView);
    setSidebarOpen(false);
  };
  const statusStyles: Record<string, any> = {
    pending: styles.status_pending,
    approved: styles.status_approved,
    rejected: styles.status_rejected,
  };
  const renderProducts = (list: Product[], showApproval: boolean) =>
    list.map((p) => (
      <View key={p.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{p.name}</Text>

          <View style={[styles.statusBadge, statusStyles[p.status]]}>
            <Text style={styles.statusText}>{p.status}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category:</Text>
            <Text style={styles.infoValue}>{p.category}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price:</Text>
            <Text style={styles.priceValue}>₱{p.price.toLocaleString()}</Text>
          </View>
        </View>
        {showApproval && (
          <View style={styles.approvalButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleProductApproval(p, "approved")}
            >
              <Text style={styles.actionButtonText}>✓ Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleProductApproval(p, "rejected")}
            >
              <Text style={styles.actionButtonText}>✕ Reject</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete("products", p.id)}
        >
          <Text style={styles.actionButtonText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    ));

  const renderUsers = () =>
    users.map((u) => (
      <View key={u.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {u.username || u.name || "No Name"}
          </Text>
          <View style={[styles.statusBadge, styles.roleBadge]}>
            <Text style={styles.statusText}>{u.role || "User"}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{u.email || "N/A"}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete("users", u.id)}
        >
          <Text style={styles.actionButtonText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    ));

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );

  if (!isAdmin)
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>⛔ Not Authorized</Text>
      </View>
    );

  let content: JSX.Element[] = [];
  let viewTitle = "";

  switch (view) {
    case "pendingProducts":
      content = renderProducts(pendingProducts, true);
      viewTitle = "Pending Products";
      break;
    case "approvedProducts":
      content = renderProducts(approvedProducts, false);
      viewTitle = "Approved Products";
      break;
    case "rejectedProducts":
      content = renderProducts(rejectedProducts, false);
      viewTitle = "Rejected Products";
      break;
    case "allProducts":
      content = renderProducts(allProducts, false);
      viewTitle = "All Products";
      break;
    case "users":
      content = renderUsers();
      viewTitle = "Users";
      break;
  }

  const tabs = [
    { key: "users", label: "Users", icon: "👥", count: users.length },
    {
      key: "allProducts",
      label: "All Products",
      icon: "📦",
      count: allProducts.length,
    },
    {
      key: "pendingProducts",
      label: "Pending",
      icon: "⏳",
      count: pendingProducts.length,
    },
    {
      key: "approvedProducts",
      label: "Approved",
      icon: "✅",
      count: approvedProducts.length,
    },
    {
      key: "rejectedProducts",
      label: "Rejected",
      icon: "❌",
      count: rejectedProducts.length,
    },
  ];

  const sidebarWidth = sidebarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  return (
    <View style={styles.container}>
      <CustomAlert {...alertConfig} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => setSidebarOpen((prev) => !prev)}
            style={styles.menuButton}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            showAlert(
              "Logout",
              "Are you sure you want to log out?",
              "warning",
              async () => {
                try {
                  await signOut(auth);
                  showAlert(
                    "Success",
                    "You have been logged out.",
                    "success",
                    () => {
                      goToScreen("lreg");
                    }
                  );
                } catch (err) {
                  console.error(err);
                  showAlert("Error", "Failed to log out.", "error");
                }
              },
              true
            );
          }}
        >
          <Text style={styles.logoutButtonText}>⎋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dashboardContainer}>
        <Animated.View style={[styles.sidebar, { width: sidebarWidth }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarHeaderText}>Shopfur</Text>
            </View>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleViewChange(tab.key as AdminView)}
                style={[
                  styles.sidebarItem,
                  view === tab.key && styles.activeSidebarItem,
                ]}
              >
                <View style={styles.sidebarItemContent}>
                  <View style={styles.sidebarItemLeft}>
                    <Text style={styles.sidebarIcon}>{tab.icon}</Text>
                    <Text
                      style={[
                        styles.sidebarItemText,
                        view === tab.key && styles.activeSidebarItemText,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </View>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{tab.count}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <View style={styles.mainContent}>
          <View style={styles.contentHeader}>
            <Text style={styles.contentTitle}>{viewTitle}</Text>
            <Text style={styles.contentSubtitle}>
              {content.length} {content.length === 1 ? "item" : "items"}
            </Text>
          </View>
          <ScrollView
            style={styles.contentScroll}
            showsVerticalScrollIndicator={false}
          >
            {content.length > 0 ? (
              content
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>📭</Text>
                <Text style={styles.emptyStateTitle}>No items found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  There are no items to display in this category.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  menuIcon: {
    fontSize: 24,
    color: "#374151",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },

  dashboardContainer: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    overflow: "hidden",
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sidebarHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sidebarItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
  },
  activeSidebarItem: {
    backgroundColor: "#EEF2FF",
  },
  sidebarItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sidebarItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sidebarIcon: {
    fontSize: 18,
  },
  sidebarItemText: {
    color: "#4B5563",
    fontSize: 15,
    fontWeight: "500",
  },
  activeSidebarItemText: {
    fontWeight: "700",
    color: "#6366F1",
  },
  countBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 28,
    alignItems: "center",
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  mainContent: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  contentHeader: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  contentTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  contentSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  contentScroll: {
    flex: 1,
    padding: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  status_pending: {
    backgroundColor: "#FEF3C7",
  },
  status_approved: {
    backgroundColor: "#D1FAE5",
  },
  status_rejected: {
    backgroundColor: "#FEE2E2",
  },
  roleBadge: {
    backgroundColor: "#E0E7FF",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textTransform: "capitalize",
  },
  cardContent: {
    gap: 10,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    width: 80,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },
  approvalButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  approveButton: {
    backgroundColor: "#10B981",
  },
  rejectButton: {
    backgroundColor: "#F59E0B",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    marginTop: 0,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 20,
    fontWeight: "700",
  },
});

export default AdminDashboardScreen;
