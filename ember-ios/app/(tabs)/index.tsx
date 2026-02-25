import { Image } from 'expo-image'
import { StyleSheet, Alert, View, Text } from 'react-native'
import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import ParallaxScrollView from '@/components/parallax-scroll-view'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import SignOutButton from '@/components/social-auth-buttons/sign-out-button'
import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase'
import { DoublyLinkedList } from '@/lib/doublyLinkedList'

const PRIORITY_COLORS: Record<string, string> = {
    LOW: '#22c55e',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
}

type Task = {
    id: string
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
    const dateToday = new Date().toISOString().split('T')[0];
    const [todoTasks, setTodoTasks] = useState<Task[]>([]);
    const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

    const updateTasks: Task[] = [];
    const deleteTasks: String[] = [];

    // This function will save the update and delete query.
    function saveUpdateQuery(task_id: string) {
        // if 
        // updateTasks.push(
        //     {
        //         id: task_id,
        //         status: 'COMPLETED'
        //     }
        // );
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

            const byTime = (a: Task, b: Task) => a.due_time.localeCompare(b.due_time);
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
    function changeStatus(task_id: string, list1: Task[], list2: Task[]) {
        // 
    }

    useFocusEffect(
        useCallback(() => {
            fetchTasks();

            return () => {
                console.log('Cleanup');
            }
        }, [session])
    );

    return (
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
                    <View key={task.id ?? index} style={styles.card}>
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
                ))
            )}

            {completedTasks.length === 0 ? (
                <ThemedView style={styles.empty}>
                    <ThemedText style={styles.emptyText}>No tasks due today.</ThemedText>
                </ThemedView>
            ) : (
                todoTasks.map((task, index) => (
                    <View key={task.id ?? index} style={styles.card}>
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
                ))
            )}
            <SignOutButton />
        </ParallaxScrollView>
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
})
