import React, { useState } from "react";
import {
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { globalStyles, Palette } from "@/constants/styles";

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
            await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    data: {
                        email: values.email,
                        full_name: values.fullName,
                        username: values.username
                    }
                }
            });
            router.replace("/(auth)/signin");
        } catch (error) {
            Alert.alert("Sign Up Failed", "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <ScrollView contentContainerStyle={globalStyles.screenCenter} keyboardShouldPersistTaps="handled">
        <Text style={globalStyles.pageTitle}>Create Account</Text>
        <Text style={globalStyles.subtitle}>Set up your Task Manager account</Text>

        {/* Full Name */}
        <Text style={globalStyles.formLabel}>Full Name</Text>
        <TextInput
            style={[globalStyles.input, errors.fullName ? globalStyles.inputError : null]}
            placeholder="Enter your full name"
            autoCorrect={false}
            value={values.fullName}
            onChangeText={(text) => handleChange("fullName", text)}
        />
        {errors.fullName && <Text style={globalStyles.errorText}>{errors.fullName}</Text>}

        {/* Username */}
        <Text style={globalStyles.formLabel}>Username</Text>
        <TextInput
            style={[globalStyles.input, errors.username ? globalStyles.inputError : null]}
            placeholder="Choose a username"
            autoCapitalize="none"
            autoCorrect={false}
            value={values.username}
            onChangeText={(text) => handleChange("username", text)}
        />
        {errors.username && <Text style={globalStyles.errorText}>{errors.username}</Text>}

        {/* Email */}
        <Text style={globalStyles.formLabel}>Email</Text>
        <TextInput
            style={[globalStyles.input, errors.email ? globalStyles.inputError : null]}
            placeholder="Enter your email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={values.email}
            onChangeText={(text) => handleChange("email", text)}
        />
        {errors.email && <Text style={globalStyles.errorText}>{errors.email}</Text>}

        {/* Password */}
        <Text style={globalStyles.formLabel}>Password</Text>
        <TextInput
            style={[globalStyles.input, errors.password ? globalStyles.inputError : null]}
            placeholder="Create a password"
            secureTextEntry
            value={values.password}
            onChangeText={(text) => handleChange("password", text)}
        />
        {errors.password && <Text style={globalStyles.errorText}>{errors.password}</Text>}

        {/* Confirm Password */}
        <Text style={globalStyles.formLabel}>Re-enter Password</Text>
        <TextInput
            style={[globalStyles.input, errors.confirmPassword ? globalStyles.inputError : null]}
            placeholder="Confirm your password"
            secureTextEntry
            value={values.confirmPassword}
            onChangeText={(text) => handleChange("confirmPassword", text)}
            onSubmitEditing={handleSignUp}
        />
        {errors.confirmPassword && <Text style={globalStyles.errorText}>{errors.confirmPassword}</Text>}

        {/* Sign Up Button */}
        <TouchableOpacity style={globalStyles.btn} onPress={handleSignUp} disabled={loading}>
            {loading
            ? <ActivityIndicator color={Palette.white} />
            : <Text style={globalStyles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        {/* Navigate back to Sign In */}
        <TouchableOpacity onPress={() => router.back()}>
            <Text style={globalStyles.centeredLink}>Already have an account? Sign In</Text>
        </TouchableOpacity>
        </ScrollView>
    );
}
