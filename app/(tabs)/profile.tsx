import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Screen from '@/components/Screen';
import { COLORS } from '@/constants/colors';
import { signOut, useAuth } from '@/lib/auth';
import { updateProfile, useRole } from '@/lib/profiles';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { role, profile, refresh } = useRole();
  const [loading, setLoading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
  }, [profile?.full_name]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // Stack.Protected sends us to /login once the session is cleared.
      await signOut();
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
      await refresh();
      Alert.alert('Profile updated', 'Your display name was saved.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update profile.');
    } finally {
      setSavingName(false);
    }
  };

  const roleLabel = role === 'teacher' ? 'Teacher' : role === 'student' ? 'Student' : '...';

  return (
    <Screen>
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
          <Text style={styles.value}>{roleLabel}</Text>

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
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 12,
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