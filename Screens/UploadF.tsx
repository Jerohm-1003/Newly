import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, firestore } from "../firebase/firebaseConfig";
import type { Screen } from "./App";

interface FurnitureData {
  name: string;
  price: string;
  description: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  category: string;
  imageUris: string[];
  status: "pending" | "approved";
  uploadedBy: string | null;
  username?: string | null;
  contactNo?: string | null;

  createdAt: any; // Firestore timestamp
}

interface FurnitureUploadScreenProps {
  goBack: () => void;
  goToScreen: (screen: Screen, params?: any) => void;
}

// Categories
const categories = [
  "Sofa",
  "Chair",
  "TV Stand",
  "Desks",
  "Bed",
  "Wardrobe",
  "Dining Chair",
  "Cabinet",
  "Dining Table",
];

// Custom Dropdown Component
const Dropdown: React.FC<{
  value: string;
  onSelect: (val: string) => void;
}> = ({ value, onSelect }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity style={styles.input} onPress={() => setVisible(true)}>
        <Text style={{ color: value ? "#3E2E22" : "#888" }}>
          {value || "Select Category"}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.option, { backgroundColor: "#ddd" }]}
              onPress={() => setVisible(false)}
            >
              <Text style={[styles.optionText, { color: "black" }]}>
                Cancel
              </Text>
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
    dimensions: { length: "", width: "", height: "" },
    category: "",

    imageUris: [],
    status: "pending",
    uploadedBy: auth.currentUser?.uid || null,
    username: auth.currentUser?.displayName || null, // ✅ fetch username

    createdAt: serverTimestamp(),
  });

  const submitFurniture = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "You must be logged in to submit furniture.");
      return;
    }

    const { name, price, description, category, imageUris } = furnitureData;

    if (
      !name ||
      !price ||
      !description ||
      !category ||
      imageUris.length === 0
    ) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    try {
      await addDoc(collection(firestore, "products"), {
        ...furnitureData,
        price: parseFloat(furnitureData.price),
        status: "pending",
        uploadedBy: auth.currentUser?.uid,
        username: auth.currentUser?.displayName || "Unknown", // ✅ save username
        contactNo: furnitureData.contactNo || "Not provided",

        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Furniture submitted for review.");
      setFurnitureData({
        name: "",
        price: "",
        description: "",
        dimensions: { length: "", width: "", height: "" },
        category: "",
        imageUris: [],
        status: "pending",
        uploadedBy: auth.currentUser?.uid || null,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      Alert.alert("Upload Failed", "Please try again later.");
      console.error("Error uploading furniture:", error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => goToScreen("home")}>
          <Text style={styles.headerIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Upload Furniture</Text>

      {/* Name */}
      <Text style={styles.label}>Name</Text>
      <TextInput
        value={furnitureData.name}
        onChangeText={(text) =>
          setFurnitureData({ ...furnitureData, name: text })
        }
        placeholder="Enter furniture name"
        style={styles.input}
        placeholderTextColor="#888"
      />

      {/* Price */}
      <Text style={styles.label}>Price</Text>
      <TextInput
        keyboardType="numeric"
        value={furnitureData.price}
        onChangeText={(text) =>
          setFurnitureData({ ...furnitureData, price: text })
        }
        placeholder="Enter price"
        style={styles.input}
        placeholderTextColor="#888"
      />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        multiline
        numberOfLines={4}
        value={furnitureData.description}
        onChangeText={(text) =>
          setFurnitureData({ ...furnitureData, description: text })
        }
        placeholder="Enter description"
        style={[styles.input, { height: 100 }]}
        placeholderTextColor="#888"
      />

      {/* Dimensions */}
      <Text style={styles.label}>Dimensions (L x W x H in meter)</Text>
      <View style={styles.dimensionsRow}>
        {["length", "width", "height"].map((dim) => (
          <TextInput
            key={dim}
            placeholder={dim.charAt(0).toUpperCase() + dim.slice(1)}
            keyboardType="numeric"
            value={
              furnitureData.dimensions[
                dim as keyof typeof furnitureData.dimensions
              ]
            }
            onChangeText={(text) =>
              setFurnitureData({
                ...furnitureData,
                dimensions: { ...furnitureData.dimensions, [dim]: text },
              })
            }
            style={styles.dimensionInput}
            placeholderTextColor="#888"
          />
        ))}
      </View>

      {/* Category Dropdown */}
      <Text style={styles.label}>Category</Text>
      <Dropdown
        value={furnitureData.category}
        onSelect={(val) =>
          setFurnitureData({ ...furnitureData, category: val })
        }
      />
      <Text style={styles.label}>Seller Name</Text>
      <TextInput
        keyboardType="default"
        value={furnitureData.username || ""}
        onChangeText={(text) =>
          setFurnitureData({ ...furnitureData, username: text })
        }
        placeholder="Seller Name"
        style={styles.input}
        placeholderTextColor="#888"
      />
      <Text style={styles.label}>Contact Number</Text>
      <TextInput
        keyboardType="number-pad"
        value={furnitureData.contactNo || ""}
        onChangeText={(text) =>
          setFurnitureData({ ...furnitureData, contactNo: text })
        }
        placeholder="Enter your contact number"
        style={styles.input}
        placeholderTextColor="#888"
      />

      {/* Image Uris */}
      <Text style={styles.label}>Image URIs</Text>
      <TextInput
        value={furnitureData.imageUris.join(", ")}
        onChangeText={(text) =>
          setFurnitureData({
            ...furnitureData,
            imageUris: text.split(",").map((s) => s.trim()),
          })
        }
        placeholder="Enter imageUri(s), separated by commas"
        style={styles.input}
        placeholderTextColor="#888"
      />

      {/* Preview Images */}
      <ScrollView horizontal style={{ marginTop: 10 }}>
        {furnitureData.imageUris.map((uri, index) => (
          <Image
            key={index}
            source={{ uri }}
            style={{ width: 100, height: 100, marginRight: 10 }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#3E2E22", marginTop: 20 }]}
        onPress={submitFurniture}
      >
        <Text style={styles.buttonText}>Submit Furniture</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#A89580", flexGrow: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#3E2E22",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backButtonText: { color: "white", fontWeight: "600" },
  headerIcon: { fontSize: 24, color: "#3E2E22" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3E2E22",
    marginBottom: 20,
  },
  label: { color: "#3E2E22", marginBottom: 4, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#705D47",
    backgroundColor: "#F2EDE6",
    marginBottom: 10,
    padding: 12,
    borderRadius: 6,
    color: "#3E2E22",
  },
  dimensionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dimensionInput: {
    borderWidth: 1,
    borderColor: "#705D47",
    backgroundColor: "#F2EDE6",
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 6,
    color: "#3E2E22",
  },
  button: { padding: 12, alignItems: "center", borderRadius: 8, marginTop: 10 },
  buttonText: { color: "white", fontWeight: "bold" },
  subText: { color: "#3E2E22", marginBottom: 10 },

  // Dropdown styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
  },
  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: {
    fontSize: 16,
    color: "#3E2E22",
  },
});

export default FurnitureUploadScreen;
