import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Screen from '@/components/Screen';
import { COLORS } from '@/constants/colors';
import { listAllProfiles, setUserRole, type AdminProfile } from '@/lib/admin';
import { useAuth } from '@/lib/auth';

const ROLES: AdminProfile['role'][] = ['student', 'teacher', 'admin'];

export default function ManageUsersScreen() {
    const { user } = useAuth();
    const [users, setUsers] = useState<AdminProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setUsers(await listAllProfiles());
        } catch (error: unknown) {
            console.warn('Unable to load users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const handleSetRole = async (target: AdminProfile, role: AdminProfile['role']) => {
        if (role === target.role) return;
        if (target.id === user?.id && role !== 'admin') {
            Alert.alert('Not allowed', "You can't remove your own admin access from here.");
            return;
        }
        setUpdatingId(target.id);
        try {
            await setUserRole(target.id, role);
            setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, role } : u)));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            Alert.alert('Error', message || 'Could not update the role.');
        } finally {
            setUpdatingId(null);
        }
    };

    const q = query.trim().toLowerCase();
    const filtered = q
        ? users.filter((u) => (u.email ?? '').toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q))
        : users;

    return (
        <Screen scroll={false}>
            <TextInput
                style={styles.search}
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or email"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
            />

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
            ) : filtered.length === 0 ? (
                <Text style={styles.empty}>No users found.</Text>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text style={styles.name}>{item.full_name || 'No name set'}</Text>
                            <Text style={styles.email}>{item.email}</Text>
                            <View style={styles.roleRow}>
                                {ROLES.map((r) => (
                                    <Pressable
                                        key={r}
                                        style={[styles.roleChip, item.role === r && styles.roleChipActive]}
                                        disabled={updatingId === item.id}
                                        onPress={() => handleSetRole(item, r)}
                                    >
                                        <Text style={[styles.roleChipText, item.role === r && styles.roleChipTextActive]}>
                                            {r.charAt(0).toUpperCase() + r.slice(1)}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
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
        marginBottom: 12,
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
    name: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
    email: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, marginBottom: 10 },
    roleRow: { flexDirection: 'row', gap: 8 },
    roleChip: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
    },
    roleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    roleChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
    roleChipTextActive: { color: COLORS.textOnPrimary },
});