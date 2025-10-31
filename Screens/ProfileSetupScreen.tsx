import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase/firebaseConfig";
import { Screen } from "./App";

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
    address: "",
  });

  const defaultProfilePic =
    "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg";

  const handleSave = async () => {
    const { username, fullName, birthday, gender, phoneNumber, address } =
      profile;

    if (
      !username ||
      !fullName ||
      !birthday ||
      !gender ||
      !phoneNumber ||
      !address
    ) {
      Alert.alert("Error", "Please fill in all fields.");
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
        address,
        email,
        profilePic: defaultProfilePic,
        createdAt: new Date(),
      });
      Alert.alert("Success", "Profile saved.");
      goToScreen("home");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile Setup</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={profile.username}
        onChangeText={(text) => setProfile({ ...profile, username: text })}
        placeholderTextColor="#9E9E9E"
      />
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={profile.fullName}
        onChangeText={(text) => setProfile({ ...profile, fullName: text })}
        placeholderTextColor="#9E9E9E"
      />
      <TextInput
        style={styles.input}
        placeholder="Birthday (YYYY-MM-DD)"
        value={profile.birthday}
        onChangeText={(text) => setProfile({ ...profile, birthday: text })}
        placeholderTextColor="#9E9E9E"
      />
      <TextInput
        style={styles.input}
        placeholder="Gender"
        value={profile.gender}
        onChangeText={(text) => setProfile({ ...profile, gender: text })}
        placeholderTextColor="#9E9E9E"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        value={profile.phoneNumber}
        onChangeText={(text) => setProfile({ ...profile, phoneNumber: text })}
        placeholderTextColor="#9E9E9E"
      />
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={profile.address}
        onChangeText={(text) => setProfile({ ...profile, address: text })}
        placeholderTextColor="#9E9E9E"
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileSetupScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#D8C5B4", // Matches HomeScreen background color
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3E2E22", // Dark color from HomeScreen header
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBB8A6", // Lighter border color from HomeScreen menu
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#3E2E22", // Dark text color for readability
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    backgroundColor: "#3E2E22", // Dark color like HomeScreen's header and bottom navigation
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
