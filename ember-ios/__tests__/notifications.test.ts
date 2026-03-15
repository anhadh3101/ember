import { cancelTaskNotification, scheduleTaskNotification, remindWhenToMinutes } from "../lib/notifications";
import * as Notifications from "expo-notifications";
import testCases from "./data/scheduleTaskNotification.json";
import cancelTestCases from "./data/cancelTaskNotification.json";

jest.mock("expo-notifications", () => ({
    setNotificationHandler: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
    scheduleNotificationAsync: jest.fn().mockResolvedValue(undefined),
    getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
    SchedulableTriggerInputTypes: { DATE: "date" },
}));

describe("remindWhenToMinutes", () => {
    it("converts remindWhen to minutes", () => {
        expect(remindWhenToMinutes("1m")).toBe(1);
        expect(remindWhenToMinutes("5m")).toBe(5);
        expect(remindWhenToMinutes("10m")).toBe(10);
        expect(remindWhenToMinutes("15m")).toBe(15);
        expect(remindWhenToMinutes("30m")).toBe(30);
        expect(remindWhenToMinutes("45m")).toBe(45);
        expect(remindWhenToMinutes("1h")).toBe(60);
        expect(remindWhenToMinutes("2m")).toBe(15);
        expect(remindWhenToMinutes("3h")).toBe(15);
        expect(remindWhenToMinutes("1.5h")).toBe(15);
        expect(remindWhenToMinutes("")).toBe(15);
    });
});

describe("cancelTaskNotification", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test.each(cancelTestCases)("Task '$task_id' ($description): $expected", async ({ task_id, is_scheduled }) => {
        if (is_scheduled) {
            (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValueOnce([{ identifier: task_id }]);
        }

        await cancelTaskNotification(task_id);

        expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(task_id);
    });
});

describe("scheduleTaskNotification", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test.each(testCases)("Task $task.task_id ($task.remind_when): $expected", async ({ task, expected }) => {
        await scheduleTaskNotification(task);

        if (expected === "scheduled") {
            expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
                expect.objectContaining({ identifier: task.task_id })
            );
        } else {
            expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
        }
    });
});
