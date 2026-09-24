import { supabase } from './supabase';
import { getEventByCode } from './events';
import { parseQRPayload } from './qr';

export type AttendanceRecord = {
  id: number;
  eventId: string;
  eventTitle: string;
  scannedAt: string;
};

export type RegisterResult = {
  success: boolean;
  message: string;
  eventTitle?: string;
};

export type TeacherEventSummary = {
  eventId: string;
  title: string;
  attendeeCount: number;
};

export type TeacherEventAttendance = TeacherEventSummary & {
  start: string;
  end: string;
  attendees: { studentId: string; scannedAt: string }[];
};

export type EventPayload = {
  v: number;
  event?: string;
  eventId?: string;
  title?: string;
  start?: string;
  end?: string;
};

export async function registerAttendance(
  rawPayload: string,
  studentId: string
): Promise<RegisterResult> {
  const parsed = parseQRPayload(rawPayload);

  if (!parsed.ok) {
    return { success: false, message: parsed.message };
  }

  const eventId = parsed.payload.event;
  const event = await getEventByCode(eventId);
  if (!event) {
    return { success: false, message: 'Event not found.' };
  }

  const now = Date.now();
  const start = event.start ? new Date(event.start).getTime() : null;
  const end = event.end ? new Date(event.end).getTime() : null;

  if (start && now < start) {
    return { success: false, message: 'Event has not started yet.' };
  }
  if (end && now > end) {
    return { success: false, message: 'Event has already ended.' };
  }

  const { error } = await supabase.from('attendance').insert({
    student_id: studentId,
    event_code: eventId,
    scanned_at: new Date().toISOString(),
  });

  if (error) {
    if ((error as any).code === '23505') {
      return {
        success: false,
        message: 'Already registered for this event.',
        eventTitle: event.title,
      };
    }

    return { success: false, message: 'Unable to save attendance.' };
  }

  return { success: true, message: 'Attendance recorded!', eventTitle: event.title };
}

export async function getAttendanceHistory(studentId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, event_code, scanned_at, events(title)')
    .eq('student_id', studentId)
    .order('scanned_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    eventId: row.event_code,
    eventTitle: row.events?.title ?? row.event_code,
    scannedAt: row.scanned_at,
  }));
}

export async function getTeacherEventSummary(userId: string): Promise<TeacherEventSummary[]> {
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('event_code, title')
    .eq('created_by', userId)
    .order('start_time', { ascending: false });

  if (eventsError) {
    throw eventsError;
  }

  const eventCodes = (events ?? []).map((event) => event.event_code);

  if (!eventCodes.length) {
    return [];
  }

  const { data: attendanceRows, error: attendanceError } = await supabase
    .from('attendance')
    .select('event_code')
    .in('event_code', eventCodes);

  if (attendanceError) {
    throw attendanceError;
  }

  const counts: Record<string, number> = {};
  for (const row of attendanceRows ?? []) {
    counts[row.event_code] = (counts[row.event_code] ?? 0) + 1;
  }

  return (events ?? []).map((event) => ({
    eventId: event.event_code,
    title: event.title,
    attendeeCount: counts[event.event_code] ?? 0,
  }));
}

export async function getTeacherEventAttendance(userId: string): Promise<TeacherEventAttendance[]> {
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('event_code, title, start_time, end_time')
    .eq('created_by', userId)
    .order('start_time', { ascending: false });

  if (eventsError) {
    throw eventsError;
  }

  const eventCodes = (events ?? []).map((event) => event.event_code);
  if (!eventCodes.length) {
    return [];
  }

  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('event_code, student_id, scanned_at')
    .in('event_code', eventCodes)
    .order('scanned_at', { ascending: false });

  if (attendanceError) {
    throw attendanceError;
  }

  return (events ?? []).map((event) => {
    const attendees = (attendance ?? [])
      .filter((row) => row.event_code === event.event_code)
      .map((row) => ({ studentId: row.student_id, scannedAt: row.scanned_at }));

    return {
      eventId: event.event_code,
      title: event.title,
      start: event.start_time,
      end: event.end_time,
      attendeeCount: attendees.length,
      attendees,
    };
  });
}
