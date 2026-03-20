import { Image, Modal } from "react-native";
import { Alert, View, Text, TouchableOpacity } from 'react-native'
import { useCallback, useRef, useState } from 'react'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ParallaxScrollView from '@/components/parallax-scroll-view'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase'
import { GestureHandlerRootView, TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { globalStyles, Palette } from '@/constants/styles'
import { Ionicons } from '@expo/vector-icons'
import { cancelTaskNotification, scheduleTaskNotification } from '@/lib/notifications'

export const PRIORITY_COLORS: Record<string, string> = {
    LOW: Palette.success,
    MEDIUM: Palette.warning,
    HIGH: Palette.danger,
}

const SORT_OPTIONS = [
    { key: 'PRIORITY_DESC', label: 'Priority: High → Low' },
    { key: 'PRIORITY_ASC',  label: 'Priority: Low → High' },
    { key: 'TIME_ASC',      label: 'Time: Earliest First' },
    { key: 'TIME_DESC',     label: 'Time: Latest First'   },
] as const;

type SortKey = typeof SORT_OPTIONS[number]['key'];
export const PRIORITY_ORDER: Record<string, number> = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
};

const CATEGORIES = ['ALL', 'PERSONAL', 'WORK', 'FITNESS'] as const;
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    ALL:      'apps-outline',
    PERSONAL: 'person-outline',
    WORK:     'briefcase-outline',
    FITNESS:  'barbell-outline',
};
type Category = typeof CATEGORIES[number];

// TYPE DEFINITIONS
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

/**
 * This is the task card component that stores the UI for each task.
 */
