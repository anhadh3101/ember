import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Alert, View, Text, TouchableOpacity } from 'react-native'
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

const PRIORITY_COLORS: Record<string, string> = {
    LOW: '#22c55e',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
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
}

function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
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
                <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(task.task_id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            )}
        >
            <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.taskTitle, task.status === 'COMPLETED' && styles.strikethrough]}>
                        {task.title}
                    </Text>
                    <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[task.priority] ?? '#aaa' }]}>
                        <Text style={styles.priorityText}>{task.priority}</Text>
                    </View>
                </View>
                {task.description ? (
                    <Text style={styles.description}>{task.description}</Text>
                ) : null}
                <View style={styles.cardFooter}>
                    <Text style={styles.meta}>{task.category}</Text>
                    <Text style={styles.meta}>{task.due_time?.slice(0, 5)}</Text>
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
            return () => {
                pushUpdatesBatch();
                pushDeletesBatch();
                console.log('Pushing updates and deletes if any.');
            }
        }, [session])
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#f3f4f6', dark: '#1f2937' }}
                headerImage={
                    <View style={[styles.headerContent, { paddingTop: top }]}>
                        <TouchableOpacity style={styles.calendarButton} onPress={() => router.replace('/(calendar)/calendar')}>
                            <Ionicons name="calendar-outline" size={26} color="#111" />
                        </TouchableOpacity>
                        <Text style={styles.headerDate}>
                            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                    </View>
                }
            >
                {todoTasks.length === 0 ? (
                    <ThemedView style={styles.empty}>
                        <ThemedText style={styles.emptyText}>No tasks due today.</ThemedText>
                    </ThemedView>
                ) : (
                    todoTasks.map((task, index) => (
                        <TaskCard
                            key={task.task_id ?? index}
                            task={task}
                            onStatusChange={changeTaskStatus}
                            onDelete={addToDeleteBatch}
                        />
                    ))
                )}

                {completedTasks.length === 0 ? (
                    <ThemedView style={styles.empty}>
                        <ThemedText style={styles.emptyText}>No completed tasks today.</ThemedText>
                    </ThemedView>
                ) : (
                    completedTasks.map((task, index) => (
                        <TaskCard
                            key={task.task_id ?? index}
                            task={task}
                            onStatusChange={changeTaskStatus}
                            onDelete={addToDeleteBatch}
                        />
                    ))
                )}
            </ParallaxScrollView>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    calendarButton: {
        padding: 4,
    },
    headerDate: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111',
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        color: '#aaa',
        fontSize: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e5e5',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111',
        flex: 1,
        marginRight: 8,
    },
    priorityBadge: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    description: {
        fontSize: 13,
        color: '#666',
        marginBottom: 10,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    meta: {
        fontSize: 12,
        color: '#999',
    },
    strikethrough: {
        textDecorationLine: 'line-through',
        color: '#aaa',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: 12,
        marginBottom: 12,
        marginLeft: 8,
    },
    deleteText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
})
