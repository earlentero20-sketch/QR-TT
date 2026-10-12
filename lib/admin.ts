import { supabase } from './supabase';
import type { UserRole } from './profiles';

export type AdminProfile = {
    id: string;
    email: string | null;
    full_name: string | null;
    role: UserRole;
    created_at: string;
};

export async function listAllProfiles(): Promise<AdminProfile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminProfile[];
}

export async function setUserRole(userId: string, role: UserRole) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) throw error;
}

export type AdminEvent = {
    event_code: string;
    title: string;
    start_time: string;
    end_time: string;
    created_by: string;
    creator_email?: string | null;
};

export async function listAllEvents(): Promise<AdminEvent[]> {
    const [eventsRes, profilesRes] = await Promise.all([
        supabase
            .from('events')
            .select('event_code, title, start_time, end_time, created_by')
            .order('start_time', { ascending: false }),
        supabase.from('profiles').select('id, email'),
    ]);
    if (eventsRes.error) throw eventsRes.error;
    if (profilesRes.error) throw profilesRes.error;

    const emailById = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p.email as string | null]));
    return (eventsRes.data ?? []).map((row: any) => ({
        ...row,
        creator_email: emailById.get(row.created_by) ?? null,
    }));
}

export async function deleteEvent(eventCode: string) {
    const { error } = await supabase.from('events').delete().eq('event_code', eventCode);
    if (error) throw error;
}

export type AdminAttendanceRecord = {
    id: number;
    student_id: string;
    student_email?: string | null;
    event_code: string;
    event_title?: string | null;
    scanned_at: string;
};

export async function listAllAttendance(): Promise<AdminAttendanceRecord[]> {
    const [attendanceRes, profilesRes, eventsRes] = await Promise.all([
        supabase.from('attendance').select('id, student_id, event_code, scanned_at').order('scanned_at', { ascending: false }),
        supabase.from('profiles').select('id, email'),
        supabase.from('events').select('event_code, title'),
    ]);
    if (attendanceRes.error) throw attendanceRes.error;
    if (profilesRes.error) throw profilesRes.error;
    if (eventsRes.error) throw eventsRes.error;

    const emailById = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p.email as string | null]));
    const titleByCode = new Map((eventsRes.data ?? []).map((e: any) => [e.event_code, e.title as string]));

    return (attendanceRes.data ?? []).map((row: any) => ({
        id: row.id,
        student_id: row.student_id,
        student_email: emailById.get(row.student_id) ?? null,
        event_code: row.event_code,
        event_title: titleByCode.get(row.event_code) ?? null,
        scanned_at: row.scanned_at,
    }));
}

export async function deleteAttendanceRecord(id: number) {
    const { error } = await supabase.from('attendance').delete().eq('id', id);
    if (error) throw error;
}

export async function addAttendanceRecord(studentEmail: string, eventCode: string) {
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', studentEmail.trim())
        .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new Error('No account found with that email.');

    const { error } = await supabase
        .from('attendance')
        .insert({ student_id: profile.id, event_code: eventCode.trim() });
    if (error) throw error;
}

export type SystemStats = {
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
    totalEvents: number;
    totalAttendance: number;
};

export async function getSystemStats(): Promise<SystemStats> {
    const [profiles, events, attendance] = await Promise.all([
        supabase.from('profiles').select('role'),
        supabase.from('events').select('event_code', { count: 'exact', head: true }),
        supabase.from('attendance').select('id', { count: 'exact', head: true }),
    ]);

    if (profiles.error) throw profiles.error;
    if (events.error) throw events.error;
    if (attendance.error) throw attendance.error;

    const roles = (profiles.data ?? []) as { role: string }[];
    return {
        totalStudents: roles.filter((r) => r.role === 'student').length,
        totalTeachers: roles.filter((r) => r.role === 'teacher').length,
        totalAdmins: roles.filter((r) => r.role === 'admin').length,
        totalEvents: events.count ?? 0,
        totalAttendance: attendance.count ?? 0,
    };
}