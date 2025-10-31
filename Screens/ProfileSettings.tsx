import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { firestore } from "../firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface SettingsScreenProps {
  goBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ goBack }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- CHANGE PASSWORD ---
  const handleChangePassword = () => {
    setModalVisible(true);
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match.");
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      Alert.alert("Error", "No user logged in!");
      return;
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    try {
      // Reauthenticate
      await reauthenticateWithCredential(user, credential);
      // Update password
      await updatePassword(user, newPassword);

      // Add notification to Firestore
      await addDoc(collection(firestore, "notifications"), {
        userId: user.uid,
        type: "password_change",
        message: "You have successfully changed your password.",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Password updated successfully!");
      setModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update password.");
    }
  };

  // --- LOGOUT ---
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => console.log("Logged out") },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>SETTINGS</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <TouchableOpacity style={styles.item} onPress={handleChangePassword}>
            <Text style={styles.itemText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={handleLogout}>
            <Text style={[styles.itemText, { color: "#b34b4b" }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>

          <View style={styles.toggleRow}>
            <Text style={styles.itemText}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#ccc", true: "#8B5E3C" }}
              thumbColor={darkMode ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.itemText}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#ccc", true: "#8B5E3C" }}
              thumbColor={notificationsEnabled ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              Alert.alert(
                "About App",
                "Shopfur v1.0\nAn AR Furniture Visualization app using SLAM Algorithm."
              )
            }
          >
            <Text style={styles.itemText}>About this App</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              Alert.alert("Privacy Policy", "Feature coming soon!")
            }
          >
            <Text style={styles.itemText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <TextInput
              placeholder="Current Password"
              placeholderTextColor="#6B4226"
              secureTextEntry
              style={[styles.input, { color: "#3C2A21" }]}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <TextInput
              placeholder="New Password"
              placeholderTextColor="#6B4226"
              secureTextEntry
              style={[styles.input, { color: "#3C2A21" }]}
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextInput
              placeholder="Confirm New Password"
              placeholderTextColor="#6B4226"
              secureTextEntry
              style={[styles.input, { color: "#3C2A21" }]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handlePasswordUpdate}
            >
              <Text style={styles.modalButtonText}>Update Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#ccc" }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#D7C0AE" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5E3C",
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  backButton: { fontSize: 22, color: "#fff", marginRight: 10 },
  headerText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  scrollContainer: { padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6B4226",
    marginBottom: 10,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#bda18c",
  },
  itemText: { fontSize: 15, color: "#3C2A21" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#bda18c",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#bda18c",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  modalButton: {
    backgroundColor: "#8B5E3C",
    padding: 12,
    borderRadius: 5,
    marginVertical: 5,
  },
  modalButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});

export default SettingsScreen;
