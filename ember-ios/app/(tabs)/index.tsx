import { Image } from "react-native";
import { Alert, View, Text, TouchableOpacity } from 'react-native'
import { useCallback, useRef, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ParallaxScrollView from '@/components/parallax-scroll-view'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { reload } from 'expo-router/build/global-state/routing'
import { globalStyles, Palette } from '@/constants/styles'
import { cancelTaskNotification, scheduleTaskNotification } from '@/lib/notifications'

const PRIORITY_COLORS: Record<string, string> = {
    LOW: Palette.success,
    MEDIUM: Palette.warning,
    HIGH: Palette.danger,
}

type Task = {
    task_id: string
    title: string
    description: string
    priority: string
    category: string
    due_date: string
    due_time: string
    status: string
    remind_when: string | null
}

type TaskCardProps = {
    task: Task
    onStatusChange: (task: Task) => void
    onDelete: (task_id: string) => void
    onEdit: (task: Task) => void
}

function TaskCard({ task, onStatusChange, onDelete, onEdit }: TaskCardProps) {
    const lastTap = useRef(0);

    function handlePress() {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            lastTap.current = 0;
            onStatusChange(task);
        } else {
            lastTap.current = now;
        }
    }

    return (
        <ReanimatedSwipeable
            renderRightActions={() => (
                <View style={globalStyles.swipeActions}>
                    <TouchableOpacity style={[globalStyles.swipeActionBtn, globalStyles.swipeEdit]} onPress={() => onEdit(task)}>
                        <Text style={globalStyles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[globalStyles.swipeActionBtn, globalStyles.swipeDelete]} onPress={() => onDelete(task.task_id)}>
                        <Text style={globalStyles.actionText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            )}
        >
            <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={globalStyles.card}>
                <View style={globalStyles.cardHeader}>
                    <Text style={[globalStyles.taskTitle, task.status === 'COMPLETED' && globalStyles.strikethrough]}>
                        {task.title}
                    </Text>
                    <View style={[globalStyles.priorityBadge, { backgroundColor: PRIORITY_COLORS[task.priority] ?? Palette.textMuted }]}>
                        <Text style={globalStyles.priorityText}>{task.priority}</Text>
                    </View>
                </View>
                {task.description ? (
                    <Text style={globalStyles.cardDescription}>{task.description}</Text>
                ) : null}
                <View style={globalStyles.cardFooter}>
                    <Text style={globalStyles.cardMeta}>{task.category}</Text>
                    <Text style={globalStyles.cardMeta}>{task.due_time?.slice(0, 5)}</Text>
                </View>
            </TouchableOpacity>
        </ReanimatedSwipeable>
    );
}

export default function HomeScreen() {
    const { session } = useAuthContext()
    const router = useRouter();
    const { top } = useSafeAreaInsets();

    const now = new Date();
    const dateToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const [todoTasks, setTodoTasks] = useState<Task[]>([]);
    const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
    const [resetKey, setResetKey] = useState(0);

    const updateBatch = useRef<Map<string, string>>(new Map());
    const deleteBatch = useRef<Map<string, string>>(new Map());

    const byTime = (a: Task, b: Task) => a.due_time.localeCompare(b.due_time);

    // Stable callback — uses functional state updates so it never closes over stale state.
    const changeTaskStatus = useCallback((task: Task) => {
        const newStatus = task.status === 'TODO' ? 'COMPLETED' : 'TODO';
        const updatedTask = { ...task, status: newStatus };
        const byTimeLocal = (a: Task, b: Task) => a.due_time.localeCompare(b.due_time);

        if (task.status === 'TODO') {
            // If we need to change the status to 'COMPLETED', then delete from todo list and add to completed list.
            setTodoTasks(prev => prev.filter(t => t.task_id !== task.task_id));
            setCompletedTasks(prev => {
                const insertIdx = prev.findIndex(t => byTimeLocal(t, task) > 0);
                if (insertIdx === -1) return [...prev, updatedTask];
                const next = [...prev];
                next.splice(insertIdx, 0, updatedTask);
                return next;
            });
            console.log("[index.tsx (changeTaskStatus)] Completed task: ", updatedTask.task_id);

            // Cancel the notification for this task since it is completed.
            cancelTaskNotification(task.task_id)
            .then(() => {
                console.log("[index.tsx (changeTaskStatus)] Notification cancelled!");
            })
        } else {
            // Do the same if the task needs to be changed back to 'TODO'.
            setCompletedTasks(prev => prev.filter(t => t.task_id !== task.task_id));
            setTodoTasks(prev => {
                const insertIdx = prev.findIndex(t => byTimeLocal(t, task) > 0);
                if (insertIdx === -1) return [...prev, updatedTask];
                const next = [...prev];
                next.splice(insertIdx, 0, updatedTask);
                return next;
            });
            console.log("[index.tsx (changeTaskStatus)] Uncompleted task: ", updatedTask.task_id);

            scheduleTaskNotification(updatedTask)
            .then(() => {
                console.log("[index.tsx (changeTaskStatus)] Notification scheduled!");
            })
        }

        // Add to the update batch if the tasks is not present otherwise remove it from the batch.
        if (updateBatch.current.has(task.task_id)) {
            // Removing from the batch means the task's status is revereted back to its original value.
            updateBatch.current.delete(task.task_id);
        } else {
            // Appending to the batch means the task's status is changed once.
            updateBatch.current.set(task.task_id, newStatus);
        }
    }, []);

    // Handles the editing of a task, by redirecting to the edit screen.
    const handleEdit = useCallback((task: Task) => {
        router.push({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pathname: '/(calendar)/edit' as any,
            params: {
                task_id: task.task_id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                category: task.category,
                due_date: task.due_date,
                due_time: task.due_time,
                status: task.status,
                remind_when: task.remind_when ?? "15m",
            },
        });
    }, [router]);

    // Adds the task to the delete batch and removes it from the todo and completed tasks on delete button press.
    const addToDeleteBatch = useCallback((task_id: string) => {
        setTodoTasks(prev => prev.filter(t => t.task_id !== task_id));
        setCompletedTasks(prev => prev.filter(t => t.task_id !== task_id));
        updateBatch.current.delete(task_id);
        if (!deleteBatch.current.has(task_id)) {
            deleteBatch.current.set(task_id, task_id);
        }
    }, []);

    async function pushUpdatesBatch() {
        try {
            // Push the updates in a list that will be used to make bulk request to the database.
            let updateRecords: { task_id: string; status: string; updated_at: string }[]= [];
            for (const [task_id, newStatus] of updateBatch.current) {
                updateRecords.push({ task_id, status: newStatus, updated_at: new Date().toISOString() });
            }

            // Make the bulk request
            const { data, error } = await supabase
                .from('tasks')
                .upsert(updateRecords)
                .select()

            // If there are any errors, then handle them.
            if (error) throw error;

            // Clear the update batch on exit.
            console.log(`[index.tsx (pushUpdatesBatch)] Upserted ${data.length} tasks in a batch of ${updateRecords.length}.`);
            updateBatch.current.clear();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to make updates. Please try again.");
        }
    }

    async function pushDeletesBatch() {
        try {
            // Add all the task ids to delete in a list.
            let deleteRecords: string[] = [];
            for (const task_id of deleteBatch.current.keys()) {
                deleteRecords.push(task_id);
            }

            // Make a bulk delete request to Supabase with task ids.
            const { data, error } = await supabase
                .from('tasks')
                .delete()
                .in('task_id', deleteRecords)
                .select();

            // If there are any errors, then handle them.
            if (error) throw error;
            console.log(`[index.tsx (pushDeletesBatch)] Deleted ${data.length} tasks in a batch of ${deleteRecords.length}.`);

            // Clear the notifications for deleted tasks and clean the delete batch.
            for (const task_id of deleteBatch.current.keys()) {
                await cancelTaskNotification(task_id);
            }
            deleteBatch.current.clear();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to delete tasks. Please try again.");
        }
    }

    async function fetchTasks() {
        try {
            // Fetch the tasks from the backend that need to be carried out for that day.
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', session?.user.id)
                .eq('due_date', dateToday);
    
            if (error) throw error;

            // Sort the tasks based on time and filtern them.
            const sortedData = (data ?? []).sort(byTime);
            setTodoTasks(sortedData.filter(t => t.status === 'TODO'));
            setCompletedTasks(sortedData.filter(t => t.status === 'COMPLETED'));

            console.log(`[index.tsx (fetchTasks)] Fetched ${sortedData.length} tasks.`);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed fetching tasks. Please try again.");
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchTasks();
            setResetKey(k => k + 1);

            // Push updates and deletes on reload.
            pushUpdatesBatch();
            pushDeletesBatch();

            return () => {
                // Push updates and deletes on exit.
                pushUpdatesBatch();
                pushDeletesBatch();
                console.log('[index.tsx] Pushing updates and deletes if any.');
            }
        }, [session])
    );

    return (
        <GestureHandlerRootView style={globalStyles.flex1}>
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#f3f4f6', dark: '#1f2937' }}
                headerImage={
                    <View style={[globalStyles.headerContent, { paddingTop: top }]}>
                        <TouchableOpacity style={globalStyles.calendarButton} onPress={() => router.replace('/(calendar)/calendar')}>
                            <Image source={require('@/assets/images/icons8-calendar-64.png')} style={{ width: 26, height: 26 }} />
                        </TouchableOpacity>
                        <Text style={globalStyles.headerDate}>
                            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                    </View>
                }
            >
                {todoTasks.length === 0 ? (
                    <ThemedView style={globalStyles.emptyState}>
                        <ThemedText style={globalStyles.emptyText}>No tasks due today.</ThemedText>
                    </ThemedView>
                ) : (
                    todoTasks.map((task, index) => (
                        <TaskCard
                            key={`${task.task_id ?? index}-${resetKey}`}
                            task={task}
                            onStatusChange={changeTaskStatus}
                            onDelete={addToDeleteBatch}
                            onEdit={handleEdit}
                        />
                    ))
                )}

                {completedTasks.length === 0 ? (
                    <ThemedView style={globalStyles.emptyState}>
                        <ThemedText style={globalStyles.emptyText}>No completed tasks today.</ThemedText>
                    </ThemedView>
                ) : (
                    completedTasks.map((task, index) => (
                        <TaskCard
                            key={`${task.task_id ?? index}-${resetKey}`}
                            task={task}
                            onStatusChange={changeTaskStatus}
                            onDelete={addToDeleteBatch}
                            onEdit={handleEdit}
                        />
                    ))
                )}
            </ParallaxScrollView>
        </GestureHandlerRootView>
    )
}
