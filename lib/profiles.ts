import { useEffect, useSyncExternalStore } from 'react';

import { useAuth } from './auth';
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

/* ---------------- Shared profile store ---------------- */

type ProfileStore = {
  userId: string | null;
  profile: Profile | null;
  loaded: boolean;
  loading: boolean;
};

let store: ProfileStore = { userId: null, profile: null, loaded: false, loading: false };
const listeners = new Set<() => void>();

function emit(next: ProfileStore) {
  store = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return store;
}

export async function refreshProfile(userId: string | null | undefined): Promise<void> {
  if (!userId) {
    if (store.userId !== null || store.loaded) {
      emit({ userId: null, profile: null, loaded: false, loading: false });
    }
    return;
  }

  const sameUser = store.userId === userId;
  if (sameUser && store.loading) {
    return; // another screen is already fetching it
  }

  emit({
    userId,
    profile: sameUser ? store.profile : null,
    loaded: sameUser && store.loaded,
    loading: true,
  });

  let profile = sameUser ? store.profile : null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .abortSignal(controller.signal)
      .maybeSingle();

    if (error) {
      console.warn('Unable to load profile:', error.message);
    } else {
      profile = data as Profile | null;
    }
  } catch (error: unknown) {
    console.warn('Unable to load profile:', error);
  } finally {
    clearTimeout(timer);
  }

  if (store.userId !== userId) {
    return; // signed out or switched account while loading
  }

  emit({ userId, profile, loaded: true, loading: false });
}

/**
 * The signed-in user's role and profile.
 * `role` is null only while we genuinely don't know yet. Order of trust:
 *   1. profiles.role from the database
 *   2. role saved in the sign-up metadata (available instantly)
 *   3. 'student' once the fetch finished with nothing found
 */
export function useRole() {
  const { user } = useAuth();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (userId !== store.userId || !store.loaded) {
      refreshProfile(userId);
    }
  }, [userId]);

  const current = snapshot.userId === userId ? snapshot : null;
  const metadataRole = user?.user_metadata?.role as string | undefined;
  const databaseRole = current?.profile?.role;

  let role: UserRole | null = null;
  if (userId) {
    if (databaseRole) {
      role = normalizeRole(databaseRole);
    } else if (metadataRole) {
      role = normalizeRole(metadataRole);
    } else if (current?.loaded) {
      role = 'student';
    }
  }

  return {
    role,
    profile: current?.profile ?? null,
    loading: Boolean(userId) && !current?.loaded,
    refresh: () => refreshProfile(userId),
  };
}