import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import {
  getAttendanceHistory,
  getTeacherEventSummary,
  type AttendanceRecord,
  type TeacherEventSummary,
} from '@/lib/attendance';
import { getProfile, normalizeRole } from '@/lib/profiles';

export default function HistoryScreen() {
  const { user } = useAuth();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [teacherSummary, setTeacherSummary] = useState<TeacherEventSummary[]>([]);
  const [role, setRole] = useState<'student' | 'teacher' | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    getProfile(user.id).then((profile) => {
      const nextRole = normalizeRole(profile?.role);
      setRole(nextRole);

      if (nextRole === 'teacher') {
        getTeacherEventSummary(user.id).then((rows) => {
          setTeacherSummary(rows);
          setRecords([]);
          setLoading(false);
        });
        return;
      }

      getAttendanceHistory(user.id).then((rows) => {
        setRecords(rows);
        setTeacherSummary([]);
        setLoading(false);
      });
    });
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {role === 'teacher' ? 'Teacher Event Summary' : 'Attendance History'}
      </Text>

      {loading ? (
        <Text style={styles.subtitle}>Loading records...</Text>
      ) : role === 'teacher' ? (
        teacherSummary.length === 0 ? (
          <Text style={styles.subtitle}>No events created yet.</Text>
        ) : (
          <FlatList
            data={teacherSummary}
            keyExtractor={(item) => item.eventId}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventMeta}>{item.eventId}</Text>
                <Text style={styles.eventMeta}>{item.attendeeCount} attendee(s)</Text>
              </View>
            )}
          />
        )
      ) : records.length === 0 ? (
        <Text style={styles.subtitle}>
          No records yet. Scan a QR code to register your attendance.
        </Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.eventTitle}>{item.eventTitle}</Text>
              <Text style={styles.eventMeta}>{item.eventId}</Text>
              <Text style={styles.eventMeta}>{formatDate(item.scannedAt)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
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
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 32,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});