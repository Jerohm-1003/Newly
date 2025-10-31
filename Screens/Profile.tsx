import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Animated,
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

interface ProfileProps {
  goToScreen: (screen: Screen, params?: any) => void;
  goBack: () => void;
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

  useEffect(() => {
    if (currentUser) {
      const fetchUserData = async () => {
        const userRef = doc(firestore, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData(data);
          setPreviousProfileData(data); // Save for change detection
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
  const loginFadeAnim = useRef(new Animated.Value(0)).current;
  const loginScaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (loginModalVisible) {
      Animated.parallel([
        Animated.timing(loginFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(loginScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(loginFadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [loginModalVisible]);

  // Image handlers
  const chooseProfilePic = () => {
    launchImageLibrary(
      { mediaType: "photo", quality: 1 },
      (response: ImagePickerResponse) => {
        if (response.assets && response.assets[0])
          setProfilePic(response.assets[0].uri ?? null);
      }
    );
  };

  const takeProfilePic = () => {
    launchCamera(
      { mediaType: "photo", quality: 1 },
      (response: ImagePickerResponse) => {
        if (response.assets && response.assets[0])
          setProfilePic(response.assets[0].uri ?? null);
      }
    );
  };

  // Update Profile Modal Handler
  const handleUpdateProfile = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(firestore, "users", currentUser.uid);

      // Compare current data with previous to detect changes
      const updates: any = {};
      const changedFields: string[] = [];
      Object.keys(profileData).forEach((key) => {
        const k = key as keyof typeof profileData;
        if (profileData[k] !== previousProfileData[k]) {
          updates[k] = profileData[k];
          changedFields.push(String(k)); // <-- cast to string here
        }
      });

      if (profilePic !== previousProfileData.profilePic) {
        updates.profilePic = profilePic;
        changedFields.push("profile picture");
      }

      if (Object.keys(updates).length === 0) {
        Alert.alert("No changes", "No fields were changed.");
        return;
      }

      await updateDoc(userRef, updates);

      // Send specific notifications for each changed field
      for (const field of changedFields) {
        await addDoc(collection(firestore, "notifications"), {
          userId: currentUser.uid,
          message: `Your ${field} has been updated successfully.`,
          createdAt: new Date(),
          type: "profile_update",
        });
      }

      Alert.alert("Success", "Profile updated.");
      setEditProfileVisible(false);

      // Update local previousProfileData
      setPreviousProfileData({ ...profileData, profilePic });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  // Update Address Modal Handler
  const handleUpdateAddress = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(firestore, "users", currentUser.uid);

      if (profileData.address !== previousProfileData.address) {
        await updateDoc(userRef, { address: profileData.address });

        await addDoc(collection(firestore, "notifications"), {
          userId: currentUser.uid,
          message: `Your address has been updated successfully.`,
          createdAt: new Date(),
          type: "profile_update",
        });

        Alert.alert("Success", "Address updated.");
        setEditAddressVisible(false);
        setPreviousProfileData({
          ...previousProfileData,
          address: profileData.address,
        });
      } else {
        Alert.alert("No changes", "Address was not changed.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update address.");
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      goToScreen?.("home");
    } catch {
      Alert.alert("Error", "Failed to log out.");
    }
  };

  const handleLogin = () => {
    setLoginModalVisible(false);
    goToScreen?.("lreg");
  };
  const handleLoginNo = () => {
    setLoginModalVisible(false);
    goToScreen?.("home");
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.headerIcon}>←</Text>
        </TouchableOpacity>
        <Image
          source={require("../assets/cart_icon.png")}
          style={styles.logoImage}
        />
        <Text style={styles.headerIcon}>⚙️</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>My Profile</Text>

          <View style={styles.profileBox}>
            <TouchableOpacity
              style={styles.profileImagePlaceholder}
              onPress={() => setIsPicModalVisible(true)}
            >
              {profilePic ? (
                <Image
                  source={{ uri: profilePic }}
                  style={styles.profileImage}
                />
              ) : (
                <Text style={styles.profileInitial}>
                  {profileData?.username?.charAt(0)}
                </Text>
              )}
            </TouchableOpacity>
            <Text style={styles.profileName}>{profileData?.username}</Text>
            <TouchableOpacity onPress={() => setEditProfileVisible(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileDetails}>
            <Text style={styles.detailLabel}>Full Name</Text>
            <Text style={styles.detailValue}>{profileData?.fullName}</Text>

            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{currentUser?.email}</Text>

            <Text style={styles.detailLabel}>Birthday</Text>
            <Text style={styles.detailValue}>{profileData?.birthday}</Text>

            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={styles.detailValue}>{profileData?.gender}</Text>

            <Text style={styles.detailLabel}>Phone Number</Text>
            <Text style={styles.detailValue}>{profileData?.phoneNumber}</Text>

            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{profileData?.address}</Text>
            <TouchableOpacity onPress={() => setEditAddressVisible(true)}>
              <Text style={styles.editAddressText}>Edit Address</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => goToScreen?.("orderHistory")}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText}>🧾 View Order History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            {/* Become a Seller Section */}
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: "#A67B5B" }]}
              onPress={() => setSellerRulesVisible(true)}
            >
              <Text style={styles.logoutText}>Want to Become a Seller?</Text>
            </TouchableOpacity>

            {/* Seller Rules Modal */}
            <Modal
              visible={sellerRulesVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setSellerRulesVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                  <Text style={styles.modalTitle}>
                    Seller Rules & Guidelines
                  </Text>
                  <Text style={styles.modalText}>
                    1. Only upload original furniture designs or items you own.
                  </Text>
                  <Text style={styles.modalText}>
                    2. Uploaded items must not contain prohibited content.
                  </Text>
                  <Text style={styles.modalText}>
                    3. All listings will be reviewed by admin before approval.
                  </Text>
                  <Text style={styles.modalText}>
                    4. Misuse of the seller system can lead to account
                    suspension.
                  </Text>
                  <Text style={styles.modalText}>
                    5. Follow ethical selling practices and ensure accuracy in
                    pricing.
                  </Text>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalButtonCancel}
                      onPress={() => setSellerRulesVisible(false)}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        setSellerRulesVisible(false);
                        goToScreen?.("SellerPart"); // navigate to SellerPart.tsx
                      }}
                    >
                      <Text style={styles.modalButtonText}>
                        Agree & Continue
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </View>
      </ScrollView>

      {/* ---------------- Modals ---------------- */}

      {/* Login Modal */}
      <Modal
        visible={loginModalVisible}
        transparent
        animationType="none" // disable default pop-up animation
        onRequestClose={() => setLoginModalVisible(false)}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: loginFadeAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.loginModalBox,
              {
                transform: [{ scale: loginScaleAnim }],
              },
            ]}
          >
            <Text style={styles.modalTitle}>You are not Logged in.</Text>
            <Text style={styles.modalText}>
              Do you want to Login to your Account or Create an Account?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={handleLoginNo}
                style={styles.modalButtonCancel}
              >
                <Text style={styles.modalCancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogin}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Profile Pic Modal */}
      <Modal
        visible={isPicModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPicModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Choose Profile Picture</Text>
            <TouchableOpacity
              style={styles.uploadPicButton}
              onPress={chooseProfilePic}
            >
              <Text style={styles.uploadPicText}>Upload Pic</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadPicButton}
              onPress={takeProfilePic}
            >
              <Text style={styles.uploadPicText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsPicModalVisible(false)}
              style={styles.modalButtonCancel}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.cardModalBox,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <ScrollView contentContainerStyle={{ padding: 10 }}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                value={profileData?.username}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, username: text })
                }
                placeholderTextColor="#9E9E9E"
              />

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={profileData?.fullName}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, fullName: text })
                }
                placeholderTextColor="#9E9E9E"
              />

              <View style={styles.row}>
                <View style={styles.halfBox}>
                  <Text style={styles.label}>Birthday</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="mm/dd/yyyy"
                    value={profileData?.birthday}
                    onChangeText={(text) =>
                      setProfileData({ ...profileData, birthday: text })
                    }
                    placeholderTextColor="#9E9E9E"
                  />
                </View>
                <View style={styles.halfBox}>
                  <Text style={styles.label}>Gender</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowDropdown(!showDropdown)}
                  >
                    <Text
                      style={{
                        color: profileData?.gender ? "#3E2E22" : "#9E9E9E",
                      }}
                    >
                      {profileData?.gender ? profileData.gender : "Select"}
                    </Text>
                  </TouchableOpacity>
                  {showDropdown && (
                    <View style={styles.dropdown}>
                      <TouchableOpacity
                        onPress={() => {
                          setProfileData({ ...profileData, gender: "Male" });
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItem}>Male</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setProfileData({ ...profileData, gender: "Female" });
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItem}>Female</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={profileData?.phoneNumber}
                onChangeText={(text) =>
                  setProfileData({ ...profileData, phoneNumber: text })
                }
                placeholderTextColor="#9E9E9E"
                keyboardType="phone-pad"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={() => setEditProfileVisible(false)}
                  style={styles.modalButtonCancel}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdateProfile}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Edit Address Modal */}
      <Modal
        visible={editAddressVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditAddressVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.cardModalBox,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.modalTitle}>Edit Address</Text>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.addressInput]}
              placeholder="Enter address"
              value={profileData?.address}
              onChangeText={(text) =>
                setProfileData({ ...profileData, address: text })
              }
              placeholderTextColor="#9E9E9E"
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setEditAddressVisible(false)}
                style={styles.modalButtonCancel}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateAddress}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default Profile;

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#d9c5b2" },
  header: {
    backgroundColor: "#3E2E22",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerIcon: { color: "white", fontSize: 24 },
  logoImage: { width: 40, height: 40, marginRight: 5 },
  content: { flex: 1, padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#3E2E22",
    marginBottom: 20,
  },
  profileBox: { alignItems: "center", marginBottom: 20 },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: "#D6C7B0",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: { width: "100%", height: "100%", borderRadius: 50 },
  profileInitial: { fontSize: 40, color: "#fff" },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#3E2E22",
    marginTop: 10,
  },
  editButtonText: { fontSize: 16, color: "#A67B5B" },
  profileDetails: { marginTop: 20 },
  detailLabel: { fontSize: 16, fontWeight: "bold", color: "#3E2E22" },
  detailValue: { fontSize: 14, marginBottom: 10, color: "#6B4F3B" },
  editAddressText: { fontSize: 16, color: "#A67B5B" },
  logoutButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#6B4F3B",
    borderRadius: 8,
  },
  logoutText: { color: "#fff", fontSize: 16, textAlign: "center" },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  modalBox: {
    width: "90%",
    backgroundColor: "#f5ece2",
    padding: 20,
    borderRadius: 15,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    color: "#3E2E22",
    textAlign: "center",
  },
  uploadPicButton: {
    padding: 12,
    backgroundColor: "#b08a6c",
    borderRadius: 8,
    marginTop: 10,
  },
  uploadPicText: { textAlign: "center", color: "#fff", fontWeight: "600" },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 20,
  },

  modalButton: {
    flex: 1,
    backgroundColor: "rgba(107, 79, 59, 0.9)", // soft brown, slightly transparent
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  modalButtonCancel: {
    flex: 1,
    backgroundColor: "rgba(107, 79, 59, 0.5)", // same tone but lighter transparency
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  modalButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },

  modalCancelText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  modalText: {
    fontSize: 16,
    color: "#6B4F3B",
    marginBottom: 5,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#b08a6c",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#3E2E22",
    width: "100%",
  },
  addressInput: { height: 100, textAlignVertical: "top" },
  label: {
    alignSelf: "flex-start",
    fontSize: 16,
    fontWeight: "600",
    color: "#6B513E",
    marginBottom: 5,
  },
  row: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  halfBox: { flex: 1, marginRight: 6 },
  dropdown: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#b08a6c",
    elevation: 5,
    zIndex: 10,
  },
  dropdownItem: { padding: 10, fontSize: 15, color: "#3E2E22" },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cardModalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    alignSelf: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  loginModalBox: {
    width: "85%",
    backgroundColor: "rgba(245, 236, 226, 0.95)", // slightly transparent cream
    borderRadius: 18,
    padding: 25,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
});
