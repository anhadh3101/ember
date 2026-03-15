import { Alert, View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useCallback, useRef, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
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
                    <Text style={globalStyles.taskTitle}>{task.title}</Text>
                    <View style={[globalStyles.priorityBadge, { backgroundColor: PRIORITY_COLORS[task.priority] ?? Palette.textMuted }]}>
                        <Text style={globalStyles.priorityText}>{task.priority}</Text>
                    </View>
                </View>
                {task.description ? (
                    <Text style={globalStyles.cardDescription}>{task.description}</Text>
                ) : null}
                <View style={globalStyles.cardFooter}>
                    <Text style={globalStyles.cardMeta}>{task.category}</Text>
                    <Text style={globalStyles.cardMeta}>{task.due_date}</Text>
                </View>
            </TouchableOpacity>
        </ReanimatedSwipeable>
    );
}

export default function BacklogScreen() {
    const router = useRouter();
    const { session } = useAuthContext();
    const { top } = useSafeAreaInsets();

    const now = new Date();
    const dateToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [resetKey, setResetKey] = useState(0);

    const updateBatch = useRef<Map<string, string>>(new Map());
    const deleteBatch = useRef<Map<string, string>>(new Map());

    // Change the status of the task on double tap and add it to the batch.
    // Only change is that the tasks are not being separated by status since they are all TODO.
    const changeTaskStatus = useCallback((task: Task) => {
        // Status Check to avoid errors
        const newStatus = task.status === 'TODO' ? 'COMPLETED' : 'TODO';
        const updatedTask = { ...task, status: newStatus };

        // Update the task in the UI store
        setTasks(prev => prev.filter(t => t.task_id !== task.task_id));

        // Extra error checks for robustness but the notification gets cancelled here.
        if (task.status === 'TODO') {
            cancelTaskNotification(task.task_id);
        } else {
            scheduleTaskNotification(updatedTask);
        }

        // Add to the update batch
        if (updateBatch.current.has(task.task_id)) {
            updateBatch.current.delete(task.task_id);
        } else {
            updateBatch.current.set(task.task_id, newStatus);
        }
    }, []);

    // If the user wants to edit a task, navigate to the edit screen.
    const handleEdit = useCallback((task: Task) => {
        router.push({
            pathname: '/(misc)/edit' as any,
            params: {
                task_id: task.task_id,
                title: task.title,
                description: task.description,
                priority: task.priority,
                category: task.category,
                due_date: task.due_date,
                due_time: task.due_time,
                status: task.status,
                remind_when: task.remind_when ?? '15m',
            },
        });
    }, [router]);

    // If the user wants to delete a task, remove it from the list and add it to the batch.
    const addToDeleteBatch = useCallback((task_id: string) => {
        setTasks(prev => prev.filter(t => t.task_id !== task_id));
        updateBatch.current.delete(task_id);
        if (!deleteBatch.current.has(task_id)) {
            deleteBatch.current.set(task_id, task_id);
        }
    }, []);

    // Push the updates batch to the database. Same logic as index page
    async function pushUpdatesBatch() {
        if (updateBatch.current.size === 0) return;
        try {
            const updates = [...updateBatch.current.entries()].map(([task_id, status]) =>
                supabase
                    .from('tasks')
                    .update({ status, updated_at: new Date().toISOString() })
                    .eq('task_id', task_id)
            );
            const results = await Promise.all(updates);
            const failed = results.filter(r => r.error);
            if (failed.length > 0) throw failed[0].error;
            updateBatch.current.clear();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to make updates. Please try again.');
        }
    }

    // Pushing delete batch. Same logic as index page.
    async function pushDeletesBatch() {
        if (deleteBatch.current.size === 0) return;
        try {
            const deleteRecords = [...deleteBatch.current.keys()];
            const { error } = await supabase
                .from('tasks')
                .delete()
                .in('task_id', deleteRecords);
            if (error) throw error;
            for (const task_id of deleteBatch.current.keys()) {
                await cancelTaskNotification(task_id);
            }
            deleteBatch.current.clear();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to delete tasks. Please try again.');
        }
    }

    // Fetches all tasks set before today's date.
    async function fetchBacklog() {
        if (session === null) return;
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', session?.user.id)
                .eq('status', 'TODO')
                .lt('due_date', dateToday)
                .order('due_date', { ascending: true });
            if (error) throw error;
            setTasks(data ?? []);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch backlog. Please try again.');
        }
    }

    useFocusEffect(
        useCallback(() => {
            // Fetch backlog
            fetchBacklog();
            setResetKey(k => k + 1);
            pushUpdatesBatch();
            pushDeletesBatch();

            // Cleanup
            return () => {
                pushUpdatesBatch();
                pushDeletesBatch();
            };
        }, [session])
    );

    return (
        <GestureHandlerRootView style={globalStyles.flex1}>
            <View style={[globalStyles.backlogContainer, { paddingTop: top }]}>
                <View style={globalStyles.backlogHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={globalStyles.backlogBackBtn}>
                        <Text style={globalStyles.backlogBackBtnText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={globalStyles.backlogTitle}>Backlog</Text>
                    <View style={globalStyles.backlogBackBtnPlaceholder} />
                </View>

                {tasks.length === 0 ? (
                    <View style={globalStyles.backlogEmpty}>
                        <Text style={globalStyles.backlogEmptyText}>No overdue tasks.</Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={globalStyles.backlogList}>
                        {tasks.map((task, index) => (
                            <TaskCard
                                key={`${task.task_id}-${resetKey}-${index}`}
                                task={task}
                                onStatusChange={changeTaskStatus}
                                onDelete={addToDeleteBatch}
                                onEdit={handleEdit}
                            />
                        ))}
                    </ScrollView>
                )}
            </View>
        </GestureHandlerRootView>
    );
}
