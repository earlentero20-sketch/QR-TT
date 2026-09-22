import { supabase } from './supabase';

export type UserRole = 'student' | 'teacher';

export function normalizeRole(role?: string | null): UserRole {
  return role === 'teacher' ? 'teacher' : 'student';
}

export function isTeacherRole(role?: string | null): boolean {
  return normalizeRole(role) === 'teacher';
}

export type Profile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: UserRole | null;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('getProfile error:', error.message);
    return null;
  }

  return data as Profile | null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'role'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates }, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export async function upsertProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'role'>>
): Promise<Profile> {
  return updateProfile(userId, updates);
}
