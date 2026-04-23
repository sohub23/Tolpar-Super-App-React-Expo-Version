import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import type { CurrentGreeting } from '@/types/greetings';

interface GreetingBannerProps {
  greeting: CurrentGreeting | null;
  loading?: boolean;
  error?: string | null;
  timezone?: string;
  showAnimation?: boolean;
  onRefresh?: () => void;
}

/**
 * GreetingBanner Component
 * Displays personalized greeting based on time, festival, or manual override
 */
export const GreetingBanner: React.FC<GreetingBannerProps> = ({
  greeting,
  loading = false,
  error,
  timezone,
  showAnimation = true,
  onRefresh,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-20)).current;

  // Animate in on mount or greeting change
  useEffect(() => {
    if (greeting && !loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [greeting, loading, fadeAnim, slideAnim]);

  // Handle error display
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading greeting</Text>
          {onRefresh && (
            <Text style={styles.retryText} onPress={onRefresh}>
              Tap to retry
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Handle loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#07C160" />
      </View>
    );
  }

  // No greeting to display
  if (!greeting || greeting.type === 'none') {
    return null;
  }

  // Determine banner color based on greeting type
  const bannerStyle = getBannerStyle(greeting.type);

  return (
    <Animated.View
      style={[
        styles.container,
        bannerStyle.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.text, bannerStyle.text]}>
          {greeting.emoji && `${greeting.emoji} `}
          {greeting.message}
        </Text>

        {/* Debug info (show in dev only) */}
        {__DEV__ && (
          <Text style={styles.debugText}>
            {greeting.source}
            {timezone && ` • ${timezone}`}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

/**
 * Get banner styling based on greeting type
 */
function getBannerStyle(type: CurrentGreeting['type']) {
  const styles_map = {
    manual: {
      container: { backgroundColor: '#FFF3CD' }, // Yellow
      text: { color: '#856404' },
    },
    festival: {
      container: { backgroundColor: '#D1ECF1' }, // Light cyan
      text: { color: '#0C5460' },
    },
    time: {
      container: { backgroundColor: '#E7F3FF' }, // Light blue
      text: { color: '#004085' },
    },
    none: {
      container: { backgroundColor: '#F8F9FA' },
      text: { color: '#495057' },
    },
  };

  return styles_map[type];
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#07C160',
  },
  content: {
    gap: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#FFE0E0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF4444',
  },
  errorText: {
    color: '#CC0000',
    fontSize: 13,
    fontWeight: '500',
  },
  retryText: {
    color: '#0066FF',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
});

export default GreetingBanner;
