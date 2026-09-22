import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    TouchableWithoutFeedback,
    Keyboard,
    Pressable,
} from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';
import { signUp, type UserRole } from '@/lib/auth';

export default function RegisterScreen() {
    const insets = useSafeAreaInsets();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<UserRole>('student');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        setError(null);

        if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
            setError('All fields are required.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        try {
            const { data, error: authError } = await signUp(email.trim(), password, fullName.trim(), role);

            if (authError) {
                setError(authError.message);
            } else {
                if (data.session) {
                    setSuccess(true);
                } else {
                    setSuccess(true);
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (message.toLowerCase().includes('network request failed')) {
                setError('Cannot reach the authentication server. Check your internet connection and Supabase URL, then restart Expo.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.headerContainer}>
                            <Header title="QR Attendance" />
                        </View>

                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Register to start recording attendance</Text>

                        {success ? (
                            <View style={styles.successContainer}>
                                <Text style={styles.successTitle}>Check your email!</Text>
                                <Text style={styles.successText}>
                                    We sent a confirmation link to {email}. Click the link to verify your
                                    account, then come back and sign in.
                                </Text>
                                <Link href="/login" style={styles.link}>
                                    Back to Sign In
                                </Link>
                            </View>
                        ) : (
                            <View style={styles.form}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Your full name"
                                    placeholderTextColor={COLORS.textSecondary}
                                    editable={!loading}
                                />

                                <Text style={styles.label}>I am a</Text>
                                <View style={styles.roleRow}>
                                    {(['student', 'teacher'] as UserRole[]).map((option) => (
                                        <Pressable
                                            key={option}
                                            style={[styles.roleButton, role === option && styles.roleButtonActive]}
                                            onPress={() => setRole(option)}
                                            disabled={loading}
                                        >
                                            <Text style={[styles.roleButtonText, role === option && styles.roleButtonTextActive]}>
                                                {option === 'student' ? 'Student' : 'Teacher'}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="your.email@school.edu"
                                    placeholderTextColor={COLORS.textSecondary}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    editable={!loading}
                                />

                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="At least 6 characters"
                                    placeholderTextColor={COLORS.textSecondary}
                                    secureTextEntry
                                    editable={!loading}
                                />

                                <Text style={styles.label}>Confirm Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Re-enter your password"
                                    placeholderTextColor={COLORS.textSecondary}
                                    secureTextEntry
                                    editable={!loading}
                                />

                                {error && <Text style={styles.error}>{error}</Text>}

                                {loading ? (
                                    <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
                                ) : (
                                    <AppButton
                                        theme="primary"
                                        title="Sign Up"
                                        icon="person-add-outline"
                                        onPress={handleRegister}
                                    />
                                )}
                            </View>
                        )}

                        {!success && (
                            <Link href="/login" style={styles.link}>
                                Already have an account? Sign In
                            </Link>
                        )}
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
    },
    form: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 6,
        marginTop: 10,
    },
    roleRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
        marginBottom: 4,
    },
    roleButton: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingVertical: 12,
        alignItems: 'center',
    },
    roleButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    roleButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    roleButtonTextActive: {
        color: '#FFFFFF',
    },
    input: {
        backgroundColor: COLORS.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    error: {
        fontSize: 14,
        color: '#C62828',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    loader: {
        marginVertical: 16,
    },
    link: {
        fontSize: 14,
        color: COLORS.primary,
        textAlign: 'center',
        fontWeight: '600',
    },
    successContainer: {
        alignItems: 'center',
        marginBottom: 24,
        padding: 20,
        backgroundColor: COLORS.card,
        borderRadius: 14,
    },
    successTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    successText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
});
