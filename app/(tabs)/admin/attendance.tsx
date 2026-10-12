import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Screen from '@/components/Screen';
import { COLORS } from '@/constants/colors';
import {
    addAttendanceRecord,
    deleteAttendanceRecord,
    listAllAttendance,
    type AdminAttendanceRecord,
} from '@/lib/admin';

export default function AttendanceRecordsScreen() {
    const [records, setRecords] = useState<AdminAttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [showAdd, setShowAdd] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [newEventCode, setNewEventCode] = useState('');
    const [adding, setAdding] = useState(false);

    const load = useCallback(async () => {
        try {
            setRecords(await listAllAttendance());
        } catch (error: unknown) {
            console.warn('Unable to load attendance:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const confirmDelete = (record: AdminAttendanceRecord) => {
        Alert.alert('Remove record', `Remove this attendance record for ${record.student_email ?? record.student_id}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    setDeletingId(record.id);
                    try {
                        await deleteAttendanceRecord(record.id);
                        setRecords((prev) => prev.filter((r) => r.id !== record.id));
                    } catch (error: unknown) {
                        const message = error instanceof Error ? error.message : String(error);
                        Alert.alert('Error', message || 'Could not remove the record.');
                    } finally {
                        setDeletingId(null);
                    }
                },
            },
        ]);
    };

    const handleAdd = async () => {
        if (!newEmail.trim() || !newEventCode.trim()) {
            Alert.alert('Missing info', 'Enter both the student email and the event code.');
            return;
        }
        setAdding(true);
        try {
            await addAttendanceRecord(newEmail, newEventCode);
            setNewEmail('');
            setNewEventCode('');
            setShowAdd(false);
            await load();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            Alert.alert('Error', message || 'Could not add the record.');
        } finally {
            setAdding(false);
        }
    };

    const q = query.trim().toLowerCase();
    const filtered = q
        ? records.filter(
            (r) =>
                (r.student_email ?? '').toLowerCase().includes(q) ||
                (r.event_title ?? '').toLowerCase().includes(q) ||
                r.event_code.toLowerCase().includes(q)
        )
        : records;

    return (
        <Screen scroll={false}>
            <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Search by student, event, or code"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
            />

            <Pressable style={styles.addToggle} onPress={() => setShowAdd((v) => !v)}>
                <Ionicons name={showAdd ? 'chevron-up' : 'add-circle-outline'} size={18} color={COLORS.primary} />
                <Text style={styles.addToggleText}>{showAdd ? 'Hide' : 'Add a missed record'}</Text>
            </Pressable>

            {showAdd && (
                <View style={styles.addForm}>
                    <TextInput
                        style={styles.input}
                        value={newEmail}
                        onChangeText={setNewEmail}
                        placeholder="Student email"
                        placeholderTextColor={COLORS.textSecondary}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        value={newEventCode}
                        onChangeText={setNewEventCode}
                        placeholder="Event code"
                        placeholderTextColor={COLORS.textSecondary}
                        autoCapitalize="characters"
                    />
                    <AppButton
                        theme="primary"
                        title={adding ? 'Adding...' : 'Add Record'}
                        icon="checkmark-circle-outline"
                        onPress={handleAdd}
                        disabled={adding}
                    />
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : filtered.length === 0 ? (
                <Text style={styles.empty}>No attendance records found.</Text>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.title}>{item.event_title ?? item.event_code}</Text>
                            <Text style={styles.meta}>{item.student_email ?? item.student_id}</Text>
                            <Text style={styles.meta}>{new Date(item.scanned_at).toLocaleString()}</Text>
                            <Pressable style={styles.deleteButton} disabled={deletingId === item.id} onPress={() => confirmDelete(item)}>
                                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                                <Text style={styles.deleteText}>{deletingId === item.id ? 'Removing...' : 'Remove'}</Text>
                            </Pressable>
                        </View>
                    )}
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    search: {
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: COLORS.textPrimary,
        marginBottom: 10,
    },
    addToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    addToggleText: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginLeft: 6 },
    addForm: {
        backgroundColor: COLORS.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        marginBottom: 12,
        gap: 8,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    loader: { marginTop: 32 },
    empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 32 },
    list: { paddingBottom: 24 },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    deleteText: { fontSize: 12, fontWeight: '600', color: COLORS.danger, marginLeft: 4 },
});