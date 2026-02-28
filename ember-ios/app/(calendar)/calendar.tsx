import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarScreen() {
    const router = useRouter();
    const today = new Date();

    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    function prevMonth() {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
        else setViewMonth(m => m - 1);
    }

    function nextMonth() {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
        else setViewMonth(m => m + 1);
    }

    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    const cells: (number | null)[] = [
        ...Array(firstDayOfWeek).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

    return (
        <SafeAreaView style={s.safe}>
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#3b82f6" />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Calendar</Text>
                    <View style={{ width: 34 }} />
                </View>

                {/* Month navigation */}
                <View style={s.monthNav}>
                    <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
                        <Ionicons name="chevron-back" size={22} color="#111" />
                    </TouchableOpacity>
                    <Text style={s.monthTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
                    <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
                        <Ionicons name="chevron-forward" size={22} color="#111" />
                    </TouchableOpacity>
                </View>

                {/* Day-of-week labels */}
                <View style={s.dayLabelsRow}>
                    {DAY_LABELS.map(d => (
                        <Text key={d} style={s.dayLabel}>{d}</Text>
                    ))}
                </View>

                {/* Calendar grid */}
                <View style={s.grid}>
                    {weeks.map((week, wi) => (
                        <View key={wi} style={s.week}>
                            {week.map((day, di) => {
                                if (day === null) return <View key={`e-${wi}-${di}`} style={s.cell} />;

                                const dateStr = `${viewYear}-${viewMonth}-${day}`;
                                const isToday = dateStr === todayStr;

                                return (
                                    <View key={dateStr} style={[s.cell, isToday && s.cellToday]}>
                                        <Text style={[s.cellText, isToday && s.cellTextToday]}>{day}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#fff' },
    scroll: { padding: 20, paddingBottom: 48 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backBtn: { padding: 6 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111' },

    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    navBtn: { padding: 6 },
    monthTitle: { fontSize: 17, fontWeight: '700', color: '#111' },

    dayLabelsRow: { flexDirection: 'row', marginBottom: 4 },
    dayLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: '#aaa',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    grid: {},
    week: { flexDirection: 'row' },
    cell: {
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        margin: 2,
    },
    cellToday: { backgroundColor: '#3b82f6' },
    cellText: { fontSize: 14, color: '#111', fontWeight: '500' },
    cellTextToday: { color: '#fff', fontWeight: '700' },
});
