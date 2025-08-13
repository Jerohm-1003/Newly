import React from "react";
import { Linking, Button, View, StyleSheet } from "react-native";
import type { Screen } from "./App"; // Adjust path if needed

interface OpenArProps {
  goBack: () => void;
  goToScreen: (screen: Screen, params?: any) => void;
}
const OpenAR: React.FC<OpenArProps> = ({ goBack, goToScreen }) => {
  // Open Unity app via deep link
  const openUnity = () => {
    Linking.openURL("arfurniture://start"); // Matches Unity deep link scheme
  };

  return (
    <View style={styles.container}>
      <Button title="Open AR Furniture" onPress={openUnity} />
      <Button title="Go Back" onPress={goBack} />
      <Button title="Go to Home Screen" onPress={() => goToScreen("home")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
export default OpenAR;
