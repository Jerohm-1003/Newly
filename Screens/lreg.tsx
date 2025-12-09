import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
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
import CustomAlert from "./CustomAlert";

interface Props {
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

const LRegScreen: React.FC<Props> = ({ goToScreen }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
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

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "980572185774-4c22bkmqm894s8qeql9gu0ro25q6usgu.apps.googleusercontent.com",
    });
  }, []);

  // Password validator
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

  // Email/password submit
  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      showAlert("warning", "Missing Information", "Please fill in all fields.");
      return;
    }

    try {
      if (isRegister) {
        const reqs = validatePassword(form.password);
        const allPassed = Object.values(reqs).every((v) => v);
        if (!allPassed) {
          showAlert(
            "error",
            "Weak Password",
            "Password does not meet all security requirements."
          );
          return;
        }
        if (form.password !== form.confirm) {
          showAlert(
            "error",
            "Password Mismatch",
            "Passwords do not match. Please try again."
          );
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
          role: "user",
        });

        showAlert(
          "success",
          "Account Created",
          "Your account has been created successfully!",
          () => {
            goToScreen("profileSetup", { uid: user.uid, email: user.email });
          }
        );
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );
        const user = userCredential.user;

        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (!userDoc.exists()) {
          showAlert(
            "error",
            "User Not Found",
            "No user record found in our system."
          );
          return;
        }

        const role = userDoc.data()?.role?.toLowerCase?.() || "user";

        showAlert(
          "success",
          "Welcome Back",
          "You have successfully logged in!",
          () => {
            if (role === "admin") {
              goToScreen("adminDashb");
            } else if (role === "seller") {
              goToScreen("SellerPart"); // 👈 route to your seller screen
            } else {
              goToScreen("home");
            }
          }
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.code === "auth/user-not-found"
          ? "No account found with this email."
          : error.code === "auth/wrong-password"
          ? "Incorrect password. Please try again."
          : error.code === "auth/email-already-in-use"
          ? "This email is already registered."
          : error.message;

      showAlert("error", "Authentication Error", errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { idToken, accessToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        showAlert(
          "error",
          "Google Sign-In Failed",
          "No authentication token received."
        );
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

      showAlert(
        "success",
        "Welcome",
        "Successfully signed in with Google!",
        () => {
          if (role === "admin") {
            goToScreen("adminDashb");
          } else if (role === "seller") {
            goToScreen("SellerPart"); // 👈 route seller to SellerPart
          } else {
            goToScreen("home");
          }
        }
      );
    } catch (error: any) {
      showAlert(
        "error",
        "Google Sign-In Error",
        error.message || "Failed to sign in with Google."
      );
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    if (!form.email) {
      showAlert(
        "warning",
        "Email Required",
        "Please enter your email address first."
      );
      return;
    }
    try {
      await sendPasswordResetEmail(auth, form.email);
      showAlert(
        "success",
        "Email Sent",
        "A password reset link has been sent to your email address."
      );
    } catch (error: any) {
      showAlert(
        "error",
        "Reset Failed",
        error.message || "Failed to send reset email."
      );
    }
  };

  const getPasswordStrength = () => {
    if (form.password.length === 0) return null;
    const reqs = validatePassword(form.password);
    const passed = Object.values(reqs).filter((v) => v).length;
    const total = Object.values(reqs).length;
    const percentage = (passed / total) * 100;

    if (percentage < 40) return { label: "Weak", color: colors.error };
    if (percentage < 70) return { label: "Fair", color: "#FFA500" };
    if (percentage < 100) return { label: "Good", color: "#FFD700" };
    return { label: "Strong", color: colors.success };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
        />

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

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => goToScreen("home")}
            style={styles.backButton}
          >
            <Text style={[styles.backIcon, { color: colors.textPrimary }]}>
              ←
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {isRegister ? "Create Account" : "Welcome Back"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isRegister ? "Sign up to get started" : "Sign in to continue"}
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.formCard, { backgroundColor: colors.cardBg }]}>
            {isRegister && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
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
                  placeholder="Choose a username"
                  placeholderTextColor={colors.textSecondary}
                  value={form.username}
                  onChangeText={(text) => setForm({ ...form, username: text })}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Email Address
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
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Password
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
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
              />

              {/* Password Strength Indicator */}
              {isRegister && passwordStrength && (
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
                              validatePassword(form.password)
                            ).filter((v) => v).length /
                              7) *
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

            {/* Password Requirements */}
            {isRegister && form.password.length > 0 && (
              <View
                style={[
                  styles.requirementsCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.requirementsTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  Password Requirements:
                </Text>
                {Object.entries(validatePassword(form.password)).map(
                  ([key, met]) => (
                    <View key={key} style={styles.requirementRow}>
                      <Text
                        style={[
                          styles.requirementIcon,
                          { color: met ? colors.success : colors.error },
                        ]}
                      >
                        {met ? "✓" : "✕"}
                      </Text>
                      <Text
                        style={[
                          styles.requirementText,
                          {
                            color: met
                              ? colors.textPrimary
                              : colors.textSecondary,
                          },
                        ]}
                      >
                        {key === "upperLower"
                          ? "Uppercase & lowercase letters"
                          : key === "length"
                          ? "At least 8 characters"
                          : key === "number"
                          ? "At least one number"
                          : key === "special"
                          ? "Special character (!@#$%^&*)"
                          : key === "noSpaces"
                          ? "No spaces"
                          : key === "noRepeats"
                          ? "No repeating characters"
                          : "No common sequences"}
                      </Text>
                    </View>
                  )
                )}
              </View>
            )}

            {isRegister && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Confirm Password
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
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                  value={form.confirm}
                  onChangeText={(text) => setForm({ ...form, confirm: text })}
                />
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                {isRegister ? "Create Account" : "Sign In"}
              </Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            {!isRegister && (
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotButton}
              >
                <Text style={[styles.forgotText, { color: colors.accent }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
              <Text
                style={[styles.dividerText, { color: colors.textSecondary }]}
              >
                OR
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity
              style={[styles.googleButton, { borderColor: colors.border }]}
              onPress={handleGoogleLogin}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleText, { color: colors.textPrimary }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Toggle Login/Register */}
            <TouchableOpacity
              onPress={() => setIsRegister((prev) => !prev)}
              style={styles.toggleButton}
            >
              <Text
                style={[styles.toggleText, { color: colors.textSecondary }]}
              >
                {isRegister
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <Text style={[styles.toggleLink, { color: colors.primary }]}>
                  {isRegister ? "Sign In" : "Sign Up"}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 28,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  formCard: {
    borderRadius: 16,
    padding: 24,
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  requirementsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  requirementIcon: {
    fontSize: 14,
    fontWeight: "700",
    marginRight: 8,
    width: 16,
  },
  requirementText: {
    fontSize: 13,
    flex: 1,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  forgotButton: {
    alignItems: "center",
    marginTop: 16,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 12,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: "700",
    color: "#DB4437",
  },
  googleText: {
    fontSize: 15,
    fontWeight: "600",
  },
  toggleButton: {
    marginTop: 24,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 14,
  },
  toggleLink: {
    fontWeight: "700",
  },
});

export default LRegScreen;
