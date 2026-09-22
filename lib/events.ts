import { supabase } from './supabase';

export type Event = {
  eventId: string;
  title: string;
  start: string;
  end: string;
  createdBy?: string | null;
};

export async function createEvent(event: Event): Promise<void> {
  const { error } = await supabase
    .from('events')
    .upsert(
      {
        event_code: event.eventId,
        title: event.title,
        start_time: event.start,
        end_time: event.end,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      },
      { onConflict: 'event_code' }
    );

  if (error) {
    throw error;
  }
}

export async function getEventsByTeacher(userId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', userId)
    .order('start_time', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    eventId: row.event_code,
    title: row.title,
    start: row.start_time,
    end: row.end_time,
    createdBy: row.created_by,
  }));
}

export async function getEventByCode(eventCode: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', eventCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    eventId: data.event_code,
    title: data.title,
    start: data.start_time,
    end: data.end_time,
    createdBy: data.created_by,
  };
}
