import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";

interface CustomAlertProps {
  visible: boolean;
  type?: "success" | "error" | "warning" | "info" | "question";
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type = "info",
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showCancel = false,
}) => {
  const colors = {
    primary: "#2D2416",
    accent: "#D4A574",
    success: "#4CAF50",
    error: "#FF3B30",
    warning: "#FFC107",
    info: "#2196F3",
    background: "#FFFFFF",
    textPrimary: "#1A1A1A",
    textSecondary: "#6B6B6B",
  };

  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return { icon: "✓", color: colors.success, bg: "#E8F5E9" };
      case "error":
        return { icon: "✕", color: colors.error, bg: "#FFEBEE" };
      case "warning":
        return { icon: "⚠", color: colors.warning, bg: "#FFF3E0" };
      case "question":
        return { icon: "?", color: colors.info, bg: "#E3F2FD" };
      default:
        return { icon: "i", color: colors.info, bg: "#E3F2FD" };
    }
  };

  const { icon, color, bg } = getIconAndColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel || onConfirm}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.alertContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Icon Circle */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: bg, borderColor: color },
            ]}
          >
            <Text style={[styles.iconText, { color }]}>{icon}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {showCancel && onCancel && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  { borderColor: colors.textSecondary },
                ]}
                onPress={onCancel}
              >
                <Text
                  style={[styles.buttonText, { color: colors.textSecondary }]}
                >
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: color },
                !showCancel && { flex: 1 },
              ]}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertContainer: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  iconText: {
    fontSize: 40,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  confirmButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CustomAlert;
