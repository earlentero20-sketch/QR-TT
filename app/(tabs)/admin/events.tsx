import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Screen from '@/components/Screen';
import StatusBadge from '@/components/StatusBadge';
import { COLORS } from '@/constants/colors';
import { deleteEvent, listAllEvents, type AdminEvent } from '@/lib/admin';

export default function ManageEventsScreen() {
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingCode, setDeletingCode] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setEvents(await listAllEvents());
        } catch (error: unknown) {
            console.warn('Unable to load events:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const confirmDelete = (event: AdminEvent) => {
        Alert.alert(
            'Delete event',
            `Delete "${event.title}" (${event.event_code})? This also deletes its attendance records.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingCode(event.event_code);
                        try {
                            await deleteEvent(event.event_code);
                            setEvents((prev) => prev.filter((e) => e.event_code !== event.event_code));
                        } catch (error: unknown) {
                            const message = error instanceof Error ? error.message : String(error);
                            Alert.alert('Error', message || 'Could not delete the event.');
                        } finally {
                            setDeletingCode(null);
                        }
                    },
                },
            ]
        );
    };

    return (
        <Screen scroll={false}>
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : events.length === 0 ? (
                <Text style={styles.empty}>No events have been created yet.</Text>
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item) => item.event_code}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.meta}>{item.event_code}</Text>
                            <Text style={styles.meta}>Created by: {item.creator_email ?? 'unknown'}</Text>
                            <StatusBadge start={item.start_time} end={item.end_time} />
                            <View style={styles.actions}>
                                <AppButton
                                    title={deletingCode === item.event_code ? 'Deleting...' : 'Delete Event'}
                                    icon="trash-outline"
                                    onPress={() => confirmDelete(item)}
                                    disabled={deletingCode === item.event_code}
                                />
                            </View>
                        </View>
                    )}
                />
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    loader: { marginTop: 32 },
    empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 32 },
    list: { paddingBottom: 24 },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
    meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    actions: { marginTop: 10 },
});