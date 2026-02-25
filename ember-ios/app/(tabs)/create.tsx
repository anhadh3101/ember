import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/hooks/use-auth-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const CATEGORIES = ["PERSONAL", "WORK", "FITNESS"];
const REMIND_OPTIONS = ["10m", "15m", "30m", "45m", "1h"];

export default function CreateScreen() {
    const router = useRouter();
    const { session } = useAuthContext();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const [priority, setPriority] = useState('MEDIUM');
    const [category, setCategory] = useState('PERSONAL');

    const [dueDate, setDueDate] = useState(new Date());
    const [dueTime, setDueTime] = useState(new Date());
    const [remindWhen, setRemindWhen] = useState("15m");

    const [errors, setErrors] = useState<Record<string, string | null>>({});

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const clearError = (key: string) => setErrors((e) => ({ ...e, [key]: null }));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!title.trim()) e.title = "Title is required.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    async function handleSubmit() {
        // Validate the form fields.
        if (!validate()) return;

        // Create the task object and insert it into the supabase 
        const task = { title, description, priority, category, dueDate, dueTime, remindWhen };

        try {
            const {data, error} = await supabase.from("tasks").insert([{
                title: task.title,
                description: task.description,
                due_date: task.dueDate.toISOString().split("T")[0],
                due_time: task.dueTime.toTimeString().slice(0, 8),
                priority: task.priority,
                category: task.category,
                user_id: session?.user.id,
            }]);

            if (error) {
                throw error;
            }

            router.replace("/(tabs)");
        } catch (error) {
            console.log(error);
            return;
        }
    }

    const formatDate = (date: Date) =>
        date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const formatTime = (date: Date) =>
        date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    return (
        <SafeAreaView style={s.safe}>
        <ScrollView style={s.scrollView} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()}>
                <Text style={s.back}>← Back</Text>
            </TouchableOpacity>
            <Text style={s.heading}>New Task</Text>
            </View>

            {/* Title */}
            <View style={s.field}>
            <Text style={s.label}>Title *</Text>
            <TextInput
                style={[s.input, errors.title && s.inputError]}
                placeholder="e.g. Submit project report"
                placeholderTextColor="#aaa"
                value={title}
                onChangeText={(v) => { setTitle(v); clearError("title"); }}
            />
            {errors.title && <Text style={s.error}>{errors.title}</Text>}
            </View>

            {/* Description */}
            <View style={s.field}>
            <Text style={s.label}>Description</Text>
            <TextInput
                style={[s.input, s.textarea]}
                placeholder="Optional details..."
                placeholderTextColor="#aaa"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
            />
            </View>

            {/* Category */}
            <View style={s.field}>
            <Text style={s.label}>Category</Text>
            <View style={s.chipRow}>
                {CATEGORIES.map((cat) => (
                <TouchableOpacity
                    key={cat}
                    style={[s.chip, category === cat && s.chipActive]}
                    onPress={() => setCategory(cat)}
                >
                    <Text style={[s.chipText, category === cat && s.chipTextActive]}>
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>
            </View>

            {/* Priority */}
            <View style={s.field}>
            <Text style={s.label}>Priority</Text>
            <View style={s.chipRow}>
                {PRIORITIES.map((p) => (
                <TouchableOpacity
                    key={p}
                    style={[s.chip, priority === p && s.chipActive]}
                    onPress={() => setPriority(p)}
                >
                    <Text style={[s.chipText, priority === p && s.chipTextActive]}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>
            </View>

            {/* Due Date & Time */}
            <View style={s.field}>
            <Text style={s.label}>Due Date & Time</Text>
            <View style={s.row}>
                <TouchableOpacity style={[s.input, s.dateBtn]} onPress={() => setShowDatePicker(true)}>
                <Text style={s.dateText}>📅  {formatDate(dueDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.input, s.dateBtn]} onPress={() => setShowTimePicker(true)}>
                <Text style={s.dateText}>⏰  {formatTime(dueTime)}</Text>
                </TouchableOpacity>
            </View>
            </View>

            {/* Remind When */}
            <View style={s.field}>
            <Text style={s.label}>Remind Me Before</Text>
            <View style={s.chipRow}>
                {REMIND_OPTIONS.map((r) => (
                <TouchableOpacity
                    key={r}
                    style={[s.chip, remindWhen === r && s.chipActive]}
                    onPress={() => setRemindWhen(r)}
                >
                    <Text style={[s.chipText, remindWhen === r && s.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
                ))}
            </View>
            </View>

            {/* Submit */}
            <TouchableOpacity style={s.btn} onPress={handleSubmit}>
            <Text style={s.btnText}>Create Task</Text>
            </TouchableOpacity>

        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
            <DateTimePicker
            value={dueDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selected) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selected) setDueDate(selected);
                if (Platform.OS === "android") setShowDatePicker(false);
            }}
            />
        )}

        {/* Time Picker */}
        {showTimePicker && (
            <DateTimePicker
            value={dueTime}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selected) => {
                setShowTimePicker(Platform.OS === "ios");
                if (selected) setDueTime(selected);
                if (Platform.OS === "android") setShowTimePicker(false);
            }}
            />
        )}
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scrollView: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 32 },
  back: { fontSize: 15, color: "#3b82f6" },
  heading: { fontSize: 22, fontWeight: "700", color: "#111" },
  field: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: "700", color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  input: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 10, padding: 14, fontSize: 15, color: "#111" },
  textarea: { height: 90, textAlignVertical: "top" },
  inputError: { borderColor: "#f87171" },
  error: { fontSize: 12, color: "#f87171", marginTop: 4 },
  row: { flexDirection: "row", gap: 10 },
  dateBtn: { flex: 1, justifyContent: "center" },
  dateText: { fontSize: 14, color: "#333" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  chipActive: { borderColor: "#3b82f6", backgroundColor: "#eff6ff" },
  chipText: { fontSize: 14, color: "#777" },
  chipTextActive: { color: "#3b82f6", fontWeight: "600" },
  btn: { backgroundColor: "#3b82f6", borderRadius: 12, padding: 18, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
