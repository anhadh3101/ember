import React, { useState } from "react";
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
import { supabase } from "@/lib/supabase";
import { globalStyles, Palette, Spacing, FontSize, Radii } from "@/constants/styles";
import { useAuthContext } from "@/hooks/use-auth-context";

export default function ResetPasswordScreen() {
    const { needsPasswordReset: ready } = useAuthContext();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string | undefined>();
    const [confirmError, setConfirmError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    function validateAndSubmit() {
        let valid = true;
        if (!password) {
            setPasswordError("Password is required.");
            valid = false;
        } else if (password.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            valid = false;
        } else {
            setPasswordError(undefined);
        }

        if (!confirmPassword) {
            setConfirmError("Please confirm your password.");
            valid = false;
        } else if (password !== confirmPassword) {
            setConfirmError("Passwords do not match.");
            valid = false;
        } else {
            setConfirmError(undefined);
        }

        if (valid) handleReset();
    }

    async function handleReset() {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setDone(true);
        } catch (error) {
            console.error(`Error updating password: \n${error}`);
            Alert.alert("Error", "Could not update password. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <ScrollView contentContainerStyle={globalStyles.screenCenter} keyboardShouldPersistTaps="handled">
                <View style={styles.iconWrap}>
                    <Ionicons name="checkmark-circle-outline" size={40} color={Palette.success} />
                </View>
                <Text style={globalStyles.pageTitle}>Password updated!</Text>
                <Text style={styles.hint}>
                    Your password has been reset successfully.{"\n"}You can now sign in with your new password.
                </Text>
            </ScrollView>
        );
    }

    if (!ready) {
        return (
            <View style={globalStyles.screenCenter}>
                <ActivityIndicator size="large" color={Palette.primary} />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={globalStyles.screenCenter} keyboardShouldPersistTaps="handled">
            <View style={styles.iconWrap}>
                <Ionicons name="lock-open-outline" size={40} color={Palette.primary} />
            </View>

            <Text style={globalStyles.pageTitle}>Set new password</Text>
            <Text style={styles.hint}>Choose a strong password for your account.</Text>

            <Text style={globalStyles.formLabel}>New Password</Text>
            <TextInput
                style={[globalStyles.input, styles.fullWidth, passwordError ? globalStyles.inputError : null]}
                placeholder="Enter new password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError(undefined);
                }}
            />
            {passwordError && <Text style={globalStyles.errorText}>{passwordError}</Text>}

            <Text style={[globalStyles.formLabel, styles.confirmLabel]}>Confirm Password</Text>
            <TextInput
                style={[globalStyles.input, styles.fullWidth, confirmError ? globalStyles.inputError : null]}
                placeholder="Confirm new password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={confirmPassword}
                onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmError) setConfirmError(undefined);
                }}
                onSubmitEditing={validateAndSubmit}
                returnKeyType="done"
            />
            {confirmError && <Text style={globalStyles.errorText}>{confirmError}</Text>}

            <TouchableOpacity
                style={[globalStyles.btn, styles.fullWidth, styles.submitBtn]}
                onPress={validateAndSubmit}
                disabled={loading}
            >
                {loading
                    ? <ActivityIndicator color={Palette.white} />
                    : <Text style={globalStyles.btnText}>Update Password</Text>
                }
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
    fullWidth: {
        alignSelf: "stretch",
    },
    confirmLabel: {
        marginTop: Spacing.lg,
    },
    submitBtn: {
        marginTop: Spacing.lg,
    },
});
