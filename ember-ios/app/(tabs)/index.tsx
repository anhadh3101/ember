import { Image } from 'expo-image'
import { StyleSheet, Alert, View, Text, TouchableOpacity } from 'react-native'
import { useCallback, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import ParallaxScrollView from '@/components/parallax-scroll-view'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import SignOutButton from '@/components/social-auth-buttons/sign-out-button'
import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase'
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler'
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

export default function HomeScreen() {
    const { session } = useAuthContext()

    const now = new Date();
    const dateToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const [todoTasks, setTodoTasks] = useState<Task[]>([]);
    const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

    const updateBatch = useRef<Map<string, string>>(new Map());
    const deleteBatch = useRef<Map<String, String>>(new Map());

    const byTime = (a: Task, b: Task) => a.due_time.localeCompare(b.due_time);

    // This function will save the update query params.
    function addToUpdateBatch(task_id: string, newStatus: string) {
        if (updateBatch.current.has(task_id)) {
            // Remove the task from the batch
            updateBatch.current.delete(task_id);
        } else {
            // Add the task to the batch
            updateBatch.current.set(task_id, newStatus);
        }
    }
    
    async function addToDeleteBatch(task_id: string) {
        // Remove the task from the list and if it is present in the updates batch.
        setTodoTasks(prev => prev.filter(t => t.task_id !== task_id));
        setCompletedTasks(prev => prev.filter(t => t.task_id !== task_id));
        updateBatch.current.delete(task_id);

        if (!deleteBatch.current.has(task_id)) {
            // Add the task to the batch
            deleteBatch.current.set(task_id, task_id);
        }
        console.log("[(/(tabs)/index.tsx) addToDeleteBatch] Task ID added to delete batch: ", task_id);
    }

    function renderDeleteAction(task: Task) {
        return (
            <TouchableOpacity style={styles.deleteButton} onPress={() => addToDeleteBatch(task.task_id)}>
                <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
        );
    }

    // function to push updates to Supabase
    async function pushUpdatesBatch() {
        try {
            for (const [task_id, newStatus] of updateBatch.current) {
                console.log(`[((tabs)/index.tsx) pushUpdatesBatch] Updating task ${task_id} with status ${newStatus}`);
                const { data, error } = await supabase
                    .from('tasks')
                    .update([{ 
                        status: newStatus,
                        updated_at: new Date().toISOString() 
                    }])
                    .eq('task_id', task_id);
                if (error)
                    throw error;

                console.log(`[((tabs)/index.tsx) pushUpdatesBatch] Updated task ${task_id} with status ${newStatus}`);
            }
            updateBatch.current.clear();
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        }
    }

    async function pushDeletesBatch() {
        try {
            for (const task_id of deleteBatch.current.keys()) {
                console.log(`[((tabs)/index.tsx) pushDeletesBatch] Deleting task ${task_id}`);
                const { data, error } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('task_id', task_id);
                if (error)
                    throw error;

                console.log(`[((tabs)/index.tsx) pushDeletesBatch] Deleted task ${task_id}`);
            }
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
            if (error)
                throw error;

            const sortedData = (data ?? []).sort(byTime);
            const list1 = sortedData.filter((t) => t.status === 'TODO');
            const list2 = sortedData.filter((t) => t.status === 'COMPLETED');

            setTodoTasks(list1);
            setCompletedTasks(list2);
        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        }
    }

    // This function will change the status of task and move it between the two lists.
    async function changeTaskStatus(task: Task) {
        const newStatus = task.status === 'TODO' ? 'COMPLETED' : 'TODO';
        
        const newTodo = [...todoTasks];
        const newCompleted = [...completedTasks];

        console.log("[(/(tabs)/index.tsx) changeTaskStatus] Task ID: ", task.task_id);

        if (task.status === 'TODO') {
            // Remove from todo
            const removeIdx = newTodo.findIndex((t) => t.task_id === task.task_id);
            if (removeIdx !== -1) newTodo.splice(removeIdx, 1);

            // Insert into completed at the correct sorted position
            const insertIdx = newCompleted.findIndex((t) => byTime(t, task) > 0);
            if (insertIdx === -1) newCompleted.push({ ...task, status: newStatus });
            else newCompleted.splice(insertIdx, 0, { ...task, status: newStatus });
        } else {
            // Remove from completed
            const removeIdx = newCompleted.findIndex((t) => t.task_id === task.task_id);
            if (removeIdx !== -1) newCompleted.splice(removeIdx, 1);

            // Insert into todo at the correct sorted position
            const insertIdx = newTodo.findIndex((t) => byTime(t, task) > 0);
            if (insertIdx === -1) newTodo.push({ ...task, status: newStatus });
            else newTodo.splice(insertIdx, 0, { ...task, status: newStatus });
        }

        setTodoTasks(newTodo);
        setCompletedTasks(newCompleted);

        // Add the task to the update batch
        addToUpdateBatch(task.task_id, newStatus);
    }

    const doubleTap = (task: Task) =>
        Gesture.Tap()
            .numberOfTaps(2)
            .runOnJS(true)
            .onEnd(() => {
                console.log('Double tap: ', task);
                changeTaskStatus(task)
        });

    useFocusEffect(
        useCallback(() => {
            fetchTasks();
            return () => {
                pushUpdatesBatch();
                pushDeletesBatch();
                console.log('Cleanup');
            }
        }, [session])
    );

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
                headerImage={
                    <Image
                        source={require('@/assets/images/partial-react-logo.png')}
                        style={styles.reactLogo}
                    />
                }
            >

                <ThemedView style={styles.titleContainer}>
                    <ThemedText type="title">{dateToday}</ThemedText>
                </ThemedView>

                {todoTasks.length === 0 ? (
                    <ThemedView style={styles.empty}>
                        <ThemedText style={styles.emptyText}>No tasks due today.</ThemedText>
                    </ThemedView>
                ) : (
                    todoTasks.map((task, index) => (
                        <ReanimatedSwipeable key={task.task_id ?? index} renderRightActions={() => renderDeleteAction(task)}>
                            <GestureDetector gesture={doubleTap(task)}>
                                <View style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.taskTitle}>{task.title}</Text>
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
                                </View>
                            </GestureDetector>
                        </ReanimatedSwipeable>
                    ))
                )}

                {completedTasks.length === 0 ? (
                    <ThemedView style={styles.empty}>
                        <ThemedText style={styles.emptyText}>No completed tasks today.</ThemedText>
                    </ThemedView>
                ) : (
                    completedTasks.map((task, index) => (
                        <ReanimatedSwipeable key={task.task_id ?? index} renderRightActions={() => renderDeleteAction(task)}>
                            <GestureDetector gesture={doubleTap(task)}>
                                <View style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <Text style={[styles.taskTitle, styles.strikethrough]}>{task.title}</Text>
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
                                </View>
                            </GestureDetector>
                        </ReanimatedSwipeable>
                    ))
                )}
                <SignOutButton />
            </ParallaxScrollView>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
    titleContainer: {
        marginBottom: 16,
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
