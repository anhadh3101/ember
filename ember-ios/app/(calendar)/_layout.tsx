import { Stack } from 'expo-router';

export default function CalendarLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="calendar" />
            <Stack.Screen name="edit" />
        </Stack>
    );
}
