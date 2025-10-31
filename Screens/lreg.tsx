import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { auth, firestore } from "../firebase/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Screen } from "./App";

interface Props {
  goToScreen: (screen: Screen, params?: any) => void;
}

const LRegScreen: React.FC<Props> = ({ goToScreen }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "980572185774-4c22bkmqm894s8qeql9gu0ro25q6usgu.apps.googleusercontent.com",
    });
  }, []);

  // ✅ Password validator
  const validatePassword = (password: string) => {
    return {
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*]/.test(password),
      upperLower: /(?=.*[a-z])(?=.*[A-Z])/.test(password),
      noSpaces: !/\s/.test(password),
      noRepeats: !/(.)\1{2,}/.test(password),
      noSequence: !/(1234|abcd|qwerty)/i.test(password),
    };
  };

  // ✅ Email/password submit
  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      if (isRegister) {
        const reqs = validatePassword(form.password);
        const allPassed = Object.values(reqs).every((v) => v);
        if (!allPassed) {
          Alert.alert("Error", "Password does not meet requirements.");
          return;
        }
        if (form.password !== form.confirm) {
          Alert.alert("Error", "Passwords do not match.");
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        const user = userCredential.user;

        await setDoc(doc(firestore, "users", user.uid), {
          username: form.username,
          email: form.email,
          role: "user", // default role
        });

        Alert.alert("Success", "Account created.");
        goToScreen("profileSetup", { uid: user.uid, email: user.email });
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        const user = userCredential.user;

        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (!userDoc.exists()) {
          Alert.alert("Error", "No user record found in Firestore.");
          return;
        }

        const role = userDoc.data()?.role?.toLowerCase?.() || "user";

        Alert.alert("Success", "Logged in.");
        if (role === "admin") {
          goToScreen("adminDashb");
        } else {
          goToScreen("home");
        }
      }
    } catch (error: any) {
      Alert.alert("Firebase Error", error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { idToken, accessToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        Alert.alert("Google Sign-In Error", "No ID token returned.");
        return;
      }

      const googleCredential = GoogleAuthProvider.credential(
        idToken,
        accessToken
      );
      const userCredential = await signInWithCredential(auth, googleCredential);
      const user = userCredential.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          username: user.displayName || "New User",
          email: user.email,
          role: "user",
        });
      }

      const role =
        (userDoc.exists() ? userDoc.data()?.role : "user")?.toLowerCase() ||
        "user";

      Alert.alert("Success", "Logged in with Google.");
      if (role === "admin") {
        goToScreen("adminDashb");
      } else {
        goToScreen("home");
      }
    } catch (error: any) {
      Alert.alert("Google Sign-In Error", error.message);
    }
  };

  // ✅ Forgot password
  const handleForgotPassword = async () => {
    if (!form.email) {
      Alert.alert("Error", "Please enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, form.email);
      Alert.alert(
        "Email Sent",
        "A password reset link has been sent to your email."
      );
    } catch (error: any) {
      Alert.alert("Reset Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => goToScreen("home")}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{isRegister ? "Register" : "Login"}</Text>

      {isRegister && (
        <>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
          />
        </>
      )}

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={form.email}
        onChangeText={(text) => setForm({ ...form, email: text })}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        secureTextEntry
        value={form.password}
        onChangeText={(text) => setForm({ ...form, password: text })}
      />

      {isRegister && form.password.length > 0 && (
        <View style={styles.reqs}>
          {Object.entries(validatePassword(form.password)).map(([key, met]) => (
            <Text
              key={key}
              style={[styles.requirement, { color: met ? "green" : "red" }]}
            >
              {met ? "✔ " : "✘ "}
              {key === "upperLower"
                ? "Must contain uppercase & lowercase"
                : key === "length"
                ? "At least 8 characters"
                : key === "number"
                ? "At least 1 number"
                : key === "special"
                ? "At least 1 special character (!@#$%^&*)"
                : key === "noSpaces"
                ? "No spaces allowed"
                : key === "noRepeats"
                ? "No 3+ repeating characters"
                : "No common sequences (1234, abcd, qwerty)"}
            </Text>
          ))}
        </View>
      )}

      {isRegister && (
        <>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter your password"
            secureTextEntry
            value={form.confirm}
            onChangeText={(text) => setForm({ ...form, confirm: text })}
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>
          {isRegister ? "Register" : "Login"}
        </Text>
      </TouchableOpacity>

      {!isRegister && (
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#db4437" }]}
        onPress={handleGoogleLogin}
      >
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegister((prev) => !prev)}>
        <Text style={styles.toggleText}>
          {isRegister
            ? "Already have an account? Login"
            : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LRegScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    paddingTop: 90,
    backgroundColor: "#F4EDE3", // warm cream
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#4B3526", // rich brown
    textAlign: "center",
    marginBottom: 30,
    letterSpacing: 1,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B3526",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(75, 53, 38, 0.25)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#3E2A1C",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  button: {
    backgroundColor: "rgba(75, 53, 38, 0.85)", // soft brown with transparency
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  buttonText: {
    color: "#FFF8F0",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  toggleText: {
    marginTop: 20,
    textAlign: "center",
    color: "#6E4C2E",
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  forgotText: {
    marginTop: 8,
    textAlign: "center",
    color: "#8B5E3C",
    fontWeight: "500",
    textDecorationLine: "underline",
  },

  backButton: {
    position: "absolute",
    top: 50,
    left: 25,
    padding: 4, // small touch area, but no background shape
  },

  backButtonText: {
    fontSize: 30,
    color: "#4B3526", // deep brown to match theme
    fontWeight: "bold",
  },

  reqs: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "rgba(75,53,38,0.2)",
  },

  requirement: {
    fontSize: 12,
    fontWeight: "500",
  },
});
