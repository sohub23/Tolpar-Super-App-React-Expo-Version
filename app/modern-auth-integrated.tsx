import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  isBiometricAvailable, 
  authenticateWithBiometric,
  signInWithGoogle,
  signInWithApple,
  isAppleAuthAvailable,
  isGoogleAuthAvailable,
} from '@/lib/modern-auth';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { Fingerprint, Apple, Eye, EyeOff } from 'lucide-react-native';

/**
 * MODERN AUTH INTEGRATION EXAMPLE
 * 
 * This shows how to integrate modern auth (Google, Apple, Face ID) 
 * with existing email/password login in a unified screen.
 */

export default function ModernIntegratedLoginScreen() {
  const router = useRouter();
  const { setAuthUser } = useAppStore();

  // Auth state
  const [mode, setMode] = useState<'modern' | 'email'>('modern');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Feature availability
  const [biometricAvailable, setBiometricAvailable] = useState<{
    available: boolean;
    types: string[];
  }>({ available: false, types: [] });
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState(false);

  useEffect(() => {
    checkAuthAvailability();
  }, []);

  const checkAuthAvailability = async () => {
    try {
      const bio = await isBiometricAvailable();
      setBiometricAvailable({
        available: bio.available,
        types: bio.types,
      });

      const apple = await isAppleAuthAvailable();
      setAppleAvailable(apple);

      const google = isGoogleAuthAvailable();
      setGoogleAvailable(google);
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  // ============ BIOMETRIC AUTH ============

  const handleBiometricSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      const bioType = biometricAvailable.types[0] || 'Biometric';
      const success = await authenticateWithBiometric(`Unlock Tolpar with ${bioType}`);

      if (success) {
        // After biometric auth, get the current Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError('Please sign in with your email first to enable biometric login');
          setMode('email');
          return;
        }

        // Navigate to app
        router.replace('/(tabs)');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ============ GOOGLE AUTH ============

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await signInWithGoogle();

      if (result?.success) {
        if (result.webAuth) {
          setError('Google sign-in opened in browser. Complete the flow and return to the app.');
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError('Unable to create session');
          return;
        }

        const user = session.user;
        setAuthUser({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        });

        router.replace('/(tabs)');
      }
    } catch (err) {
      const errorMsg = (err as Error).message;
      if (!errorMsg.includes('ERR_CANCELED')) {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============ APPLE AUTH ============

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      if (Platform.OS !== 'ios') {
        setError('Apple Sign-in is only available on iOS');
        return;
      }

      const result = await signInWithApple();

      if (result) {
        // Sign in with Apple through Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
        });

        if (error) throw error;

        // Get updated session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setError('Unable to create session');
          return;
        }

        // Store user data
        const user = session.user;
        setAuthUser({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || 'User',
        });

        // Navigate to app
        router.replace('/(tabs)');
      }
    } catch (err) {
      const errorMsg = (err as Error).message;
      if (!errorMsg.includes('ERR_CANCELED')) {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============ EMAIL/PASSWORD AUTH ============

  const handleEmailSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      if (!email || !password) {
        setError('Please enter email and password');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        setError('Unable to sign in');
        return;
      }

      // Store user data
      setAuthUser({
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || '',
      });

      router.replace('/(tabs)');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError('');

      if (!email || !password) {
        setError('Please enter email and password');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        setError('Unable to create account');
        return;
      }

      Alert.alert('Success', 'Account created! Please check your email to confirm.');
      setMode('modern');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ============ RENDER ============

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <KeyboardAvoidingView behavior="padding" style={s.flex}>
        <LinearGradient colors={['#FFFFFF', '#F8F8F8']} style={s.gradient}>
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={s.header}>
              <Text style={s.logo}>Tolpar</Text>
              <Text style={s.title}>
                {mode === 'modern' ? 'Welcome' : 'Sign in with Email'}
              </Text>
              <Text style={s.subtitle}>
                {mode === 'modern'
                  ? 'Quick and secure access'
                  : 'Enter your credentials'}
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* MODERN AUTH MODE */}
            {mode === 'modern' && (
              <View>
                {/* Biometric */}
                {biometricAvailable.available && (
                  <TouchableOpacity
                    style={s.bioButton}
                    onPress={handleBiometricSignIn}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#07C160', '#00A84F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.bioGradient}
                    >
                      {loading ? (
                        <ActivityIndicator size="large" color="#FFF" />
                      ) : (
                        <>
                          <Fingerprint size={32} color="#FFF" strokeWidth={1.5} />
                          <Text style={s.bioText}>
                            Sign in with {biometricAvailable.types[0]}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {/* Divider */}
                {biometricAvailable.available && (
                  <View style={s.divider}>
                    <View style={s.dividerLine} />
                    <Text style={s.dividerText}>or</Text>
                    <View style={s.dividerLine} />
                  </View>
                )}

                {/* Google */}
                {googleAvailable && (
                  <TouchableOpacity
                    style={s.authButton}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#FFF', '#F5F5F5']}
                      style={s.authGradient}
                    >
                      <Text style={s.googleIcon}>🔍</Text>
                      <Text style={s.authText}>Continue with Google</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {/* Apple */}
                {appleAvailable && Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={s.authButton}
                    onPress={handleAppleSignIn}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#000', '#1C1C1E']}
                      style={s.authGradient}
                    >
                      <Apple size={20} color="#FFF" strokeWidth={1.5} />
                      <Text style={s.authTextWhite}>Continue with Apple</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {/* Email Fallback */}
                <TouchableOpacity
                  style={s.emailFallback}
                  onPress={() => setMode('email')}
                  disabled={loading}
                >
                  <Text style={s.emailFallbackText}>
                    Continue with Email
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* EMAIL MODE */}
            {mode === 'email' && (
              <View>
                {/* Email Input */}
                <View style={s.inputContainer}>
                  <TextInput
                    style={s.input}
                    placeholder="Email address"
                    placeholderTextColor="#C7C7CC"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Password Input */}
                <View style={s.inputContainer}>
                  <TextInput
                    style={s.input}
                    placeholder="Password"
                    placeholderTextColor="#C7C7CC"
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={s.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#8E8E93" strokeWidth={1.5} />
                    ) : (
                      <Eye size={20} color="#8E8E93" strokeWidth={1.5} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={s.signInButton}
                  onPress={handleEmailSignIn}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#07C160', '#00A84F']}
                    style={s.signInGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={s.signInText}>Sign In</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Sign Up Option */}
                <TouchableOpacity
                  style={s.signUpButton}
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  <Text style={s.signUpText}>Don&apos;t have an account? Sign up</Text>
                </TouchableOpacity>

                {/* Back Button */}
                <TouchableOpacity
                  style={s.backButton}
                  onPress={() => {
                    setMode('modern');
                    setError('');
                  }}
                  disabled={loading}
                >
                  <Text style={s.backText}>← Back to quick sign in</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Privacy Notice */}
            <View style={s.privacyContainer}>
              <Text style={s.privacyText}>
                By signing in, you agree to our{' '}
                <Text style={s.privacyLink}>Terms.</Text>
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#07C160',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
  },
  bioButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bioGradient: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  bioText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    fontSize: 12,
    color: '#8E8E93',
    marginHorizontal: 12,
    fontWeight: '600',
  },
  authButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  authGradient: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  authText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  authTextWhite: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  googleIcon: {
    fontSize: 18,
  },
  emailFallback: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  emailFallbackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#07C160',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FFF',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 8,
  },
  signInButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  signInGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  signUpButton: {
    paddingVertical: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#07C160',
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  privacyContainer: {
    marginTop: 32,
  },
  privacyText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  privacyLink: {
    color: '#07C160',
    fontWeight: '600',
  },
});
