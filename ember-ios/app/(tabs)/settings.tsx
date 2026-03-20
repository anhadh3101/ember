import { View, Text, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { BarChart } from 'react-native-gifted-charts';
import SignOutButton from '@/components/social-auth-buttons/sign-out-button';
import { globalStyles, Palette, Spacing, FontSize } from '@/constants/styles';
import { useAuthContext } from '@/hooks/use-auth-context';
import { supabase } from '@/lib/supabase';

type AnalyticsTask = {
    status: string;
    category: string;
    priority: string;
    due_date: string;
};

const CATEGORY_COLORS: Record<string, string> = {
    PERSONAL: '#6366f1',
    WORK: '#f59e0b',
    FITNESS: '#22c55e',
};
const PRIORITY_COLORS: Record<string, string> = {
    HIGH: '#ef4444',
    MEDIUM: '#f59e0b',
    LOW: '#22c55e',
};

type BreakdownEntry = { label: string; total: number; completed: number; color: string };

// This function computes the breakdown of tasks by category or priority.
function computeBreakdown(tasks: AnalyticsTask[], key: 'category' | 'priority', colorMap: Record<string, string>): BreakdownEntry[] {
    const map: Record<string, { total: number; completed: number }> = {};
    for (const t of tasks) {
        if (!map[t[key]]) map[t[key]] = { total: 0, completed: 0 };
        map[t[key]].total++;
        if (t.status === 'COMPLETED') map[t[key]].completed++;
    }
    return Object.entries(map).map(([label, c]) => ({ label, ...c, color: colorMap[label] ?? '#aaa' }));
}

// This function computes the number of tasks completed in the last 7 days.
function computeLast7Days(tasks: AnalyticsTask[]): { label: string; completed: number }[] {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return {
            label: d.toLocaleDateString('en-US', { weekday: 'short' }),
            completed: tasks.filter(t => t.due_date === iso && t.status === 'COMPLETED').length,
        };
    });
}

// This component renders a row in the breakdown table.
function BreakdownRow({ entry }: { entry: BreakdownEntry }) {
    const pct = entry.total === 0 ? 0 : entry.completed / entry.total;
    return (
        <View style={{ marginBottom: Spacing.md }}>
            <View style={globalStyles.legendRow}>
                <View style={globalStyles.legendLeft}>
                    <View style={[globalStyles.legendDot, { backgroundColor: entry.color }]} />
                    <Text style={globalStyles.legendLabel}>
                        {entry.label.charAt(0) + entry.label.slice(1).toLowerCase()}
                    </Text>
                </View>
                <Text style={globalStyles.legendCount}>{entry.completed}/{entry.total}</Text>
            </View>
            <View style={globalStyles.progressBarTrack}>
                <View style={[globalStyles.progressBarFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: entry.color }]} />
            </View>
        </View>
    );
}

