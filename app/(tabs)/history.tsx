import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import Screen from '@/components/Screen';
import StatusBadge from '@/components/StatusBadge';
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const userId = user?.id;

  const loadHistory = useCallback(
    async (isRefresh = false) => {
      if (!userId || !role) {
        return;
      }

      setError(null);
      if (isRefresh) setRefreshing(true);

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
        setError(
          message.includes("Could not find the table 'public.attendance'")
            ? 'Attendance database setup is incomplete. Run supabase/schema.sql in the Supabase SQL Editor.'
            : 'Unable to load attendance history. Please try again.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, role]
  );

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const filteredTeacherEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teacherEvents;
    return teacherEvents.filter(
      (event) => event.title.toLowerCase().includes(q) || event.eventId.toLowerCase().includes(q)
    );
  }, [teacherEvents, query]);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (record) => record.eventTitle.toLowerCase().includes(q) || record.eventId.toLowerCase().includes(q)
    );
  }, [records, query]);

  const showSearch = role === 'teacher' ? teacherEvents.length > 0 : records.length > 0;

  return (
    <Screen scroll={false}>
      <Text style={styles.title}>
        {role === 'teacher' ? 'Teacher Event Summary' : 'Attendance History'}
      </Text>

      {showSearch && (
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title or code"
          placeholderTextColor={COLORS.textSecondary}
          autoCapitalize="none"
        />
      )}

      {loading ? (
        <Text style={styles.subtitle}>Loading records...</Text>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : role === 'teacher' ? (
        filteredTeacherEvents.length === 0 ? (
          <Text style={styles.subtitle}>
            {teacherEvents.length === 0 ? 'No events created yet.' : 'No events match your search.'}
          </Text>
        ) : (
          <FlatList
            data={filteredTeacherEvents}
            keyExtractor={(item) => item.eventId}
            style={styles.listView}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} tintColor={COLORS.primary} />
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventMeta}>{item.eventId}</Text>
                <StatusBadge start={item.start} end={item.end} />
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
      ) : filteredRecords.length === 0 ? (
        <Text style={styles.subtitle}>
          {records.length === 0
            ? 'No records yet. Scan a QR code to register your attendance.'
            : 'No records match your search.'}
        </Text>
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => String(item.id)}
          style={styles.listView}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} tintColor={COLORS.primary} />
          }
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
    marginBottom: 12,
  },
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