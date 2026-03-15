import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { globalStyles, Palette, Spacing, FontSize, FontWeight, Radii } from "@/constants/styles";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    function handleChange(text: string) {
        setEmail(text);
        if (emailError) setEmailError(undefined);
    }

    async function handleSend() {
        const cleanEmail: string = email.trim();
        if (!email.trim()) {
            setEmailError("Email is required!");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth
                .resetPasswordForEmail(cleanEmail, {
                    redirectTo: "exp://192.168.1.86:8081/*emberios://(auth)/resetPassword",
                });

            if (error) throw error;
            setSent(true);
        } catch (error) {
            console.error(`Error sending password reset email: \n${error}`);
            Alert.alert("Error", "Could not send password reset email. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (sent) {
        return (
            <ScrollView contentContainerStyle={globalStyles.screenCenter} keyboardShouldPersistTaps="handled">
                <View style={styles.iconWrap}>
                    <Ionicons name="mail-outline" size={40} color={Palette.primary} />
                </View>
                <Text style={globalStyles.pageTitle}>Check your inbox</Text>
                <Text style={styles.hint}>
                    We sent a password reset link to{"\n"}
                    <Text style={styles.emailHighlight}>{email}</Text>
                </Text>
                <TouchableOpacity style={[globalStyles.btn, styles.fullWidth]} onPress={() => router.back()}>
                    <Text style={globalStyles.btnText}>Back to Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSent(false)}>
                    <Text style={globalStyles.centeredLink}>Resend email</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    return (
        <ScrollView contentContainerStyle={globalStyles.screenCenter} keyboardShouldPersistTaps="handled">
            <View style={styles.iconWrap}>
                <Ionicons name="lock-closed-outline" size={40} color={Palette.primary} />
            </View>

            <Text style={globalStyles.pageTitle}>Forgot password?</Text>
            <Text style={styles.hint}>
                Enter your email and we&apos;ll send you a link to reset your password.
            </Text>

            <Text style={globalStyles.formLabel}>Email</Text>
            <TextInput
                style={[globalStyles.input, styles.fullWidth, emailError ? globalStyles.inputError : null]}
                placeholder="Enter your email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={handleChange}
                onSubmitEditing={handleSend}
                returnKeyType="send"
            />
            {emailError && <Text style={globalStyles.errorText}>{emailError}</Text>}

            <TouchableOpacity
                style={[globalStyles.btn, styles.fullWidth, styles.sendBtn]}
                onPress={handleSend}
                disabled={loading}
            >
                {loading
                    ? <ActivityIndicator color={Palette.white} />
                    : <Text style={globalStyles.btnText}>Send Reset Link</Text>
                }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
                <Text style={globalStyles.centeredLink}>Back to Sign In</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: Radii.full,
        backgroundColor: "#f3ebff",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.xl,
    },
    hint: {
        fontSize: FontSize.sm,
        color: Palette.textSubtle,
        textAlign: "center",
        marginBottom: Spacing.xl,
        lineHeight: 20,
    },
    emailHighlight: {
        color: Palette.text,
        fontWeight: FontWeight.semibold,
    },
    fullWidth: {
        alignSelf: "stretch",
    },
    sendBtn: {
        marginTop: Spacing.lg,
    },
});
