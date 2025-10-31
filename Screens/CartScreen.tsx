// CartScreen.tsx — Clean UI with single Pay Selected button
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { firestore } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  doc,
} from "firebase/firestore";
import { CartItem } from "./App";

interface CartScreenProps {
  onBack: () => void;
  total: number;
  cartItems: CartItem[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  userId: string;
}

const CartScreen: React.FC<CartScreenProps> = ({
  onBack,
  total,
  cartItems,
  onIncrement,
  onDecrement,
  onRemove,
  userId,
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentReferenceId, setCurrentReferenceId] = useState<string | null>(
    null
  );
  const [currentTotal, setCurrentTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [shippingModalVisible, setShippingModalVisible] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [fullName, setFullName] = useState("");
  const [province, setProvince] = useState("");
  const [barangay, setBarangay] = useState("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");

  // 🔹 Real-time listener for payment status
  useEffect(() => {
    if (!userId) return;
    const paymentsRef = collection(firestore, "payments");
    const q = query(paymentsRef, where("userId", "==", userId));

    const unsub = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const data = change.doc.data();
        if (!data) continue;
        if (
          (change.type === "added" || change.type === "modified") &&
          (data.status === "approved" || data.status === "declined")
        ) {
          if (data.status === "done") continue;

          const prodNames =
            data.isBulk && Array.isArray(data.products)
              ? data.products.map((p: any) => p.name).join(", ")
              : data.productName || "item";

          if (data.status === "approved") {
            Alert.alert(
              "✅ Payment Approved",
              `Payment for "${prodNames}" approved.`
            );
            if (data.isBulk && Array.isArray(data.products)) {
              data.products.forEach((p: any) => onRemove(p.id));
            } else if (data.productId) {
              onRemove(data.productId);
            }
          }

          if (data.status === "declined") {
            Alert.alert(
              "❌ Payment Declined",
              `Payment for "${prodNames}" declined.`
            );
          }

          // mark as done
          try {
            const ref = doc(firestore, "payments", change.doc.id);
            await updateDoc(ref, {
              status: "done",
              updatedAt: serverTimestamp(),
            });
          } catch (err) {
            console.warn("Failed to mark done:", err);
          }

          setModalVisible(false);
        }
      }
    });

    return () => unsub();
  }, [userId]);

  // 🔹 Toggle selection
  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  // 🔹 Handle Pay Selected (solo or bulk)
  const handlePaySelected = async () => {
    if (!userId || selectedItems.length === 0) {
      Alert.alert("Select Items", "Please select at least one item to pay.");
      return;
    }

    setLoading(true);
    const paymentsRef = collection(firestore, "payments");

    const selectedProducts = cartItems.filter((c) =>
      selectedItems.includes(c.id)
    );
    const totalPrice = selectedProducts.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0
    );

    try {
      let refId: string;
      if (selectedProducts.length === 1) {
        // Solo payment
        const item = selectedProducts[0];
        const q = query(
          paymentsRef,
          where("userId", "==", userId),
          where("productId", "==", item.id),
          where("status", "==", "pending"),
          where("isBulk", "==", false)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docRef = snap.docs[0].ref;
          const data = snap.docs[0].data();
          refId = data.referenceId;
          await updateDoc(docRef, {
            quantity: item.quantity,
            price: item.price * item.quantity,
            updatedAt: serverTimestamp(),
          });
        } else {
          refId = Math.random().toString(36).substring(2, 10);
          await addDoc(paymentsRef, {
            userId,
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            price: item.price * item.quantity,
            method: "QRPh",
            referenceId: refId,
            status: "pending",
            isBulk: false,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        // Bulk payment
        const bulkQuery = query(
          paymentsRef,
          where("userId", "==", userId),
          where("status", "==", "pending"),
          where("isBulk", "==", true)
        );
        const snap = await getDocs(bulkQuery);

        if (!snap.empty) {
          const docRef = snap.docs[0].ref;
          const data = snap.docs[0].data();
          refId = data.referenceId;
          const existingProducts: any[] = Array.isArray(data.products)
            ? data.products
            : [];
          const mergedProducts = [...existingProducts];

          selectedProducts.forEach((p) => {
            const idx = mergedProducts.findIndex((e) => e.id === p.id);
            if (idx > -1) {
              mergedProducts[idx].quantity = p.quantity;
              mergedProducts[idx].price = p.price;
            } else {
              mergedProducts.push({
                id: p.id,
                name: p.name,
                quantity: p.quantity,
                price: p.price,
              });
            }
          });

          await updateDoc(docRef, {
            products: mergedProducts,
            totalPrice: mergedProducts.reduce(
              (sum, p) => sum + p.price * p.quantity,
              0
            ),
            updatedAt: serverTimestamp(),
          });
        } else {
          refId = Math.random().toString(36).substring(2, 10);
          await addDoc(paymentsRef, {
            userId,
            products: selectedProducts.map((p) => ({
              id: p.id,
              name: p.name,
              quantity: p.quantity,
              price: p.price,
            })),
            totalPrice,
            method: "QRPh",
            referenceId: refId,
            status: "pending",
            isBulk: true,
            createdAt: serverTimestamp(),
          });
        }
      }

      setCurrentReferenceId(refId);
      setCurrentTotal(totalPrice);
      setModalVisible(true);
    } catch (e) {
      console.error("Error in handlePaySelected:", e);
      Alert.alert("Error", "Failed to create or reuse payment.");
    } finally {
      setLoading(false);
    }
  };
  const fullShippingAddress = `${fullName}, ${street}, ${barangay}, ${province}, ${zipCode}`;

  const handlePaySelectedWithAddress = async () => {
    setLoading(true);
    const ordersRef = collection(firestore, "orders");

    try {
      const selectedProducts = cartItems.filter((c) =>
        selectedItems.includes(c.id)
      );
      const totalPrice = selectedProducts.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
      );
      const refId = Math.random().toString(36).substring(2, 10);

      if (selectedProducts.length === 1) {
        const item = selectedProducts[0];
        await addDoc(ordersRef, {
          userId,
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price * item.quantity,
          shippingAddress: fullShippingAddress, // now has all details
          status: "pending",
          referenceId: refId,
          createdAt: serverTimestamp(),
        });
      } else {
        await addDoc(ordersRef, {
          userId,
          products: selectedProducts.map((p) => ({
            id: p.id,
            name: p.name,
            quantity: p.quantity,
            price: p.price,
          })),
          totalPrice,
          shippingAddress: fullShippingAddress, // include full address
          status: "pending",
          referenceId: refId,
          createdAt: serverTimestamp(),
        });
      }

      setCurrentReferenceId(refId);
      setCurrentTotal(totalPrice);

      // Then proceed with your existing handlePaySelected logic to add payments
      await handlePaySelected();
    } catch (e) {
      console.error("Error creating order:", e);
      Alert.alert("Error", "Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

  const confirmRemove = (id: string, name: string) => {
    Alert.alert("Remove Item", `Remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => onRemove(id) },
    ]);
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const isSelected = selectedItems.includes(item.id);
    return (
      <View style={styles.cartItem}>
        <TouchableOpacity
          style={[styles.selectBox, isSelected && styles.selectedBox]}
          onPress={() => toggleSelectItem(item.id)}
        >
          {isSelected && <Text style={styles.checkMark}>✔</Text>}
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.itemText}>
            {item.name} x{item.quantity}
          </Text>
          <Text style={styles.itemText}>₱{item.price * item.quantity}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDecrement(item.id)}
          >
            <Text style={styles.buttonText}>−</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onIncrement(item.id)}
          >
            <Text style={styles.buttonText}>＋</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => confirmRemove(item.id, item.name)}
          >
            <Text style={styles.buttonText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.buttonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Your Cart</Text>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      <TouchableOpacity
        style={styles.bulkPayButton}
        onPress={() => {
          if (selectedItems.length === 0) {
            Alert.alert(
              "Select Items",
              "Please select at least one item to pay."
            );
            return;
          }
          setShippingModalVisible(true);
        }}
      >
        <Text style={styles.payText}>
          Pay Selected ({selectedItems.length})
        </Text>
      </TouchableOpacity>

      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total: ₱{total}</Text>
      </View>

      {/* QR Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.title}>Scan to Pay</Text>
            <View style={{ alignItems: "center", marginVertical: 10 }}>
              <Text style={styles.itemText}>Castro-G19-Thesis</Text>
              <Image
                source={require("../assets/code_hLnVjWzpqhh7xsKZLFg3EZcV.jpg")}
                style={{ width: 250, height: 350, resizeMode: "contain" }}
              />
              <Text style={styles.itemText}>Basta kaya i-scan, pwede yan!</Text>

              {currentReferenceId && (
                <Text style={{ fontSize: 12, color: "#555", marginTop: 5 }}>
                  Reference ID: {currentReferenceId}
                </Text>
              )}

              <Text style={{ fontSize: 14, color: "#3E2E22", marginTop: 5 }}>
                Total Payment: ₱{currentTotal}
              </Text>

              <Text
                style={{
                  fontSize: 12,
                  color: "#B00020",
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                ⚠ Please notify admin after paying. Admin will confirm manually.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { marginTop: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Shipping Address Modal */}
      {/* Shipping Address Modal */}
      <Modal
        visible={shippingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setShippingModalVisible(false)}
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
              onPress={() => {
                if (
                  !fullName ||
                  !province ||
                  !barangay ||
                  !street ||
                  !zipCode
                ) {
                  Alert.alert("Error", "Please fill all address fields.");
                  return;
                }
                setShippingModalVisible(false);
                handlePaySelectedWithAddress();
              }}
            >
              <Text style={styles.modalButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3E2E22" />
        </View>
      )}
    </View>
  );
};

export default CartScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D8C5B4", padding: 20 },
  backBtn: { marginBottom: 10 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3E2E22",
    marginBottom: 10,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5D1BC",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
  },
  itemText: { fontSize: 16, color: "#3E2E22" },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionButton: {
    backgroundColor: "#C7AE93",
    padding: 8,
    borderRadius: 10,
    marginLeft: 5,
  },
  buttonText: { fontWeight: "600", color: "#3E2E22" },
  payText: { color: "#fff", fontWeight: "600" },
  totalContainer: { marginTop: 20, alignItems: "flex-end" },
  totalText: { fontSize: 18, fontWeight: "bold", color: "#3E2E22" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#3E2E22",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedBox: { backgroundColor: "#3E2E22" },
  checkMark: { color: "#fff", fontWeight: "bold" },
  bulkPayButton: {
    backgroundColor: "#3E2E22",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
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
});
