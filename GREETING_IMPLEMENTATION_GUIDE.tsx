/**
 * EXAMPLE: How to Use the Greeting System in Your Home Screen
 * 
 * This file shows you how to integrate the GreetingBanner component
 * into your app's main screen/dashboard
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSupabaseGreetings } from '@/hooks/useSupabaseGreetings';
import { GreetingBanner } from '@/components/GreetingBanner';
import { useAppStore } from '@/lib/store';

export default function HomeScreenExample() {
  // Get timezone from store (or use default)
  const { userTimezone } = useAppStore();

  // Use the greeting hook
  const { greeting, loading, error, refresh, timezone } = useSupabaseGreetings(userTimezone);

  return (
    <ScrollView style={styles.container}>
      {/* ====== GREETING BANNER (at top) ====== */}
      <GreetingBanner
        greeting={greeting}
        loading={loading}
        error={error}
        timezone={timezone}
        showAnimation={true}
        onRefresh={refresh}
      />

      {/* ====== REST OF YOUR HOME SCREEN CONTENT ====== */}
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Tolpar</Text>
        <Text style={styles.subtitle}>Start chatting with your contacts</Text>

        {/* Your other home screen components go here */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
});
