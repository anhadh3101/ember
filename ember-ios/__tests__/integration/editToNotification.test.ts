import { parseTimeString } from "../../app/(misc)/edit";
import { scheduleTaskNotification } from "../../lib/notifications";
import * as Notifications from "expo-notifications";
import testCases from "../data/editToNotification.json";

jest.mock("expo-notifications", () => ({
    setNotificationHandler: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
    scheduleNotificationAsync: jest.fn().mockResolvedValue(undefined),
    getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
    SchedulableTriggerInputTypes: { DATE: "date" },
}));
jest.mock("expo-router", () => ({ useRouter: jest.fn(), useLocalSearchParams: jest.fn(() => ({})) }));
jest.mock("@react-native-community/datetimepicker", () => "DateTimePicker");
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: "SafeAreaView" }));
jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));
jest.mock("@/constants/styles", () => ({ globalStyles: {}, Palette: { textMuted: "#999" } }));

describe("Integration: parseTimeString → scheduleTaskNotification", () => {
    beforeEach(() => jest.clearAllMocks());

    test.each(testCases)("Task $task_id ($timeString, $due_date): $description", async ({ task_id, title, timeString, due_date, remind_when, expected }) => {
        const parsedTime = parseTimeString(timeString);
        const task = {
            task_id,
            title,
            due_date,
            due_time: `${String(parsedTime.getHours()).padStart(2, "0")}:${String(parsedTime.getMinutes()).padStart(2, "0")}`,
            remind_when,
        };

        await scheduleTaskNotification(task);

        if (expected === "scheduled") {
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({ identifier: task_id })
            );
        } else {
            expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
        }
    });
});
