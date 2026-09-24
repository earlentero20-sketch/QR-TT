import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import Screen from '@/components/Screen';
import { COLORS } from '@/constants/colors';
import { useRole } from '@/lib/profiles';

export default function Index() {
  const { role } = useRole();
  const isTeacher = role === 'teacher';

  return (
    <Screen contentStyle={styles.content}>
      <Header title="M.Y QR Attendance" />

      <View style={styles.body}>
        <Text style={styles.mainTitle}>School Event Attendance</Text>
        <Text style={styles.subtitle}>
          {isTeacher
            ? 'Create event QR codes and review who attended.'
            : 'Scan QR Codes to record attendance during school activities.'}
        </Text>
      </View>

      <View style={styles.actions}>
        {isTeacher ? (
          <AppButton
            theme="primary"
            title="Create Event QR"
            icon="add-circle-outline"
            onPress={() => router.navigate('/teacher')}
          />
        ) : (
          <AppButton
            theme="primary"
            title="Scan QR Code"
            icon="qr-code-outline"
            onPress={() => router.navigate('/scan')}
          />
        )}
        <AppButton
          title={isTeacher ? 'Event Summary' : 'Attendance History'}
          icon="time-outline"
          onPress={() => router.navigate('/history')}
        />
        <AppButton
          title="Profile"
          icon="person-outline"
          onPress={() => router.navigate('/profile')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', justifyContent: 'center' },
  body: { alignItems: 'center', paddingHorizontal: 8, marginBottom: 32 },
  mainTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  actions: { width: '100%' },
});