import { useState, useEffect } from 'react';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

export type UserRole = 'student' | 'teacher';

type AuthState = {
    session: Session | null;
    user: User | null;
    loading: boolean;
};

let globalSession: Session | null = null;
let globalUser: User | null = null;
let globalLoading = false;
let listeners: Set<() => void> = new Set();
let authInitialized = false;

function notify() {
    listeners.forEach((l) => l());
}

export function setAuth(session: Session | null) {
    globalSession = session;
    globalUser = session?.user ?? null;
    globalLoading = false;
    notify();
}

function initializeAuth() {
    if (authInitialized) {
        return;
    }

    authInitialized = true;
    try {
        const handleDeepLink = async (url: string) => {
            const parsed = Linking.parse(url);
            const code = typeof parsed.queryParams?.code === 'string'
                ? parsed.queryParams.code
                : null;

            if (code) {
                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    console.warn('Unable to complete email confirmation:', error.message);
                } else {
                    setAuth(data.session);
                }
            }
        };

        if (Platform.OS !== 'web') {
            Linking.getInitialURL().then((url) => {
                if (url) {
                    return handleDeepLink(url);
                }
                return undefined;
            }).catch((error: unknown) => {
                console.warn('Unable to read the authentication link:', error);
            });

            const subscription =             Linking.addEventListener('url', ({ url }) => {
                handleDeepLink(url).catch((error: unknown) => {
                    console.warn('Unable to complete the authentication link:', error);
                });
            });
        }

        const sessionRequest = supabase.auth.getSession();
        const timeout = new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 5000);
        });

        Promise.race([sessionRequest, timeout])
            .then((result) => {
                if (!result) {
                    console.warn('Auth session restore timed out; continuing signed out.');
                    setAuth(null);
                    return;
                }

                const { data, error } = result;
                if (error) {
                    console.warn('Unable to restore auth session:', error.message);
                }
                setAuth(data.session);
            })
            .catch((error: unknown) => {
                console.warn('Unable to restore auth session:', error);
                setAuth(null);
            });

        supabase.auth.onAuthStateChange((_event, session) => {
            setAuth(session);
        });
    } catch (error: unknown) {
        console.warn('Unable to initialize authentication:', error);
        setAuth(null);
    }
}

export function useAuth(): AuthState {
    const [, forceRender] = useState(0);

    useEffect(() => {
        initializeAuth();
        const listener = () => forceRender((n) => n + 1);
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    }, []);

    return {
        session: globalSession,
        user: globalUser,
        loading: globalLoading,
    };
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
    supabase.auth.signOut().catch(() => { });
    return { error: null };
}
