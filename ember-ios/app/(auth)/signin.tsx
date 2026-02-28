import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { globalStyles, Palette } from "@/constants/styles";

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
            const { data: _data, error } = await supabase.auth.signInWithPassword({
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
        <View style={globalStyles.screenCenter}>
        <Text style={globalStyles.pageTitle}>Sign In</Text>

        {/* Email */}
        <Text style={globalStyles.formLabel}>Email</Text>
        <TextInput
            style={[globalStyles.input, errors?.email ? globalStyles.inputError : null]}
            placeholder="Enter your email"
            autoCapitalize="none"
            autoCorrect={false}
            value={values.email}
            onChangeText={(text) => handleChange("email", text)}
        />
        {errors?.email && <Text style={globalStyles.errorText}>{errors.email}</Text>}

        {/* Password */}
        <Text style={globalStyles.formLabel}>Password</Text>
        <TextInput
            style={[globalStyles.input, errors?.password ? globalStyles.inputError : null]}
            placeholder="Enter your password"
            secureTextEntry
            value={values.password}
            onChangeText={(text) => handleChange("password", text)}
            onSubmitEditing={handleSignIn}
        />
        {errors?.password && <Text style={globalStyles.errorText}>{errors.password}</Text>}

        {/* Sign In Button */}
        <TouchableOpacity style={globalStyles.btn} onPress={handleSignIn} disabled={loading}>
            {loading ? <ActivityIndicator color={Palette.white} /> : <Text style={globalStyles.btnText}>Sign In</Text>}
        </TouchableOpacity>

        {/* Navigate to Sign Up */}
        <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text style={globalStyles.centeredLink}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
        </View>
    );
}
