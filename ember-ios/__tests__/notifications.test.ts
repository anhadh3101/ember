import { cancelTaskNotification, scheduleTaskNotification, remindWhenToMinutes } from "../lib/notifications";

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

describe("scheduleTaskNotification", () => {
    it("schedules a task notification", async () => {

    });
});
