import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import Screen from '@/components/Screen';
import { COLORS } from '@/constants/colors';
import { getSystemStats, listAllAttendance, listAllEvents, type SystemStats } from '@/lib/admin';

type EventBreakdown = { eventCode: string; title: string; count: number };

export default function ReportsScreen() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [breakdown, setBreakdown] = useState<EventBreakdown[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const [statsResult, events, attendance] = await Promise.all([
                getSystemStats(),
                listAllEvents(),
                listAllAttendance(),
            ]);
            setStats(statsResult);

            const counts = new Map<string, number>();
            attendance.forEach((record) => {
                counts.set(record.event_code, (counts.get(record.event_code) ?? 0) + 1);
            });

            setBreakdown(
                events
                    .map((event) => ({
                        eventCode: event.event_code,
                        title: event.title,
                        count: counts.get(event.event_code) ?? 0,
                    }))
                    .sort((a, b) => b.count - a.count)
            );
        } catch (error: unknown) {
            console.warn('Unable to load reports:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    if (loading) {
        return (
            <Screen scroll={false} contentStyle={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </Screen>
        );
    }

    return (
        <Screen scroll={false}>
            {stats && (
                <View style={styles.statsGrid}>
                    <StatBox label="Students" value={stats.totalStudents} />
                    <StatBox label="Teachers" value={stats.totalTeachers} />
                    <StatBox label="Admins" value={stats.totalAdmins} />
                    <StatBox label="Events" value={stats.totalEvents} />
                    <StatBox label="Total Scans" value={stats.totalAttendance} />
                </View>
            )}

            <Text style={styles.sectionTitle}>Attendees per Event</Text>
            {breakdown.length === 0 ? (
                <Text style={styles.empty}>No events to report on yet.</Text>
            ) : (
                <FlatList
                    data={breakdown}
                    keyExtractor={(item) => item.eventCode}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.row}>
                            <View style={styles.rowText}>
                                <Text style={styles.rowTitle}>{item.title}</Text>
                                <Text style={styles.rowMeta}>{item.eventCode}</Text>
                            </View>
                            <Text style={styles.rowCount}>{item.count}</Text>
                        </View>
                    )}
                />
            )}
        </Screen>
    );
}

function StatBox({ label, value }: { label: string; value: number }) {
    return (
        <View style={styles.statBox}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: { alignItems: 'center', justifyContent: 'center' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    statBox: {
        flexBasis: '31%',
        backgroundColor: COLORS.card,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statValue: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
    statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10 },
    empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 16 },
    list: { paddingBottom: 24 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    rowText: { flex: 1 },
    rowTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    rowMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    rowCount: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
});