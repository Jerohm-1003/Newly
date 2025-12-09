import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  StatusBar,
} from "react-native";
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
} from "react-native-image-picker";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { auth, firestore } from "../firebase/firebaseConfig";
import type { Screen } from "./App";
import CustomAlert from "./CustomAlert";

interface ProfileProps {
  goToScreen: (screen: Screen, params?: any) => void;
  goBack: () => void;
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

const Profile: React.FC<ProfileProps> = ({ goToScreen, goBack }) => {
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editAddressVisible, setEditAddressVisible] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [previousProfileData, setPreviousProfileData] = useState<any>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isPicModalVisible, setIsPicModalVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sellerRulesVisible, setSellerRulesVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const currentUser = auth.currentUser;

  // Custom Alert State
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: () => {},
    showCancel: false,
  });

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

  // Helper function to show custom alert
  const showAlert = (
    type: AlertState["type"],
    title: string,
    message: string,
    onConfirm: () => void,
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

  useEffect(() => {
    if (currentUser) {
      const fetchUserData = async () => {
        const userRef = doc(firestore, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData(data);
          setPreviousProfileData(data);
          setProfilePic(data.profilePic);
        }
      };
      fetchUserData();
    } else {
      setIsLoggedIn(false);
      setLoginModalVisible(true);
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentUser]);

  const chooseProfilePic = () => {
    launchImageLibrary(
      { mediaType: "photo", quality: 1 },
      (response: ImagePickerResponse) => {
        if (response.assets && response.assets[0]) {
          setProfilePic(response.assets[0].uri ?? null);
          setIsPicModalVisible(false);
        }
      }
    );
  };

  const takeProfilePic = () => {
    launchCamera(
      { mediaType: "photo", quality: 1 },
      (response: ImagePickerResponse) => {
        if (response.assets && response.assets[0]) {
          setProfilePic(response.assets[0].uri ?? null);
          setIsPicModalVisible(false);
        }
      }
    );
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(firestore, "users", currentUser.uid);

      const updates: any = {};
      const changedFields: string[] = [];
      Object.keys(profileData).forEach((key) => {
        const k = key as keyof typeof profileData;
        if (profileData[k] !== previousProfileData[k]) {
          updates[k] = profileData[k];
          changedFields.push(String(k));
        }
      });

      if (profilePic !== previousProfileData.profilePic) {
        updates.profilePic = profilePic;
        changedFields.push("profile picture");
      }

      if (Object.keys(updates).length === 0) {
        showAlert("info", "No Changes", "No fields were changed.", () => {});
        return;
      }

      await updateDoc(userRef, updates);

      for (const field of changedFields) {
        await addDoc(collection(firestore, "notifications"), {
          userId: currentUser.uid,
          message: `Your ${field} has been updated successfully.`,
          createdAt: new Date(),
          type: "profile_update",
          status: "unread",
        });
      }

      showAlert(
        "success",
        "Profile Updated",
        "Your profile has been updated successfully!",
        () => {
          setEditProfileVisible(false);
        }
      );

      setPreviousProfileData({ ...profileData, profilePic });
    } catch (error) {
      console.error(error);
      showAlert(
        "error",
        "Update Failed",
        "Failed to update profile. Please try again.",
        () => {}
      );
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
          setIsLoggedIn(false);
          goToScreen?.("home");
        } catch {
          showAlert(
            "error",
            "Logout Failed",
            "Failed to log out. Please try again.",
            () => {}
          );
        }
      },
      true,
      () => {},
      "Logout",
      "Cancel"
    );
  };

  const handleLogin = () => {
    setLoginModalVisible(false);
    goToScreen?.("lreg");
  };

  const handleLoginNo = () => {
    setLoginModalVisible(false);
    goToScreen?.("home");
  };

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

        <Text style={styles.headerTitle}>My Profile</Text>

        <TouchableOpacity
          onPress={() => goToScreen?.("settings")}
          style={styles.headerButton}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.cardBg }]}>
          <TouchableOpacity
            style={[
              styles.profileImageContainer,
              { borderColor: colors.accent },
            ]}
            onPress={() => setIsPicModalVisible(true)}
          >
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.profileImage} />
            ) : (
              <View
                style={[
                  styles.profilePlaceholder,
                  { backgroundColor: colors.accent },
                ]}
              >
                <Text style={styles.profileInitial}>
                  {profileData?.username?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <View
              style={[styles.cameraIcon, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.cameraEmoji}>📷</Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.profileName, { color: colors.textPrimary }]}>
            {profileData?.username || "Username"}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {currentUser?.email}
          </Text>

          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => setEditProfileVisible(true)}
          >
            <Text style={styles.editButtonText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Details Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Personal Information
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Full Name
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {profileData?.fullName || "Not set"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Birthday
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {profileData?.birthday || "Not set"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Gender
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {profileData?.gender || "Not set"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              Phone Number
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {profileData?.phoneNumber || "Not set"}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Login Modal */}
      <Modal
        visible={loginModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLoginModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.cardBg }]}>
            <View
              style={[styles.modalIconCircle, { backgroundColor: "#E3F2FD" }]}
            >
              <Text style={styles.modalIconText}>🔒</Text>
            </View>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Not Logged In
            </Text>
            <Text
              style={[styles.modalMessage, { color: colors.textSecondary }]}
            >
              You need to login to access your profile. Would you like to login
              or create an account?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleLoginNo}
                style={[
                  styles.modalButtonSecondary,
                  { borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.modalButtonSecondaryText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Maybe Later
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogin}
                style={[
                  styles.modalButtonPrimary,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.modalButtonPrimaryText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Pic Modal */}
      <Modal
        visible={isPicModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPicModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.picModalBox, { backgroundColor: colors.cardBg }]}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Change Profile Picture
            </Text>

            <TouchableOpacity
              style={[styles.picOption, { borderColor: colors.border }]}
              onPress={chooseProfilePic}
            >
              <Text style={styles.picOptionIcon}>🖼️</Text>
              <Text
                style={[styles.picOptionText, { color: colors.textPrimary }]}
              >
                Choose from Gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.picOption, { borderColor: colors.border }]}
              onPress={takeProfilePic}
            >
              <Text style={styles.picOptionIcon}>📸</Text>
              <Text
                style={[styles.picOptionText, { color: colors.textPrimary }]}
              >
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => setIsPicModalVisible(false)}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: colors.textSecondary },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.formModalBox, { backgroundColor: colors.cardBg }]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={[styles.formModalTitle, { color: colors.textPrimary }]}
              >
                Edit Profile
              </Text>

              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Username
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Enter username"
                placeholderTextColor={colors.textSecondary}
                value={profileData?.username}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, username: text })
                }
              />

              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Full Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Enter full name"
                placeholderTextColor={colors.textSecondary}
                value={profileData?.fullName}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, fullName: text })
                }
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text
                    style={[styles.inputLabel, { color: colors.textSecondary }]}
                  >
                    Birthday
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="mm/dd/yyyy"
                    placeholderTextColor={colors.textSecondary}
                    value={profileData?.birthday}
                    onChangeText={(text) =>
                      setProfileData({ ...profileData, birthday: text })
                    }
                  />
                </View>

                <View style={styles.halfWidth}>
                  <Text
                    style={[styles.inputLabel, { color: colors.textSecondary }]}
                  >
                    Gender
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      styles.dropdownTrigger,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setShowDropdown(!showDropdown)}
                  >
                    <Text
                      style={{
                        color: profileData?.gender
                          ? colors.textPrimary
                          : colors.textSecondary,
                      }}
                    >
                      {profileData?.gender || "Select"}
                    </Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>

                  {showDropdown && (
                    <View
                      style={[
                        styles.dropdown,
                        {
                          backgroundColor: colors.cardBg,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          setProfileData({ ...profileData, gender: "Male" });
                          setShowDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: colors.textPrimary },
                          ]}
                        >
                          Male
                        </Text>
                      </TouchableOpacity>
                      <View
                        style={[
                          styles.dropdownDivider,
                          { backgroundColor: colors.border },
                        ]}
                      />
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          setProfileData({ ...profileData, gender: "Female" });
                          setShowDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            { color: colors.textPrimary },
                          ]}
                        >
                          Female
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Phone Number
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textSecondary}
                value={profileData?.phoneNumber}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, phoneNumber: text })
                }
                keyboardType="phone-pad"
              />

              <View style={styles.formModalButtons}>
                <TouchableOpacity
                  style={[
                    styles.formCancelButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={() => setEditProfileVisible(false)}
                >
                  <Text
                    style={[
                      styles.formCancelButtonText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.formSaveButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleUpdateProfile}
                >
                  <Text style={styles.formSaveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Address Modal */}

      {/* Seller Rules Modal */}
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
  settingsIcon: {
    fontSize: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
    borderWidth: 3,
    borderRadius: 60,
    padding: 4,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  cameraEmoji: {
    fontSize: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 16,
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  editLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  chevron: {
    fontSize: 24,
    color: "#CCCCCC",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalIconText: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  picModalBox: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  picOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  picOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  picOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  formModalBox: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  formModalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
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
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  dropdownTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownArrow: {
    fontSize: 10,
    color: "#999999",
  },
  dropdown: {
    position: "absolute",
    top: 75,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    padding: 14,
  },
  dropdownItemText: {
    fontSize: 15,
  },
  dropdownDivider: {
    height: 1,
  },
  formModalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  formCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  formCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  formSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  formSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  rulesModalBox: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  ruleItem: {
    flexDirection: "row",
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
  },
  ruleNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#D4A574",
    marginRight: 12,
    width: 24,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  rulesModalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  rulesDeclineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  rulesDeclineText: {
    fontSize: 16,
    fontWeight: "600",
  },
  rulesAgreeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  rulesAgreeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Profile;
