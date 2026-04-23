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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  isBiometricAvailable,
  authenticateWithBiometric,
  signInWithGoogle,
  signInWithApple,
  isAppleAuthAvailable,
} from '@/lib/modern-auth';
import { Fingerprint, Apple, LogIn } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ModernAuthScreen() {
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState<{
    available: boolean;
    types: string[];
  }>({ available: false, types: [] });
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [biometricPrompt, setBiometricPrompt] = useState('');

  const { setAuthUser } = useAppStore();

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      // Check biometric availability
      const bio = await isBiometricAvailable();
      setBiometricAvailable({
        available: bio.available,
        types: bio.types,
      });

      if (bio.types.includes('Face ID')) {
        setBiometricPrompt('Use Face ID to sign in');
      } else if (bio.types.includes('Fingerprint')) {
        setBiometricPrompt('Use Fingerprint to sign in');
      }

      // Check Apple availability
      const apple = await isAppleAuthAvailable();
      setAppleAvailable(apple);
    } catch (error) {
      console.error('Error checking auth availability:', error);
    }
  };

  const handleBiometricSignIn = async () => {
    try {
      setLoading(true);
      const success = await authenticateWithBiometric(biometricPrompt);

      if (success) {
        // After biometric auth, user needs to have an existing account
        // In real app, store biometric token for subsequent logins
        Alert.alert('Success', 'Biometric authentication successful!');
        // Navigate to app or prompt for account linking
      }
    } catch (error) {
      Alert.alert('Biometric Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();

      if (result.success && result.webAuth) {
        Alert.alert('Google Sign-in', 'Google sign-in opened in your browser. Complete the flow and return to the app.');
      }
    } catch (error) {
      Alert.alert('Google Sign-in Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      const result = await signInWithApple();

      if (result) {
        // User signed in successfully with Apple
        Alert.alert('Success', `Signed in with Apple`);
        // setAuthUser(result.user);
        // setAuthMode('apple');
      }
    } catch (error) {
      Alert.alert('Apple Sign-in Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <LinearGradient colors={['#FFFFFF', '#F8F8F8']} style={s.gradient}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Welcome Back</Text>
            <Text style={s.subtitle}>
              Sign in with your preferred method
            </Text>
          </View>

          {/* Biometric Option */}
          {biometricAvailable.available && (
            <View style={s.section}>
              <TouchableOpacity
                style={s.bioButton}
                activeOpacity={0.8}
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
                      <Text style={s.bioText}>{biometricPrompt}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Divider */}
          {biometricAvailable.available && (
            <View style={s.dividerContainer}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or continue with</Text>
              <View style={s.dividerLine} />
            </View>
          )}

          {/* Google Sign-in */}
          <TouchableOpacity
            style={s.authButton}
            activeOpacity={0.8}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FFF', '#F5F5F5']}
              style={s.authButtonGradient}
            >
              <Text style={s.googleIcon}>🔍</Text>
              <View style={s.authButtonContent}>
                <Text style={s.authButtonText}>Sign in with Google</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Apple Sign-in */}
          {appleAvailable && Platform.OS === 'ios' && (
            <TouchableOpacity
              style={s.authButton}
              activeOpacity={0.8}
              onPress={handleAppleSignIn}
              disabled={loading}
            >
              <LinearGradient
                colors={['#000', '#1C1C1E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.authButtonGradient}
              >
                <Apple size={20} color="#FFF" strokeWidth={1.5} />
                <View style={s.authButtonContent}>
                  <Text style={s.authButtonTextDark}>Sign in with Apple</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Email/Password Option */}
          <TouchableOpacity
            style={s.authButton}
            activeOpacity={0.8}
            disabled={loading}
          >
            <LinearGradient
              colors={['#E8F5FE', '#D4EBFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.authButtonGradient}
            >
              <LogIn size={20} color="#2E7D9B" strokeWidth={1.5} />
              <View style={s.authButtonContent}>
                <Text style={s.authButtonTextEmail}>Sign in with Email</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Privacy Notice */}
          <View style={s.privacyContainer}>
            <Text style={s.privacyText}>
              By signing in, you agree to our{' '}
              <Text style={s.privacyLink}>Terms of Service</Text> and{' '}
              <Text style={s.privacyLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  bioButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  bioGradient: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
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
  authButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  authButtonContent: {
    flex: 1,
    justifyContent: 'center',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  authButtonTextDark: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  authButtonTextEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D9B',
  },
  googleIcon: {
    fontSize: 20,
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
