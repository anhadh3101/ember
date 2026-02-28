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
            setTodoTasks(prev => prev.filter(t => t.task_id !== task.task_id));
            setCompletedTasks(prev => {
                const insertIdx = prev.findIndex(t => byTimeLocal(t, task) > 0);
                if (insertIdx === -1) return [...prev, updatedTask];
                const next = [...prev];
                next.splice(insertIdx, 0, updatedTask);
                return next;
            });
        } else {
            setCompletedTasks(prev => prev.filter(t => t.task_id !== task.task_id));
            setTodoTasks(prev => {
                const insertIdx = prev.findIndex(t => byTimeLocal(t, task) > 0);
                if (insertIdx === -1) return [...prev, updatedTask];
                const next = [...prev];
                next.splice(insertIdx, 0, updatedTask);
                return next;
            });
        }

        if (updateBatch.current.has(task.task_id)) {
            updateBatch.current.delete(task.task_id);
        } else {
            updateBatch.current.set(task.task_id, newStatus);
        }
    }, []);

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
            },
        });
    }, [router]);

    // Stable callback — same pattern.
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
            for (const [task_id, newStatus] of updateBatch.current) {
                const { error } = await supabase
                    .from('tasks')
                    .update([{ status: newStatus, updated_at: new Date().toISOString() }])
                    .eq('task_id', task_id);
                if (error) throw error;
            }
            console.log(`Pushed ${updateBatch.current.size} updates.`);
            updateBatch.current.clear();
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        }
    }

    async function pushDeletesBatch() {
        try {
            for (const task_id of deleteBatch.current.keys()) {
                const { error } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('task_id', task_id);
                if (error) throw error;
            }
            console.log(`Pushed ${deleteBatch.current.size} deletes.`);
            deleteBatch.current.clear();
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        }
    }

    async function fetchTasks() {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', session?.user.id)
                .eq('due_date', dateToday);
            if (error) throw error;

            const sortedData = (data ?? []).sort(byTime);
            setTodoTasks(sortedData.filter(t => t.status === 'TODO'));
            setCompletedTasks(sortedData.filter(t => t.status === 'COMPLETED'));
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        }
    }

    useFocusEffect(
        useCallback(() => {
            fetchTasks();
            setResetKey(k => k + 1);
            return () => {
                pushUpdatesBatch();
                pushDeletesBatch();
                console.log('Pushing updates and deletes if any.');
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
