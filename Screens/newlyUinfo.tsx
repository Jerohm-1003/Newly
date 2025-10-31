import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from "react-native";

interface Props {
  onDone: () => void;
}

const steps = [
  {
    title: "Visualize Before You Buy",
    text: "Experience furniture in your space using AR view. Shop smarter with confidence and style.",
    image: require("../assets/cart_icon.png"),
  },
  {
    title: "Try it in AR",
    text: "Visualize items in your space before you buy. No more surprises!",
    image: require("../assets/cart_icon.png"),
  },
  {
    title: "Shop with Confidence",
    text: "Enjoy a seamless experience from AR try-on to checkout.",
    image: require("../assets/cart_icon.png"),
  },
];

const IntroFlow: React.FC<Props> = ({ onDone }) => {
  const [showLoading, setShowLoading] = useState(true);
  const [progress] = useState(new Animated.Value(0));
  const [step, setStep] = useState<number>(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Run loading bar animation
  useEffect(() => {
    if (showLoading) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start(() => {
        setShowLoading(false); // after loading, show intro
        fadeIn();
      });
    }
  }, [showLoading]);

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const next = () => {
    if (step < steps.length - 1) {
      fadeAnim.setValue(0);
      setStep((prev) => prev + 1);
      fadeIn();
    } else {
      onDone(); // proceed to home
    }
  };

  const BAR_WIDTH = 300;
  const ICON_SIZE = 30;

  const iconTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_WIDTH - ICON_SIZE],
  });

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_WIDTH - ICON_SIZE],
  });

  if (showLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={[styles.progressBarContainer, { width: BAR_WIDTH }]}>
          <Animated.View style={[styles.progressBar, { width: barWidth }]} />
          <Animated.Image
            source={require("../assets/cart_icon.png")}
            style={[
              styles.cartIcon,
              { transform: [{ translateX: iconTranslateX }] },
            ]}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  }

  const { title, text, image } = steps[step];

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalBox, { opacity: fadeAnim }]}>
          <Image source={image} style={styles.image} resizeMode="contain" />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.text}>{text}</Text>
          <TouchableOpacity style={styles.button} onPress={next}>
            <Text style={styles.buttonText}>
              {step < steps.length - 1 ? "Next" : "Start"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default IntroFlow;

const styles = StyleSheet.create({
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    backgroundColor: "#D2C5B4",
    justifyContent: "center",
    alignItems: "center",
  },
  progressBarContainer: {
    height: 20,
    backgroundColor: "#F5E8D6",
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4D3B30",
    position: "absolute",
    left: 0,
    top: 0,
  },
  cartIcon: {
    width: 30,
    height: 30,
    position: "absolute",
    top: -5,
    left: 0,
  },

  // Intro modal styles
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#FFF8F0",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: "#3E2E22",
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    color: "#6B4F3B",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#C2A87B",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 16,
  },
});
