import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  TextInput,
  Modal,
  StatusBar,
} from "react-native";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  signOut,
} from "firebase/auth";
import { auth, firestore } from "../firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import CustomAlert from "./CustomAlert";
import { Screen } from "./App";

interface SettingsScreenProps {
  goBack: () => void;
  goToScreen: (screen: Screen, params?: any) => void;
}

interface AlertState {
  visible: boolean;
  type: "success" | "error" | "warning" | "info" | "question";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  goBack,
  goToScreen,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Color Palette - Theme
  const colors = {
    primary: "#2D2416",
    secondary: "#8B7355",
    accent: "#D4A574",
    background: "#FAF8F5",
    cardBg: "#FFFFFF",
    textPrimary: "#1A1A1A",
    textSecondary: "#6B6B6B",
    border: "#E8E8E8",
    success: "#4CAF50",
    error: "#FF3B30",
  };

  // Custom Alert State
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: () => {},
    showCancel: false,
  });

  // Helper function to show custom alert
  const showAlert = (
    type: AlertState["type"],
    title: string,
    message: string,
    onConfirm: () => void = () => {},
    showCancel = false,
    onCancel?: () => void,
    confirmText = "OK",
    cancelText = "Cancel"
  ) => {
    setAlertState({
      visible: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm: () => {
        onConfirm();
        setAlertState((prev) => ({ ...prev, visible: false }));
      },
      onCancel: onCancel
        ? () => {
            onCancel();
            setAlertState((prev) => ({ ...prev, visible: false }));
          }
        : undefined,
      showCancel,
    });
  };

  const validatePassword = (password: string) => {
    return {
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*]/.test(password),
      upperLower: /(?=.*[a-z])(?=.*[A-Z])/.test(password),
    };
  };

  const handleChangePassword = () => {
    setModalVisible(true);
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert(
        "warning",
        "Missing Information",
        "Please fill in all password fields."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert(
        "error",
        "Password Mismatch",
        "New password and confirm password do not match."
      );
      return;
    }

    const reqs = validatePassword(newPassword);
    const allPassed = Object.values(reqs).every((v) => v);
    if (!allPassed) {
      showAlert(
        "warning",
        "Weak Password",
        "New password must be at least 8 characters with uppercase, lowercase, number, and special character."
      );
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.email) {
      showAlert("error", "Authentication Error", "No user logged in!");
      return;
    }

    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      await addDoc(collection(firestore, "notifications"), {
        userId: user.uid,
        type: "password_change",
        message: "You successfully changed your password.",
        status: "unread",
        changedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      showAlert(
        "success",
        "Password Updated",
        "Your password has been changed successfully!",
        () => {
          setModalVisible(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
      );
    } catch (error: any) {
      const errorMessage =
        error.code === "auth/wrong-password"
          ? "Current password is incorrect."
          : error.message || "Failed to update password.";
      showAlert("error", "Update Failed", errorMessage);
    }
  };

  const handleLogout = async () => {
    showAlert(
      "question",
      "Logout",
      "Are you sure you want to logout?",
      async () => {
        try {
          await signOut(auth);
          goBack();
        } catch {
          showAlert(
            "error",
            "Logout Failed",
            "Failed to log out. Please try again."
          );
        }
      },
      true,
      () => {},
      "Logout",
      "Cancel"
    );
  };

  const handleAboutApp = () => {
    showAlert(
      "info",
      "About ShopFur",
      "ShopFur v1.0\n\nAn AR Furniture Visualization app using SLAM Algorithm.\n\nExperience furniture in your space before you buy!",
      () => {}
    );
  };

  const handlePrivacyPolicy = () => {
    showAlert(
      "info",
      "Privacy Policy",
      "Privacy policy feature coming soon!\n\nWe take your privacy seriously and will update this section with our full privacy policy.",
      () => {}
    );
  };

  const getPasswordStrength = () => {
    if (newPassword.length === 0) return null;
    const reqs = validatePassword(newPassword);
    const passed = Object.values(reqs).filter((v) => v).length;
    const total = Object.values(reqs).length;
    const percentage = (passed / total) * 100;

    if (percentage < 50) return { label: "Weak", color: colors.error };
    if (percentage < 75) return { label: "Fair", color: "#FFA500" };
    if (percentage < 100) return { label: "Good", color: "#FFD700" };
    return { label: "Strong", color: colors.success };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Custom Alert Component */}
      <CustomAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
        showCancel={alertState.showCancel}
      />

      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={goBack} style={styles.headerButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Settings</Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Settings Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Account Settings
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={handleChangePassword}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>🔒</Text>
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>
                Change Password
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>🚪</Text>
              <Text style={[styles.settingText, { color: colors.error }]}>
                Logout
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* App Preferences Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            App Preferences
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <TouchableOpacity
                onPress={() => goToScreen("Inbox")}
                style={{ flex: 1 }} // optional, to make whole area touchable
              >
                <Text
                  style={[styles.settingText, { color: colors.textPrimary }]}
                >
                  Inbox
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            About
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={handleAboutApp}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>ℹ️</Text>
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>
                About this App
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <View
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>📱</Text>
              <View>
                <Text
                  style={[styles.settingText, { color: colors.textPrimary }]}
                >
                  Version
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  1.0.0
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handlePrivacyPolicy}
          >
            <View style={styles.settingItemLeft}>
              <Text style={styles.settingIcon}>🔐</Text>
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>
                Privacy Policy
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.cardBg }]}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Change Password
            </Text>

            <Text
              style={[styles.modalDescription, { color: colors.textSecondary }]}
            >
              Enter your current password and choose a new one
            </Text>

            <View style={styles.inputContainer}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Current Password
              </Text>
              <TextInput
                placeholder="Enter current password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                New Password
              </Text>
              <TextInput
                placeholder="Enter new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={newPassword}
                onChangeText={setNewPassword}
              />

              {/* Password Strength Indicator */}
              {passwordStrength && (
                <View style={styles.strengthContainer}>
                  <View
                    style={[
                      styles.strengthBar,
                      { backgroundColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          backgroundColor: passwordStrength.color,
                          width: `${
                            (Object.values(
                              validatePassword(newPassword)
                            ).filter((v) => v).length /
                              4) *
                            100
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.strengthLabel,
                      { color: passwordStrength.color },
                    ]}
                  >
                    {passwordStrength.label}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Confirm New Password
              </Text>
              <TextInput
                placeholder="Re-enter new password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalCancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => {
                  setModalVisible(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handlePasswordUpdate}
              >
                <Text style={styles.modalConfirmText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    paddingTop: 20,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: "#CCCCCC",
    fontWeight: "300",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  strengthContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalConfirmButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SettingsScreen;
