import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

interface FormValues {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface FormErrors {
    fullName?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

function validate(values: FormValues): FormErrors {
    const errors: FormErrors = {};

    if (!values.fullName.trim()) {
        errors.fullName = "Full name is required!";
    }

    if (!values.username.trim()) {
        errors.username = "Username is required!";
    } else if (values.username.trim().length < 3) {
        errors.username = "Username must be at least 3 characters.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(values.username)) {
        errors.username = "Username can only contain letters, numbers, and underscores.";
    }

    if (!values.email.trim()) {
        errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = "Enter a valid email address.";
    }

    if (!values.password) {
        errors.password = "Password is required.";
    } else if (values.password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
    }

    if (!values.confirmPassword) {
        errors.confirmPassword = "Please confirm your password.";
    } else if (values.password !== values.confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
    }

    return errors;
}

export default function SignUpScreen() {
    const router = useRouter()

    const [values, setValues] = useState<FormValues>({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);

    function handleChange(field: keyof FormValues, text: string) {
        setValues((prev) => ({ ...prev, [field]: text }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    async function handleSignUp() {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true)

        try {
            // TODO: Call the backend to register a user
            router.replace("/(auth)/signin");
        } catch (error) {
            Alert.alert("Sign Up Failed", "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Set up your Task Manager account</Text>

        {/* Full Name */}
        <Text style={styles.label}>Full Name</Text>
        <TextInput
            style={[styles.input, errors.fullName ? styles.inputError : null]}
            placeholder="Enter your full name"
            autoCorrect={false}
            value={values.fullName}
            onChangeText={(text) => handleChange("fullName", text)}
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

        {/* Username */}
        <Text style={styles.label}>Username</Text>
        <TextInput
            style={[styles.input, errors.username ? styles.inputError : null]}
            placeholder="Choose a username"
            autoCapitalize="none"
            autoCorrect={false}
            value={values.username}
            onChangeText={(text) => handleChange("username", text)}
        />
        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            placeholder="Enter your email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={values.email}
            onChangeText={(text) => handleChange("email", text)}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput
            style={[styles.input, errors.password ? styles.inputError : null]}
            placeholder="Create a password"
            secureTextEntry
            value={values.password}
            onChangeText={(text) => handleChange("password", text)}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        {/* Confirm Password */}
        <Text style={styles.label}>Re-enter Password</Text>
        <TextInput
            style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
            placeholder="Confirm your password"
            secureTextEntry
            value={values.confirmPassword}
            onChangeText={(text) => handleChange("confirmPassword", text)}
            onSubmitEditing={handleSignUp}
        />
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
            {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        {/* Navigate back to Sign In */}
        <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
        </ScrollView>
    );
}

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