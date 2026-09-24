import { useSyncExternalStore } from 'react';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from './supabase';

export type UserRole = 'student' | 'teacher';

export type AuthState = {
    session: Session | null;
    user: User | null;
    /** true until the stored session has been restored (or the safety timeout fires) */
    loading: boolean;
};

let state: AuthState = { session: null, user: null, loading: true };
const listeners = new Set<() => void>();
let initialized = false;

function emit(next: AuthState) {
    state = next;
    listeners.forEach((listener) => listener());
}

export function setAuth(session: Session | null) {
    emit({ session, user: session?.user ?? null, loading: false });
}

function initializeAuth() {
    if (initialized) {
        return;
    }
    initialized = true;

    // Supabase fires INITIAL_SESSION once the stored session is restored, then
    // SIGNED_IN / TOKEN_REFRESHED / SIGNED_OUT. Keep this callback synchronous.
    supabase.auth.onAuthStateChange((_event, session) => {
        setAuth(session);
    });

    // Safety net: never sit on the loading screen forever if the lookup hangs.
    setTimeout(() => {
        if (state.loading) {
            setAuth(null);
        }
    }, 5000);
}

function subscribe(listener: () => void) {
    initializeAuth();
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function getSnapshot() {
    return state;
}

export function useAuth(): AuthState {
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export async function signUp(
    email: string,
    password: string,
    fullName?: string,
    role: UserRole = 'student'
) {
    const redirectTo = Platform.OS === 'web'
        ? `${window.location.origin}/login`
        : Linking.createURL('login');
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: redirectTo,
            data: {
                full_name: fullName?.trim() || null,
                role,
            },
        },
    });
    if (!error && data.session) {
        setAuth(data.session);
    }
    return { data, error };
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
        setAuth(data.session);
    }
    return { data, error };
}

export async function signOut() {
    setAuth(null);
    // 'local' clears this device's session without needing the network.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => { });
    return { error: null };
}