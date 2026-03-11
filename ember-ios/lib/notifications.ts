import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function remindWhenToMinutes(remindWhen: string): number {
    const map: Record<string, number> = {
        "1m": 1, "5m": 5, "10m": 10, "15m": 15, "30m": 30, "45m": 45, "1h": 60,
    };
    return map[remindWhen] ?? 15;
}

export async function scheduleTaskNotification(task: {
    task_id: string;
    title: string;
    due_date: string;
    due_time: string;
    remind_when: string | null;
}): Promise<void> {
    if (!task.remind_when) return;

    await Notifications.cancelScheduledNotificationAsync(task.task_id).catch(() => {});

    const [year, month, day] = task.due_date.split("-").map(Number);
    const [hour, minute] = task.due_time.split(":").map(Number);
    const dueDateTime = new Date(year, month - 1, day, hour, minute, 0, 0);
    const notifyAt = new Date(dueDateTime.getTime() - remindWhenToMinutes(task.remind_when) * 60_000);

    if (notifyAt <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
        identifier: task.task_id,
        content: {
            title: "Task Reminder",
            body: task.title,
        },
        trigger: {
            type: SchedulableTriggerInputTypes.DATE,
            date: notifyAt,
        },
    });

    console.log(`[notifications (scheduleTaskNotification)] Scheduled notification for task ${task.task_id} at ${notifyAt}`);
    console.log(`[notifications (scheduleTaskNotification)] Remaining notifications: ${(await Notifications.getAllScheduledNotificationsAsync()).length}`);
}

export async function cancelTaskNotification(task_id: string): Promise<void> {
    console.log(`[notifications (cancelTaskNotification)] Canceling notification for task ${task_id}`);
    await Notifications.cancelScheduledNotificationAsync(task_id).catch(() => {});
    console.log(`[notifications (cancelTaskNotification)] Remaining notifications: ${(await Notifications.getAllScheduledNotificationsAsync()).length}`);
}
