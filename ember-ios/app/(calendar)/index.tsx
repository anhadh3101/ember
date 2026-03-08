import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { globalStyles, Palette, Spacing, Radii, Shadow } from '@/constants/styles';
import { useAuthContext } from '@/hooks/use-auth-context';
import { supabase } from '@/lib/supabase';

const _today = new Date();
const TODAY_STR = `${_today.getFullYear()}-${String(_today.getMonth() + 1).padStart(2, '0')}-${String(_today.getDate()).padStart(2, '0')}`;

export default function CalendarScreen() {
    const router = useRouter();
    const { session } = useAuthContext();
    const [selectedDate, setSelectedDate] = useState(TODAY_STR);
    const [taskDots, setTaskDots] = useState<Record<string, { marked: boolean; dotColor: string }>>({});

    useEffect(() => {
        datesWithTasks().then(data => {
            if (!data) return;
            const dots: Record<string, { marked: boolean; dotColor: string }> = {};
            for (const { due_date } of data) {
                dots[due_date] = { marked: true, dotColor: Palette.primary };
            }
            setTaskDots(dots);
        });
    }, []);

    function handleDayPress(day: { dateString: string }) {
        setSelectedDate(day.dateString);
        router.replace({ pathname: '/(tabs)', params: { date: day.dateString } });
    }

    // Get all the dates with a task for the user and add to markdedDates
    async function datesWithTasks(){
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('due_date')
                .eq('user_id', session?.user.id)
                .order('due_date', { ascending: true });

            if (error) throw error;

            return data;
        } catch (error) {
            console.error(`[/calendar/index.tsx (getDatesWithTasks)] Error: \n`, error);
        }
    }

    const markedDates = {
        ...taskDots,
        [TODAY_STR]: {
            ...taskDots[TODAY_STR],
            marked: true,
            dotColor: selectedDate === TODAY_STR ? Palette.white : Palette.primary,
        },
        [selectedDate]: {
            ...taskDots[selectedDate],
            selected: true,
            selectedColor: Palette.primary,
            marked: !!(taskDots[selectedDate] || selectedDate === TODAY_STR),
            dotColor: Palette.white,
        },
    };


    return (
        <SafeAreaView style={globalStyles.safe}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={globalStyles.calendarBackBtn}>
                    <Ionicons name="arrow-back" size={22} color={Palette.primary} />
                </TouchableOpacity>
                <Text style={globalStyles.calendarHeaderTitle}>Calendar</Text>
                <View style={{ width: 34 }} />
            </View>

            <View style={styles.calendarCard}>
                <Calendar
                    current={selectedDate}
                    onDayPress={handleDayPress}
                    markedDates={markedDates}
                    theme={{
                        backgroundColor: Palette.white,
                        calendarBackground: Palette.white,
                        textSectionTitleColor: Palette.textMuted,
                        selectedDayBackgroundColor: Palette.primary,
                        selectedDayTextColor: Palette.white,
                        todayTextColor: Palette.primary,
                        dayTextColor: Palette.text,
                        textDisabledColor: Palette.border,
                        arrowColor: Palette.primary,
                        monthTextColor: Palette.text,
                        textMonthFontWeight: '700' as const,
                        textDayFontSize: 14,
                        textMonthFontSize: 17,
                        textDayHeaderFontSize: 12,
                        textDayHeaderFontWeight: '600' as const,
                    }}
                />
            </View>
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
    calendarCard: {
        margin: Spacing.xl,
        borderRadius: Radii.xl,
        borderWidth: 1,
        borderColor: Palette.border,
        overflow: 'hidden',
        backgroundColor: Palette.white,
        ...Shadow.sm,
    },
});
