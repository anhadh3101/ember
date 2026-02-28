import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { globalStyles, Palette } from '@/constants/styles';

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
        <SafeAreaView style={globalStyles.safe}>
            <ScrollView contentContainerStyle={globalStyles.formScroll} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={globalStyles.calendarHeader}>
                    <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={globalStyles.calendarBackBtn}>
                        <Ionicons name="arrow-back" size={22} color={Palette.primary} />
                    </TouchableOpacity>
                    <Text style={globalStyles.calendarHeaderTitle}>Calendar</Text>
                    <View style={{ width: 34 }} />
                </View>

                {/* Month navigation */}
                <View style={globalStyles.monthNav}>
                    <TouchableOpacity onPress={prevMonth} style={globalStyles.navBtn}>
                        <Ionicons name="chevron-back" size={22} color={Palette.text} />
                    </TouchableOpacity>
                    <Text style={globalStyles.monthTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
                    <TouchableOpacity onPress={nextMonth} style={globalStyles.navBtn}>
                        <Ionicons name="chevron-forward" size={22} color={Palette.text} />
                    </TouchableOpacity>
                </View>

                {/* Day-of-week labels */}
                <View style={globalStyles.dayLabelsRow}>
                    {DAY_LABELS.map(d => (
                        <Text key={d} style={globalStyles.dayLabel}>{d}</Text>
                    ))}
                </View>

                {/* Calendar grid */}
                <View>
                    {weeks.map((week, wi) => (
                        <View key={wi} style={globalStyles.calendarWeek}>
                            {week.map((day, di) => {
                                if (day === null) return <View key={`e-${wi}-${di}`} style={globalStyles.calendarCell} />;

                                const dateStr = `${viewYear}-${viewMonth}-${day}`;
                                const isToday = dateStr === todayStr;

                                return (
                                    <View key={dateStr} style={[globalStyles.calendarCell, isToday && globalStyles.calendarCellToday]}>
                                        <Text style={[globalStyles.calendarCellText, isToday && globalStyles.calendarCellTextToday]}>{day}</Text>
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
