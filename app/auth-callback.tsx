import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [message, setMessage] = useState('Completing sign-in...');

  useEffect(() => {
    (async () => {
      try {
        const codeParam = params.code;
        const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;

        if (!code) {
          setMessage('No authorization code found. Please retry sign in.');
          return;
        }

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[AuthCallback] exchangeCodeForSession error:', error);
          setMessage('Unable to complete sign-in. Please try again.');
          return;
        }

        if (data?.session) {
          setMessage('Sign-in complete. Redirecting...');
          router.replace('/(tabs)');
          return;
        }

        setMessage('No active session found. Please sign in again.');
      } catch (error) {
        console.error('[AuthCallback]', error);
        setMessage(`Sign-in error: ${(error as Error).message}`);
      }
    })();
  }, [params.code, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#07C160" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});
