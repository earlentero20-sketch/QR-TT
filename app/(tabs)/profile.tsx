import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth, signOut } from '@/lib/auth';
import { getProfile, updateProfile } from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>('student');
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      const profile = await getProfile(user.id);
      setFullName(profile?.full_name ?? '');
      setRole(profile?.role ?? 'student');
    };

    loadProfile();
  }, [user?.id]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      router.replace('/login');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!user?.id) return;
    setSavingName(true);
    try {
      await updateProfile(user.id, { full_name: fullName.trim() || null });
      Alert.alert('Profile updated', 'Your display name was saved.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update profile.');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      {user && (
        <View style={styles.infoCard}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your display name"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{role === 'teacher' ? 'Teacher' : 'Student'}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>

          <Text style={styles.label}>User ID</Text>
          <Text style={styles.valueSmall}>{user.id}</Text>

          <AppButton
            title={savingName ? 'Saving...' : 'Save Name'}
            icon="save-outline"
            onPress={handleSaveName}
            disabled={savingName}
          />
        </View>
      )}

      <AppButton
        title="Sign Out"
        icon="log-out-outline"
        onPress={handleSignOut}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  value: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  valueSmall: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 15,
    marginBottom: 10,
  },
});
