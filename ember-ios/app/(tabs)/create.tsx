import { View, Text } from "react-native"
import { StyleSheet } from 'react-native';

export default function CreateScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>Hi Anhadh</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: "center", padding: 24 },
    title: { fontSize: 28, fontWeight: "bold", marginBottom: 4 },
    subtitle: { fontSize: 14, color: "#666", marginBottom: 24 },
    label: { fontSize: 14, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 15 },
    inputError: { borderColor: "red" },
    errorText: { color: "red", fontSize: 12, marginBottom: 8 },
    button: { backgroundColor: "#4A90E2", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 8, marginBottom: 16 },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    linkText: { textAlign: "center", color: "#4A90E2" },
});