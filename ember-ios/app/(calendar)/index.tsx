import { useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { globalStyles, Palette, Spacing, FontSize, FontWeight } from '@/constants/styles';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Month list (2 years back → 3 years ahead) ───────────────────────────────

const YEARS_BACK = 2;
const YEARS_AHEAD = 3;
const _today = new Date();
const TODAY_STR = `${_today.getFullYear()}-${_today.getMonth()}-${_today.getDate()}`;

const MONTHS: { year: number; month: number }[] = [];
for (let y = _today.getFullYear() - YEARS_BACK; y <= _today.getFullYear() + YEARS_AHEAD; y++) {
    for (let m = 0; m < 12; m++) MONTHS.push({ year: y, month: m });
}

const CURRENT_MONTH_INDEX = MONTHS.findIndex(
    ({ year, month }) => year === _today.getFullYear() && month === _today.getMonth()
);

// ─── Pre-compute item heights for getItemLayout ───────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = Spacing.xl * 2;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - H_PADDING) / 7);
const WEEK_ROW_H = CELL_SIZE + 4;
const MONTH_HEADER_H = 58;
const DAY_LABELS_H = 32;
const MONTH_BOTTOM_H = 24;

function weeksInMonth(year: number, month: number): number {
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return Math.ceil((firstDay + days) / 7);
}

const ITEM_HEIGHTS = MONTHS.map(
    ({ year, month }) => MONTH_HEADER_H + DAY_LABELS_H + weeksInMonth(year, month) * WEEK_ROW_H + MONTH_BOTTOM_H
);
const ITEM_OFFSETS = ITEM_HEIGHTS.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + ITEM_HEIGHTS[i - 1]);
    return acc;
}, []);


/**
 * This function contains the logic to render a month block for the calendar page.
 */
function MonthBlock({ year, month, onDayPress }: { year: number; month: number; onDayPress: (date: string) => void }) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

    return (
        <View style={styles.monthBlock}>
            <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>

            <View style={globalStyles.dayLabelsRow}>
                {DAY_LABELS.map(d => <Text key={d} style={globalStyles.dayLabel}>{d}</Text>)}
            </View>

            {weeks.map((week, wi) => (
                <View key={wi} style={globalStyles.calendarWeek}>
                    {week.map((day, di) => {
                        if (day === null) return <View key={`e-${wi}-${di}`} style={globalStyles.calendarCell} />;
                        const dateStr = `${year}-${month}-${day}`;
                        const isToday = dateStr === TODAY_STR;
                        const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        return (
                            <TouchableOpacity
                                key={dateStr}
                                style={[globalStyles.calendarCell, isToday && globalStyles.calendarCellToday]}
                                onPress={() => onDayPress(isoDate)}
                                activeOpacity={0.7}
                            >
                                <Text style={[globalStyles.calendarCellText, isToday && globalStyles.calendarCellTextToday]}>
                                    {day}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

/**
 * This function maanges the monthly blocks for the calendar page.
 */
export default function CalendarScreen() {
    const router = useRouter();
    const listRef = useRef<FlatList>(null);


    function scrollToToday() {
        listRef.current?.scrollToOffset({ offset: ITEM_OFFSETS[CURRENT_MONTH_INDEX], animated: true });
    }

    // Handles the press event to display tasks on the selected day.
    function handleDayPress(date: string) {
        router.replace({ pathname: '/(tabs)', params: { date } });
    }

    return (
        <SafeAreaView style={globalStyles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={globalStyles.calendarBackBtn}>
                    <Ionicons name="arrow-back" size={22} color={Palette.primary} />
                </TouchableOpacity>
                <Text style={globalStyles.calendarHeaderTitle}>Calendar</Text>
                <TouchableOpacity onPress={scrollToToday} style={globalStyles.calendarBackBtn}>
                    <Ionicons name="today-outline" size={22} color={Palette.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={listRef}
                data={MONTHS}
                keyExtractor={({ year, month }) => `${year}-${month}`}
                renderItem={({ item }) => <MonthBlock year={item.year} month={item.month} onDayPress={handleDayPress} />}
                getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHTS[index],
                    offset: ITEM_OFFSETS[index],
                    index,
                })}
                onLayout={() => listRef.current?.scrollToOffset({ offset: ITEM_OFFSETS[CURRENT_MONTH_INDEX], animated: false })}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border,
    },
    monthBlock: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: MONTH_BOTTOM_H,
    },
    monthLabel: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Palette.text,
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    listContent: {
        paddingBottom: Spacing.xxxl,
    },
});
