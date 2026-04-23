import React, { useEffect, useState } from 'react';
import { config } from './config';
import { View, ViewProps, Appearance } from 'react-native';
import { flattenStyle } from '@/utils/flatten-style';
import { OverlayProvider } from '@gluestack-ui/core/overlay/creator';
import { ToastProvider } from '@gluestack-ui/core/toast/creator';

export type ModeType = 'light' | 'dark' | 'system';

export function GluestackUIProvider({
  mode = 'light',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const getInitialScheme = (): 'light' | 'dark' => {
    if (mode === 'system') {
      return (Appearance.getColorScheme() || 'light') as 'light' | 'dark';
    }
    return mode === 'dark' ? 'dark' : 'light';
  };

  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(getInitialScheme());

  useEffect(() => {
    if (mode === 'system') {
      const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
        setColorScheme((newColorScheme || 'light') as 'light' | 'dark');
      });
      return () => subscription.remove();
    } else {
      setColorScheme(mode === 'dark' ? 'dark' : 'light');
    }
  }, [mode]);

  return (
    <View
      style={flattenStyle([
        config[colorScheme],
        { flex: 1, height: '100%', width: '100%' },
        props.style,
      ])}
    >
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