export default function SettingsScreen() {
    const { session, profile } = useAuthContext();

    // Adjust the width of the chart to fit the screen
    let { width } = useWindowDimensions() as { width: number };
    width -= 35;
    const yAxisWidth = 35;
    const chartWidth = width - Spacing.xl * 2 - Spacing.lg * 2 - yAxisWidth;

    // Fields to be dispalyed
    const email = session?.user.email ?? '';
    const fullName = profile?.full_name ?? '';
    const username = profile?.username ?? '';
    const initials = fullName ? fullName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();
    const memberSince = session?.user.created_at
        ? new Date(session.user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '—';
    const lastSignIn = session?.user.last_sign_in_at
        ? new Date(session.user.last_sign_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';
    const shortId = session?.user.id?.slice(0, 8).toUpperCase() ?? '—';

    const [analyticsTasks, setAnalyticsTasks] = useState<AnalyticsTask[]>([]);

    /**
     * Fetch the task data for a user to create analytics.
     */
    async function fetchAnalytics() {
        if (!session?.user.id) return;
        const { data } = await supabase
            .from('tasks')
            .select('status, category, priority, due_date')
            .eq('user_id', session.user.id);
        setAnalyticsTasks(data ?? []);
    }

    useFocusEffect(useCallback(() => { fetchAnalytics(); }, [session]));

    const total = analyticsTasks.length;
    const completed = analyticsTasks.filter(t => t.status === 'COMPLETED').length;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
    const categoryBreakdown = computeBreakdown(analyticsTasks, 'category', CATEGORY_COLORS);
    const priorityBreakdown = computeBreakdown(analyticsTasks, 'priority', PRIORITY_COLORS);
    const barData = computeLast7Days(analyticsTasks).map(d => ({
        value: d.completed,
        label: d.label,
        frontColor: Palette.primary,
    }));

    return (
        <SafeAreaView style={globalStyles.safe}>
        <ScrollView style={globalStyles.flex1} contentContainerStyle={globalStyles.formScroll}>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={globalStyles.pageTitle}>Settings</Text>
                <SignOutButton />
            </View>

            {/* Avatar + name */}
            <View style={globalStyles.settingsAvatarSection}>
                <View style={globalStyles.settingsAvatar}>
                    <Text style={globalStyles.settingsAvatarInitial}>{initials}</Text>
                </View>
                {fullName ? <Text style={globalStyles.settingsEmailText}>{fullName}</Text> : null}
                {username ? <Text style={globalStyles.settingsMemberText}>{username}</Text> : null}
                <Text style={globalStyles.settingsMemberText}>Member since {memberSince}</Text>
            </View>

            {/* Info card */}
            <View style={globalStyles.settingsInfoCard}>

                {/* Full Name */}
                {fullName ? (
                    <>
                        <View style={globalStyles.settingsInfoRow}>
                            <Text style={globalStyles.settingsInfoLabel}>Full Name</Text>
                            <Text style={globalStyles.settingsInfoValue}>{fullName}</Text>
                        </View>
                        <View style={globalStyles.settingsDivider} />
                    </>
                ) : null}

                {/* Username */}
                {username ? (
                    <>
                        <View style={globalStyles.settingsInfoRow}>
                            <Text style={globalStyles.settingsInfoLabel}>Username</Text>
                            <Text style={globalStyles.settingsInfoValue}>{username}</Text>
                        </View>
                        <View style={globalStyles.settingsDivider} />
                    </>
                ) : null}

                {/* Email */}
                <View style={globalStyles.settingsInfoRow}>
                    <Text style={globalStyles.settingsInfoLabel}>Email</Text>
                    <Text style={globalStyles.settingsInfoValue} numberOfLines={1}>{email}</Text>
                </View>
                <View style={globalStyles.settingsDivider} />

                {/* User ID */}
                <View style={globalStyles.settingsInfoRow}>
                    <Text style={globalStyles.settingsInfoLabel}>Account ID</Text>
                    <Text style={[globalStyles.settingsInfoValue, globalStyles.settingsInfoValueMono]}>{shortId}</Text>
                </View>
            </View>

            {/* Progress / Analytics */}
            {total > 0 && (
                <>
                    <View style={globalStyles.analyticsSection}>
                        <Text style={globalStyles.analyticsSectionTitle}>Progress</Text>
                    </View>

                    {/* Stat tiles */}
                    <View style={globalStyles.statGrid}>
                        <View style={globalStyles.statCard}>
                            <Text style={globalStyles.statValue}>{completionRate}%</Text>
                            <Text style={globalStyles.statLabel}>Completion Rate</Text>
                        </View>
                        <View style={globalStyles.statCard}>
                            <Text style={globalStyles.statValue}>{total}</Text>
                            <Text style={globalStyles.statLabel}>Total Tasks</Text>
                        </View>
                        <View style={globalStyles.statCard}>
                            <Text style={globalStyles.statValue}>{completed}</Text>
                            <Text style={globalStyles.statLabel}>Completed</Text>
                        </View>
                        <View style={globalStyles.statCard}>
                            <Text style={globalStyles.statValue}>{total - completed}</Text>
                            <Text style={globalStyles.statLabel}>Remaining</Text>
                        </View>
                    </View>

                    {/* 7-day bar chart */}
                    <View style={globalStyles.chartCard}>
                        <Text style={[globalStyles.analyticsSectionTitle, { marginBottom: Spacing.md }]}>Last 7 Days</Text>
                        <BarChart
                            data={barData}
                            width={chartWidth}
                            yAxisLabelWidth={yAxisWidth}
                            barWidth={28}
                            spacing={12}
                            roundedTop
                            noOfSections={4}
                            hideRules
                            isAnimated
                            yAxisTextStyle={{ color: Palette.textMuted, fontSize: 11 }}
                            xAxisLabelTextStyle={{ color: Palette.textMuted, fontSize: 11 }}
                        />
                        <Text style={{ fontSize: FontSize.xs, color: Palette.textMuted, marginTop: Spacing.sm }}>
                            Tasks completed by due date
                        </Text>
                    </View>

                    {/* Category breakdown */}
                    <View style={globalStyles.chartCard}>
                        <Text style={[globalStyles.analyticsSectionTitle, { marginBottom: Spacing.md }]}>By Category</Text>
                        {categoryBreakdown.map(e => <BreakdownRow key={e.label} entry={e} />)}
                    </View>

                    {/* Priority breakdown */}
                    <View style={globalStyles.chartCard}>
                        <Text style={[globalStyles.analyticsSectionTitle, { marginBottom: Spacing.md }]}>By Priority</Text>
                        {priorityBreakdown.map(e => <BreakdownRow key={e.label} entry={e} />)}
                    </View>
                </>
            )}


        </ScrollView>
        </SafeAreaView>
    );
}
