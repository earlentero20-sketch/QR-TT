import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import Screen from '@/components/Screen';
import { COLORS } from '@/constants/colors';
import { getSystemStats, type SystemStats } from '@/lib/admin';
import { useRole } from '@/lib/profiles';

const SECTIONS = [
    { key: 'users', title: 'Manage Users', subtitle: 'View accounts and change roles', icon: 'people-outline' as const, route: '/admin/users' as const },
    { key: 'events', title: 'Manage Events', subtitle: 'Edit or remove any event', icon: 'calendar-outline' as const, route: '/admin/events' as const },
    { key: 'attendance', title: 'Attendance Records', subtitle: 'Correct or remove scans', icon: 'checkmark-done-outline' as const, route: '/admin/attendance' as const },
    { key: 'reports', title: 'Reports', subtitle: 'System-wide numbers', icon: 'bar-chart-outline' as const, route: '/admin/reports' as const },
];

export default function AdminDashboard() {
    const { role, loading: roleLoading } = useRole();
    const [stats, setStats] = useState<SystemStats | null>(null);

    useEffect(() => {
        if (role === 'admin') {
            getSystemStats().then(setStats).catch(() => setStats(null));
        }
    }, [role]);

    if (role === null || roleLoading) {
        return (
            <Screen scroll={false} contentStyle={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </Screen>
        );
    }

    if (role !== 'admin') {
        return (
            <Screen scroll={false}>
                <Text style={styles.title}>Administrators Only</Text>
                <Text style={styles.subtitle}>This area is restricted to administrator accounts.</Text>
            </Screen>
        );
    }

    return (
        <Screen>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>Manage users, events, and attendance across the whole system.</Text>

            {stats && (
                <View style={styles.statsRow}>
                    <StatBox label="Students" value={stats.totalStudents} />
                    <StatBox label="Teachers" value={stats.totalTeachers} />
                    <StatBox label="Events" value={stats.totalEvents} />
                    <StatBox label="Scans" value={stats.totalAttendance} />
                </View>
            )}

            {SECTIONS.map((section) => (
                <Pressable
                    key={section.key}
                    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                    onPress={() => router.push(section.route)}
                >
                    <View style={styles.cardIcon}>
                        <Ionicons name={section.icon} size={22} color={COLORS.primary} />
                    </View>
                    <View style={styles.cardText}>
                        <Text style={styles.cardTitle}>{section.title}</Text>
                        <Text style={styles.cardSubtitle}>{section.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </Pressable>
            ))}
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
    title: { fontSize: 20, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
    subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 16 },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    statBox: {
        flexBasis: '47%',
        backgroundColor: COLORS.card,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    statValue: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
    statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    cardPressed: { backgroundColor: COLORS.surface },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
    cardSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});