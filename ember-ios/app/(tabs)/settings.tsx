import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import SignOutButton from '@/components/social-auth-buttons/sign-out-button';
import { globalStyles } from '@/constants/styles';
import { useAuthContext } from '@/hooks/use-auth-context';

export default function SettingsScreen() {
    const { session } = useAuthContext();

    const email = session?.user.email ?? '';
    const initials = email.charAt(0).toUpperCase();
    const memberSince = session?.user.created_at
        ? new Date(session.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '—';
    const lastSignIn = session?.user.last_sign_in_at
        ? new Date(session.user.last_sign_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';
    const shortId = session?.user.id?.slice(0, 8).toUpperCase() ?? '—';

    return (
        <SafeAreaView style={globalStyles.safe}>
        <ScrollView style={globalStyles.flex1} contentContainerStyle={globalStyles.formScroll}>

            <Text style={globalStyles.pageTitle}>Settings</Text>

            {/* Avatar + email */}
            <View style={globalStyles.settingsAvatarSection}>
                <View style={globalStyles.settingsAvatar}>
                    <Text style={globalStyles.settingsAvatarInitial}>{initials}</Text>
                </View>
                <Text style={globalStyles.settingsEmailText}>{email}</Text>
                <Text style={globalStyles.settingsMemberText}>Member since {memberSince}</Text>
            </View>

            {/* Info card */}
            <View style={globalStyles.settingsInfoCard}>
                <View style={globalStyles.settingsInfoRow}>
                    <Text style={globalStyles.settingsInfoLabel}>Email</Text>
                    <Text style={globalStyles.settingsInfoValue} numberOfLines={1}>{email}</Text>
                </View>
                <View style={globalStyles.settingsDivider} />
                <View style={globalStyles.settingsInfoRow}>
                    <Text style={globalStyles.settingsInfoLabel}>Last sign-in</Text>
                    <Text style={globalStyles.settingsInfoValue}>{lastSignIn}</Text>
                </View>
                <View style={globalStyles.settingsDivider} />
                <View style={globalStyles.settingsInfoRow}>
                    <Text style={globalStyles.settingsInfoLabel}>Account ID</Text>
                    <Text style={[globalStyles.settingsInfoValue, globalStyles.settingsInfoValueMono]}>{shortId}</Text>
                </View>
            </View>

            <SignOutButton />

        </ScrollView>
        </SafeAreaView>
    );
}
