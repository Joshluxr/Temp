import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Kita mobile — placeholder. No live transfers, no providers.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  text: {
    color: "#11181c",
    fontSize: 16,
    textAlign: "center",
  },
});
