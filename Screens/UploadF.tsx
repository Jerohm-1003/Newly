import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, firestore } from "../firebase/firebaseConfig";
import type { Screen } from "./App";
import CustomAlert from "./CustomAlert";

interface FurnitureData {
  name: string;
  price: string;
  description: string;
  size: string;
  category: string;
  imageUris: string[];
  status: "pending" | "approved";
  uploader: string | null;
  username?: string | null;
  contactNo?: string | null;
  createdAt: any;
  material: string;
  color: string;
}

interface FurnitureUploadScreenProps {
  goBack: () => void;
  goToScreen: (screen: Screen, params?: any) => void;
}

const categories = [
  { key: "Sofa", label: "Sofa" },
  { key: "Chair", label: "Chair" },
  { key: "TVStand", label: "TV Stand" },
  { key: "BedChair", label: "Bed Chair" },
  { key: "Bed", label: "Bed" },
  { key: "Wardrobe", label: "Wardrobe" },
  { key: "officechair", label: "Office Chair" },
  { key: "laptopstand", label: "Laptop Stand" },
  { key: "officedesk", label: "Office Desk" },
];

const Dropdown: React.FC<{
  value: string;
  onSelect: (val: string) => void;
}> = ({ value, onSelect }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity style={styles.input} onPress={() => setVisible(true)}>
        <View style={styles.dropdownContent}>
          <Text style={value ? styles.inputText : styles.placeholderText}>
            {categories.find((c) => c.key === value)?.label ||
              "Select Category"}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item.key);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  <View style={styles.optionIndicator} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const FurnitureUploadScreen: React.FC<FurnitureUploadScreenProps> = ({
  goBack,
  goToScreen,
}) => {
  const [furnitureData, setFurnitureData] = useState<FurnitureData>({
    name: "",
    price: "",
    description: "",
    size: "",
    category: "",
    imageUris: [],
    status: "pending",
    uploader: auth.currentUser?.uid || null,
    username: null,
    contactNo: "",
    createdAt: serverTimestamp(),
    material: "",
    color: "",
  });

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (type: "success" | "error", message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // ✅ Fetch username from users collection
  React.useEffect(() => {
    const fetchSellerInfo = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.role === "seller") {
            setFurnitureData((prev) => ({
              ...prev,
              username: userData.username || "Unknown Seller",
            }));
          } else {
            showAlert("error", "Only sellers can upload furniture.");
          }
        } else {
          showAlert("error", "User data not found.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        showAlert("error", "Failed to fetch seller info.");
      }
    };

    fetchSellerInfo();
  }, []);

  const submitFurniture = async () => {
    const user = auth.currentUser;

    if (!user) {
      showAlert("error", "You must be logged in to submit furniture.");
      return;
    }

    const { name, price, description, category, imageUris, material, color } =
      furnitureData;

    if (
      !name ||
      !price ||
      !description ||
      !category ||
      !material ||
      !color ||
      imageUris.length === 0
    ) {
      showAlert("error", "Please fill in all required fields.");
      return;
    }

    try {
      await addDoc(collection(firestore, "products"), {
        ...furnitureData,
        price: parseFloat(furnitureData.price),
        status: "pending",
        uploader: auth.currentUser?.uid,
        username:
          furnitureData.username || auth.currentUser?.displayName || "Unknown",
        contactNo: furnitureData.contactNo || "Not provided",
        createdAt: serverTimestamp(),
      });

      showAlert("success", "Furniture submitted for review.");

      setFurnitureData({
        name: "",
        price: "",
        description: "",
        size: "",
        category: "",
        imageUris: [],
        status: "pending",
        uploader: auth.currentUser?.uid || null,
        username: auth.currentUser?.displayName || null,
        contactNo: "",
        createdAt: serverTimestamp(),
        material: "",
        color: "",
      });
    } catch (error) {
      showAlert("error", "Upload failed. Please try again later.");
      console.error("Error uploading furniture:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertType === "success" ? "Success" : "Error"}
        message={alertMessage}
        onConfirm={() => setAlertVisible(false)}
        onCancel={() => setAlertVisible(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Furniture</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => goToScreen("settings")}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>List Your Furniture</Text>
          <Text style={styles.heroSubtitle}>
            Fill in the details below to get started
          </Text>
        </View>

        <View style={styles.formCard}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Furniture Name</Text>
            <TextInput
              value={furnitureData.name}
              onChangeText={(text) =>
                setFurnitureData({ ...furnitureData, name: text })
              }
              placeholder="e.g., Modern Oak Coffee Table"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price (₱)</Text>
            <TextInput
              keyboardType="numeric"
              value={furnitureData.price}
              onChangeText={(text) =>
                setFurnitureData({ ...furnitureData, price: text })
              }
              placeholder="0.00"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>
          {/* Material */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Material</Text>
            <TextInput
              value={furnitureData.material}
              onChangeText={(text) =>
                setFurnitureData({ ...furnitureData, material: text })
              }
              placeholder="e.g., Wood, Metal, Glass"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Color */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              value={furnitureData.color}
              onChangeText={(text) =>
                setFurnitureData({ ...furnitureData, color: text })
              }
              placeholder="e.g., Black, White, Brown"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <Dropdown
              value={furnitureData.category}
              onSelect={(val) =>
                setFurnitureData({ ...furnitureData, category: val })
              }
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={furnitureData.description}
              onChangeText={(text) =>
                setFurnitureData({ ...furnitureData, description: text })
              }
              placeholder="Describe the furniture..."
              style={[styles.input, styles.textArea]}
              placeholderTextColor="#999"
              textAlignVertical="top"
            />
          </View>

          {/* Dimensions */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Size - height, width, depth in meters
            </Text>
            <TextInput
              value={furnitureData.size}
              onChangeText={(text) =>
                setFurnitureData({ ...furnitureData, size: text })
              }
              placeholder="formatting- height, width, depth"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Seller Info */}
          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Seller Information</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              keyboardType="phone-pad"
              value={furnitureData.contactNo || ""}
              onChangeText={(text) =>
                setFurnitureData({ ...furnitureData, contactNo: text })
              }
              placeholder="+63 XXX XXX XXXX"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Image URLs */}
          <View style={styles.sectionDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Product Images</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URLs</Text>
            <Text style={styles.helperText}>
              Enter URLs separated by commas
            </Text>
            <TextInput
              value={furnitureData.imageUris.join(", ")}
              onChangeText={(text) =>
                setFurnitureData({
                  ...furnitureData,
                  imageUris: text.split(",").map((s) => s.trim()),
                })
              }
              placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
              style={[styles.input, styles.textArea]}
              placeholderTextColor="#999"
              multiline
            />
          </View>

          {/* Image Preview */}
          {furnitureData.imageUris.length > 0 &&
            furnitureData.imageUris[0] !== "" && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 12 }}
              >
                {furnitureData.imageUris.map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 12,
                      marginRight: 8,
                    }}
                  />
                ))}
              </ScrollView>
            )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={submitFurniture}>
          <Text style={styles.submitButtonText}>Submit for Review →</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 20,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsIcon: {
    fontSize: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#6C757D",
    fontWeight: "400",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: "#6C757D",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E9ECEF",
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    fontSize: 15,
    color: "#1A1A1A",
  },
  inputText: {
    fontSize: 15,
    color: "#1A1A1A",
  },
  placeholderText: {
    fontSize: 15,
    color: "#999",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  dropdownContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownIcon: {
    fontSize: 12,
    color: "#6C757D",
  },
  dimensionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  dimensionContainer: {
    flex: 1,
  },
  dimensionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6C757D",
    marginBottom: 6,
  },
  dimensionInput: {
    borderWidth: 1.5,
    borderColor: "#E9ECEF",
    backgroundColor: "#F8F9FA",
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    color: "#1A1A1A",
    textAlign: "center",
  },
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E9ECEF",
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6C757D",
    marginHorizontal: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  imagePreviewSection: {
    marginTop: 16,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6C757D",
    marginBottom: 12,
  },
  imageScrollView: {
    marginHorizontal: -4,
  },
  imagePreviewContainer: {
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
  },
  imageNumber: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  imageNumberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#1A1A1A",
    marginHorizontal: 20,
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
  submitButtonIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#F8F9FA",
  },
  optionText: {
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  optionIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1A1A1A",
  },
  cancelButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6C757D",
  },
});

export default FurnitureUploadScreen;
