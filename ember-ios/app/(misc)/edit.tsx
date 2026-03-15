import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    Modal,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { globalStyles, Palette } from "@/constants/styles";
import { scheduleTaskNotification } from "@/lib/notifications";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const CATEGORIES = ["PERSONAL", "WORK", "FITNESS"];
const REMIND_OPTIONS = ["1m", "5m", "10m", "15m", "30m", "45m", "1h"];

export function parseTimeString(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    return d;
}

export default function EditScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        task_id: string;
        title: string;
        description: string;
        priority: string;
        category: string;
        due_date: string;
        due_time: string;
        status: string;
        remind_when: string;
    }>();

    const [title, setTitle] = useState(params.title ?? "");
    const [description, setDescription] = useState(params.description ?? "");
    const [priority, setPriority] = useState(params.priority ?? "MEDIUM");
    const [category, setCategory] = useState(params.category ?? "PERSONAL");
    const [dueDate, setDueDate] = useState(params.due_date ?? "");
    const [dueTime, setDueTime] = useState<Date>(
        params.due_time ? parseTimeString(params.due_time) : new Date()
    );
    const [remindWhen, setRemindWhen] = useState(params.remind_when ?? "15m");

    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const clearError = (key: string) => setErrors((e) => ({ ...e, [key]: null }));

    const validate = () => {
        const e: Record<string, string> = {};
        if (!title.trim()) e.title = "Title is required.";
        if (!description.trim()) e.description = "Description is required.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    async function handleSubmit() {
        if (!validate()) return;

        try {
            const due_time = `${String(dueTime.getHours()).padStart(2, "0")}:${String(dueTime.getMinutes()).padStart(2, "0")}:00`;

            const { error } = await supabase
                .from("tasks")
                .update({
                    title,
                    description,
                    due_date: dueDate,
                    due_time,
                    priority,
                    category,
                    updated_at: new Date().toISOString(),
                    remind_when: remindWhen,
                })
                .eq("task_id", params.task_id);

            if (error) throw error;

            await scheduleTaskNotification({
                task_id: params.task_id,
                title,
                due_date: dueDate,
                due_time,
                remind_when: remindWhen,
            });

            router.back();
        } catch (error) {
            console.log(error);
            setErrors({ general: "Something went wrong. Please try again." });
        }
    }

    const formatTime = (date: Date) =>
        date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    return (
        <SafeAreaView style={globalStyles.safe}>
        <ScrollView style={globalStyles.flex1} contentContainerStyle={globalStyles.formScroll} keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={globalStyles.formHeader}>
            <TouchableOpacity onPress={() => router.back()}>
                <Text style={globalStyles.linkText}>← Back</Text>
            </TouchableOpacity>
            <Text style={globalStyles.heading}>Edit Task</Text>
            </View>

            {errors.general && <Text style={globalStyles.errorText}>{errors.general}</Text>}

            {/* Title */}
            <View style={globalStyles.field}>
            <Text style={globalStyles.label}>Title *</Text>
            <TextInput
                style={[globalStyles.input, errors.title && globalStyles.inputError]}
                placeholder="e.g. Submit project report..."
                placeholderTextColor={Palette.textMuted}
                value={title}
                onChangeText={(v) => { setTitle(v); clearError("title"); }}
            />
            {errors.title && <Text style={globalStyles.errorText}>{errors.title}</Text>}
            </View>

            {/* Description */}
            <View style={globalStyles.field}>
            <Text style={globalStyles.label}>Description</Text>
            <TextInput
                style={[globalStyles.input, globalStyles.textarea, errors.description && globalStyles.inputError]}
                placeholder="Make an appointment with the client..."
                placeholderTextColor={Palette.textMuted}
                value={description}
                onChangeText={(v) => { setDescription(v); clearError("description"); }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
            />
            {errors.description && <Text style={globalStyles.errorText}>{errors.description}</Text>}
            </View>

            {/* Category */}
            <View style={globalStyles.field}>
            <Text style={globalStyles.label}>Category</Text>
            <View style={globalStyles.chipRow}>
                {CATEGORIES.map((cat) => (
                <TouchableOpacity
                    key={cat}
                    style={[globalStyles.chip, category === cat && globalStyles.chipActive]}
                    onPress={() => setCategory(cat)}
                >
                    <Text style={[globalStyles.chipText, category === cat && globalStyles.chipTextActive]}>
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>
            </View>

            {/* Priority */}
            <View style={globalStyles.field}>
            <Text style={globalStyles.label}>Priority</Text>
            <View style={globalStyles.chipRow}>
                {PRIORITIES.map((p) => (
                <TouchableOpacity
                    key={p}
                    style={[globalStyles.chip, priority === p && globalStyles.chipActive]}
                    onPress={() => setPriority(p)}
                >
                    <Text style={[globalStyles.chipText, priority === p && globalStyles.chipTextActive]}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                    </Text>
                </TouchableOpacity>
                ))}
            </View>
            </View>

            {/* Due Date & Time */}
            <View style={globalStyles.field}>
            <Text style={globalStyles.label}>Due Date & Time</Text>
            <View style={globalStyles.dateRow}>
                <TouchableOpacity style={[globalStyles.input, globalStyles.dateBtn]} onPress={() => setShowDatePicker(true)}>
                <Text style={globalStyles.dateText}>📅  {dueDate}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[globalStyles.input, globalStyles.dateBtn]} onPress={() => setShowTimePicker(true)}>
                <Text style={globalStyles.dateText}>⏰  {formatTime(dueTime)}</Text>
                </TouchableOpacity>
            </View>
            </View>

            {/* Remind When */}
            <View style={globalStyles.field}>
            <Text style={globalStyles.label}>Remind Me Before</Text>
            <View style={globalStyles.chipRow}>
                {REMIND_OPTIONS.map((r) => (
                <TouchableOpacity
                    key={r}
                    style={[globalStyles.chip, remindWhen === r && globalStyles.chipActive]}
                    onPress={() => setRemindWhen(r)}
                >
                    <Text style={[globalStyles.chipText, remindWhen === r && globalStyles.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
                ))}
            </View>
            </View>

            {/* Submit */}
            <TouchableOpacity style={globalStyles.btn} onPress={handleSubmit}>
            <Text style={globalStyles.btnText}>Save Changes</Text>
            </TouchableOpacity>

        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
            Platform.OS === "ios" ? (
                <Modal transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
                    <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
                    <View style={pickerStyles.sheet}>
                        <View style={pickerStyles.sheetHeader}>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text style={pickerStyles.doneBtn}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={new Date(dueDate)}
                            mode="date"
                            display="spinner"
                            onChange={(_event, selected) => {
                                if (selected) {
                                    const y = selected.getFullYear();
                                    const m = String(selected.getMonth() + 1).padStart(2, "0");
                                    const d = String(selected.getDate()).padStart(2, "0");
                                    setDueDate(`${y}-${m}-${d}`);
                                }
                            }}
                        />
                    </View>
                </Modal>
            ) : (
                <DateTimePicker
                    value={new Date(dueDate)}
                    mode="date"
                    display="default"
                    onChange={(_event, selected) => {
                        if (selected) {
                            const y = selected.getFullYear();
                            const m = String(selected.getMonth() + 1).padStart(2, "0");
                            const d = String(selected.getDate()).padStart(2, "0");
                            setDueDate(`${y}-${m}-${d}`);
                        }
                        setShowDatePicker(false);
                    }}
                />
            )
        )}

        {/* Time Picker */}
        {showTimePicker && (
            Platform.OS === "ios" ? (
                <Modal transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
                    <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={() => setShowTimePicker(false)} />
                    <View style={pickerStyles.sheet}>
                        <View style={pickerStyles.sheetHeader}>
                            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                <Text style={pickerStyles.doneBtn}>Done</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={dueTime}
                            mode="time"
                            display="spinner"
                            onChange={(_event, selected) => {
                                if (selected) setDueTime(selected);
                            }}
                        />
                    </View>
                </Modal>
            ) : (
                <DateTimePicker
                    value={dueTime}
                    mode="time"
                    display="default"
                    onChange={(_event, selected) => {
                        if (selected) setDueTime(selected);
                        setShowTimePicker(false);
                    }}
                />
            )
        )}
        </SafeAreaView>
    );
}

const pickerStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
    sheet: { backgroundColor: "#1c1c1e", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24 },
    sheetHeader: { flexDirection: "row", justifyContent: "flex-end", padding: 12 },
    doneBtn: { color: "#f97316", fontSize: 16, fontWeight: "600" },
});
