import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import { Screen } from "./App";
import CustomAlert from "./CustomAlert"; // adjust path if needed

interface Props {
  goToScreen: (screen: Screen, params?: any) => void;
  route: { params: { uid: string; email: string } };
}

const ProfileSetupScreen: React.FC<Props> = ({ goToScreen, route }) => {
  const { uid, email } = route.params;

  const [profile, setProfile] = useState({
    username: "",
    fullName: "",
    birthday: "",
    gender: "",
    phoneNumber: "",
  });

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");

  const defaultProfilePic =
    "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg";

  const handleSave = async () => {
    const { username, fullName, birthday, gender, phoneNumber } = profile;

    if (!username || !fullName || !birthday || !gender || !phoneNumber) {
      setAlertType("error");
      setAlertMessage("Please fill in all fields.");
      setAlertVisible(true);
      return;
    }

    try {
      await setDoc(doc(firestore, "users", uid), {
        uid,
        username,
        fullName,
        birthday,
        gender,
        phoneNumber,

        email,
        profilePic: defaultProfilePic,
        createdAt: new Date(),
      });

      setAlertType("success");
      setAlertMessage("Profile saved successfully!");
      setAlertVisible(true);
    } catch (err: any) {
      setAlertType("error");
      setAlertMessage(err.message || "Something went wrong.");
      setAlertVisible(true);
    }
  };

  const handleConfirmAlert = () => {
    setAlertVisible(false);
    if (alertType === "success") goToScreen("home");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile Setup</Text>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={profile.username}
          onChangeText={(text) => setProfile({ ...profile, username: text })}
          placeholderTextColor="#A38F7A"
        />
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={profile.fullName}
          onChangeText={(text) => setProfile({ ...profile, fullName: text })}
          placeholderTextColor="#A38F7A"
        />
        <TextInput
          style={styles.input}
          placeholder="Birthday (YYYY-MM-DD)"
          value={profile.birthday}
          onChangeText={(text) => setProfile({ ...profile, birthday: text })}
          placeholderTextColor="#A38F7A"
        />
        <TextInput
          style={styles.input}
          placeholder="Gender"
          value={profile.gender}
          onChangeText={(text) => setProfile({ ...profile, gender: text })}
          placeholderTextColor="#A38F7A"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={profile.phoneNumber}
          onChangeText={(text) => setProfile({ ...profile, phoneNumber: text })}
          placeholderTextColor="#A38F7A"
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Profile</Text>
        </TouchableOpacity>
      </View>

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertType === "success" ? "Success" : "Error"}
        message={alertMessage}
        onConfirm={handleConfirmAlert}
        confirmText="OK"
      />
    </ScrollView>
  );
};

export default ProfileSetupScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    backgroundColor: "#EDE2D6",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#3E2E22",
    marginBottom: 28,
    textAlign: "center",
  },
  formCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#C9B7A9",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#F9F7F4",
    fontSize: 16,
    color: "#3E2E22",
    marginBottom: 14,
  },
  button: {
    backgroundColor: "#3E2E22",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
});
