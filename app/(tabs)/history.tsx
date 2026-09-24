import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import Screen from '@/components/Screen';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
  type AttendanceRecord,
  type TeacherEventAttendance,
} from '@/lib/attendance';
import { useRole } from '@/lib/profiles';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { role } = useRole();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [teacherEvents, setTeacherEvents] = useState<TeacherEventAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  const loadHistory = useCallback(async () => {
    if (!userId || !role) {
      return; // wait until we know who and what the user is
    }

    setError(null);

    try {
      if (role === 'teacher') {
        setTeacherEvents(await getTeacherEventAttendance(userId));
        setRecords([]);
      } else {
        setRecords(await getAttendanceHistory(userId));
        setTeacherEvents([]);
      }
    } catch (loadError: unknown) {
      const message = loadError instanceof Error ? loadError.message : String(loadError);
      setError(message.includes("Could not find the table 'public.attendance'")
        ? 'Attendance database setup is incomplete. Run supabase/schema.sql in the Supabase SQL Editor.'
        : 'Unable to load attendance history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  return (
    <Screen scroll={false}>
      <Text style={styles.title}>
        {role === 'teacher' ? 'Teacher Event Summary' : 'Attendance History'}
      </Text>

      {loading ? (
        <Text style={styles.subtitle}>Loading records...</Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : role === 'teacher' ? (
        teacherEvents.length === 0 ? (
          <Text style={styles.subtitle}>No events created yet.</Text>
        ) : (
          <FlatList
            data={teacherEvents}
            keyExtractor={(item) => item.eventId}
            style={styles.listView}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventMeta}>{item.eventId}</Text>
                <Text style={styles.eventMeta}>{item.attendeeCount} attendee(s)</Text>
                {item.attendees.map((attendee) => (
                  <Text key={`${attendee.studentId}-${attendee.scannedAt}`} style={styles.attendee}>
                    {shortId(attendee.studentId)} - {formatDate(attendee.scannedAt)}
                  </Text>
                ))}
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
          style={styles.listView}
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
    </Screen>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function shortId(id: string) {
  return id ? `...${id.slice(-8)}` : 'unknown';
}

const styles = StyleSheet.create({
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
  error: {
    fontSize: 14,
    color: '#C62828',
    lineHeight: 20,
    marginTop: 32,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 24,
  },
  listView: {
    flex: 1,
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
  attendee: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
});