function TaskCard({ task, onStatusChange, onDelete, onEdit }: TaskCardProps) {
    const lastTap = useRef(0);

    // The following function handles the double tap feature.
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

// Function to filter the tasks based on the selected category.
export function filterByCategory(tasks: Task[], category: Category): Task[] {
    return category === 'ALL' ? tasks : tasks.filter(t => t.category === category);
}

// Function to sort the tasks based on the selected sort option.
export function sortTasks(tasks: Task[], sortBy: SortKey): Task[] {
    return [...tasks].sort((a, b) => {
        switch (sortBy) {
            case 'PRIORITY_DESC': return (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
            case 'PRIORITY_ASC':  return (PRIORITY_ORDER[b.priority] ?? 3) - (PRIORITY_ORDER[a.priority] ?? 3);
            case 'TIME_ASC':      return a.due_time.localeCompare(b.due_time);
            case 'TIME_DESC':     return b.due_time.localeCompare(a.due_time);
        }
    });
}

export default function HomeScreen() {
    const router = useRouter();
    const { session } = useAuthContext()
    const { top } = useSafeAreaInsets();
    const { date: dateParam } = useLocalSearchParams<{ date?: string }>();

    const now = new Date();
    const dateToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const selectedDate = dateParam ?? dateToday;
    const displayDate = dateParam ? new Date(`${dateParam}T00:00:00`) : now;

    // List of sorted and filtered tasks.
    const [todoTasks, setTodoTasks] = useState<Task[]>([]);
    const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
    const [resetKey, setResetKey] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<Category>('ALL');

    const [sortBy, setSortBy] = useState<SortKey>('TIME_ASC');
    const [showSortMenu, setShowSortMenu] = useState(false);

    const filteredTodo = sortTasks(filterByCategory(todoTasks, selectedCategory), sortBy);
    const filteredCompleted = sortTasks(filterByCategory(completedTasks, selectedCategory), sortBy);

    // Batches
    const updateBatch = useRef<Map<string, string>>(new Map());
    const deleteBatch = useRef<Map<string, string>>(new Map());

    // Stable callback — uses functional state updates so it never closes over stale state.
    const changeTaskStatus = useCallback((task: Task) => {
        const newStatus = task.status === 'TODO' ? 'COMPLETED' : 'TODO';
        // Create a new task object with the updated status.
        const updatedTask = { ...task, status: newStatus };

        if (task.status === 'TODO') {
            // If we need to change the status to 'COMPLETED', then delete from todo list and add to completed list.
            setTodoTasks(prev => prev.filter(t => t.task_id !== task.task_id));
            setCompletedTasks(prev => [...prev, updatedTask]);
            console.log("[index.tsx (changeTaskStatus)] Completed task: ", updatedTask.task_id);

            // Cancel the notification for this task since it is completed.
            cancelTaskNotification(task.task_id)
            .then(() => {
                console.log("[index.tsx (changeTaskStatus)] Notification cancelled!");
            })
        } else {
            // Do the same if the task needs to be changed back to 'TODO'.
            setCompletedTasks(prev => prev.filter(t => t.task_id !== task.task_id));
            setTodoTasks(prev => [...prev, updatedTask]);
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
                remind_when: task.remind_when ?? "15m",
            },
        });
    }, [router]);

    // Adds the task to the delete batch and removes it from the todo and completed tasks on delete button press.
    const addToDeleteBatch = useCallback((task_id: string) => {
        // Remove the task from the lists.
        setTodoTasks(prev => prev.filter(t => t.task_id !== task_id));
        setCompletedTasks(prev => prev.filter(t => t.task_id !== task_id));

        // Check to see if there is any tasks in the update batch and remove it.
        updateBatch.current.delete(task_id);
        // If the task is not in the delete batch then remove it.
        if (!deleteBatch.current.has(task_id)) {
            deleteBatch.current.set(task_id, task_id);
        }
    }, []);

    // Push the updates to the database.
    async function pushUpdatesBatch() {
        if (updateBatch.current.size === 0) return;
        try {
            // Push the updates in a list that will be used to make bulk request to the database.
            let updateRecords: { task_id: string; status: string; updated_at: string }[]= [];
            for (const [task_id, newStatus] of updateBatch.current) {
                updateRecords.push({ task_id: task_id, status: newStatus, updated_at: new Date().toISOString() });
            }

            // Make the bulk request
            const updates = [...updateBatch.current.entries()].map(([task_id, status]) =>
                supabase
                    .from('tasks')
                    .update({ status, updated_at: new Date().toISOString() })
                    .eq('task_id', task_id)
            );

            // If there are any errors, then handle them.
            const results = await Promise.all(updates);
            const failed = results.filter(r => r.error);
            if (failed.length > 0) throw failed[0].error;

            // Clear the update batch on exit.
            console.log(`[index.tsx (pushUpdatesBatch)] Updated ${updateBatch.current.size} tasks.`);
            updateBatch.current.clear();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to make updates. Please try again.");
        }
    }

    // Push the delete batch to the database.
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

    // Fetch the tasks for the selected data and organize them in the 2 lists.
    async function fetchTasks() {
        try {
            console.log(`\n[index.tsx (fetchTasks)] Fetching tasks for ${selectedDate}...`);
            // Fetch the tasks from the backend that need to be carried out for that day.
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', session?.user.id)
                .eq('due_date', selectedDate);
    
            if (error) throw error;

            // Sort the tasks based on time and filter them.
            const sortedData = (data ?? []).sort((a, b) => a.due_time.localeCompare(b.due_time));
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

            // Reset the selected category.
            setSelectedCategory('ALL');

            return () => {
                // Push updates and deletes on exit.
                pushUpdatesBatch();
                pushDeletesBatch();
                console.log('[index.tsx] Pushing updates and deletes if any.');
            }
        }, [session, selectedDate])
    );

    return (
        <GestureHandlerRootView style={globalStyles.flex1}>
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#f3f4f6', dark: '#1f2937' }}
                headerImage={
                    <View style={[globalStyles.headerContent, { paddingTop: top }]}>
                        <TouchableOpacity style={globalStyles.calendarButton} onPress={() => router.replace('/(misc)')}>
                            <Image source={require('@/assets/images/icons8-calendar-64.png')} style={{ width: 26, height: 26 }} />
                        </TouchableOpacity>
                        <Text style={globalStyles.headerDate}>
                            {displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                    </View>
                }
            >
                <View style={globalStyles.filterBar}>
                    <View style={globalStyles.filterContent}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setSelectedCategory(cat)}
                                style={[globalStyles.filterChip, selectedCategory === cat && globalStyles.filterChipActive]}
                            >
                                <Ionicons
                                    name={CATEGORY_ICONS[cat]}
                                    size={16}
                                    color={selectedCategory === cat ? Palette.white : Palette.textSubtle}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={globalStyles.sortRow}>
                        <TouchableOpacity style={globalStyles.sortBtn} onPress={() => setShowSortMenu(true)}>
                            <Text style={globalStyles.sortBtnChevron}>⇅</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {filteredTodo.length === 0 ? (
                    <ThemedView style={globalStyles.emptyState}>
                        <ThemedText style={globalStyles.emptyText}>No tasks due today.</ThemedText>
                    </ThemedView>
                ) : (
                    filteredTodo.map((task, index) => (
                        <TaskCard
                            key={`${task.task_id ?? index}-${resetKey}`}
                            task={task}
                            onStatusChange={changeTaskStatus}
                            onDelete={addToDeleteBatch}
                            onEdit={handleEdit}
                        />
                    ))
                )}

                {filteredCompleted.length === 0 ? (
                    <ThemedView style={globalStyles.emptyState}>
                        <ThemedText style={globalStyles.emptyText}>No completed tasks today.</ThemedText>
                    </ThemedView>
                ) : (
                    filteredCompleted.map((task, index) => (
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

            <Modal visible={showSortMenu} transparent animationType="fade" onRequestClose={() => setShowSortMenu(false)}>
                <TouchableOpacity style={globalStyles.sortOverlay} activeOpacity={1} onPress={() => setShowSortMenu(false)}>
                    <View style={globalStyles.sortMenu}>
                        {SORT_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.key}
                                style={[globalStyles.sortMenuItem, sortBy === opt.key && globalStyles.sortMenuItemActive]}
                                onPress={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                            >
                                <Text style={[globalStyles.sortMenuItemText, sortBy === opt.key && globalStyles.sortMenuItemTextActive]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            <TouchableOpacity style={globalStyles.backlogFab} onPress={() => router.push('/(misc)/backlog' as any)} activeOpacity={0.8}>
                <Image source={require('@/assets/images/backlog.png')} style={{ width: 32, height: 32 }} />
            </TouchableOpacity>

        </GestureHandlerRootView>
    )
}
