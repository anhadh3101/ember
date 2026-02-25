import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";

interface FormValues {
    email: string;
    password: string;
}

interface FormErrors {
    email?: string,
    password?: string
}

/**
 * Checks if the fields are valud or now
 * @param values The values in the fields
 * @returns Errors in the form with messages.
 */
function validate(values: FormValues): FormErrors {
    const errors: FormErrors = {}
    if (!values.email.trim()) errors.email = "Email is required!";
    if (!values.password) errors.password = "Password is required!";
    return errors;
}

export default function SignInScreen() {
    const router = useRouter()
    const [values, setValues] = useState<FormValues>({ email: '', password: '' });
    const [errors, setErrors] = useState<FormErrors>();
    const [loading, setLoading] = useState(false);

    function handleChange(field: keyof FormValues, text: string) {
        setValues((prev) => ({ ...prev, [field]: text }));
        if (errors && errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    async function handleSignIn() {
        // Check if email and password are valid or not
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true)
        try {
            // TODO: Request the backend to check credentials
            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password
            })
            
            if (error) {
                throw error;
            }
            router.replace("/(tabs)");
        } catch (error) {
            Alert.alert("Sign In Failed!", "Invalid email or password");
        } finally {
            setLoading(false)
        }
    }

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Sign In</Text>

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
            style={[styles.input, errors?.email ? styles.inputError : null]}
            placeholder="Enter your email"
            autoCapitalize="none"
            autoCorrect={false}
            value={values.email}
            onChangeText={(text) => handleChange("email", text)}
        />
        {errors?.email && <Text style={styles.errorText}>{errors.email}</Text>}

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput
            style={[styles.input, errors?.password ? styles.inputError : null]}
            placeholder="Enter your password"
            secureTextEntry
            value={values.password}
            onChangeText={(text) => handleChange("password", text)}
            onSubmitEditing={handleSignIn}
        />
        {errors?.password && <Text style={styles.errorText}>{errors.password}</Text>}

        {/* Sign In Button */}
        <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        {/* Navigate to Sign Up */}
        <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 24 },
    title: { fontSize: 28, fontWeight: "bold", marginBottom: 24 },
    label: { fontSize: 14, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 15 },
    inputError: { borderColor: "red" },
    errorText: { color: "red", fontSize: 12, marginBottom: 8 },
    button: { backgroundColor: "#4A90E2", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 8 },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    linkText: { textAlign: "center", color: "#4A90E2", marginTop: 16 },
});