import * as AppleAuthentication from 'expo-apple-authentication';
import * as LocalAuthentication from 'expo-local-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { Platform } from 'react-native';

const googleOAuthConfigured =
  !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  !!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  !!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const isExpoGo = Constants.appOwnership === 'expo';

const getGoogleRedirectUri = () => {
  const options: any = {
    scheme: 'tolpar',
    path: 'auth-callback',
  };
  if (Platform.OS !== 'web' && isExpoGo) {
    options.useProxy = true;
  }
  return AuthSession.makeRedirectUri(options);
};

// ============ GOOGLE AVAILABILITY CHECK ============

export const isGoogleAuthAvailable = (): boolean => {
  return googleOAuthConfigured;
};

export const signInWithGoogle = async () => {
  try {
    if (!googleOAuthConfigured) {
      throw new Error('Google OAuth is not configured. Add your client IDs to .env.local.');
    }

    const redirectTo = getGoogleRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw error;
    }

    if (!data?.url) {
      throw new Error('Unable to start Google sign-in.');
    }

    await WebBrowser.openBrowserAsync(data.url);
    return { success: true, provider: 'google', webAuth: true };
  } catch (error) {
    console.error('[GoogleSignIn]', error);
    throw error;
  }
};

// ============ APPLE SIGN-IN ============

export const isAppleAuthAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
};

export const signInWithApple = async () => {
  try {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-in is only available on iOS');
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.email && !credential.identityToken) {
      throw new Error('No credential data returned from Apple');
    }

    // For Apple OAuth, use the identityToken with Supabase
    if (credential.identityToken) {
      const { data: authData, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'tolpar://auth-callback',
        },
      });

      if (authError) throw authError;

      return {
        success: true,
        user: {
          id: credential.user,
          email: credential.email,
          name: credential.fullName?.givenName || '',
        },
        provider: 'apple',
        credential,
      };
    }

    throw new Error('No identity token from Apple');
  } catch (error: any) {
    if (error.code === 'ERR_CANCELED') {
      console.log('[AppleSignIn] User cancelled');
      return null;
    }
    console.error('[AppleSignIn]', error);
    throw error;
  }
};

// ============ BIOMETRIC AUTH (Face ID / Touch ID) ============

export const isBiometricAvailable = async (): Promise<{
  available: boolean;
  types: string[];
  strongBiometryIsAvailable: boolean;
}> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return { available: false, types: [], strongBiometryIsAvailable: false };
    }

    const savedBiometrics = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const strongBiometry = await LocalAuthentication.isEnrolledAsync();

    return {
      available: compatible && savedBiometrics.length > 0,
      types: savedBiometrics.map((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'Face ID';
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Fingerprint';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'Iris';
          default:
            return 'Biometric';
        }
      }),
      strongBiometryIsAvailable: strongBiometry,
    };
  } catch (error) {
    console.error('[BiometricCheck]', error);
    return { available: false, types: [], strongBiometryIsAvailable: false };
  }
};

export const authenticateWithBiometric = async (
  reason: string = 'Unlock Tolpar'
): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      disableDeviceFallback: false,
      fallbackLabel: 'Use passcode',
      // iOS specific
      //@ts-ignore
      authenticationTypes: [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION, LocalAuthentication.AuthenticationType.FINGERPRINT],
    });

    return result.success;
  } catch (error) {
    console.error('[BiometricAuth]', error);
    return false;
  }
};

// ============ LINK AUTH METHODS ============

export const linkGoogleToCurrentUser = async () => {
  try {
    //@ts-ignore
    const { data } = await GoogleSignIn.signIn();

    if (!data?.user?.email) {
      throw new Error('No email returned from Google');
    }

    // In a real app, you'd link this provider to the current Supabase user
    // This would require a backend function to handle provider linking

    return {
      success: true,
      provider: 'google',
      email: data.user.email,
    };
  } catch (error) {
    console.error('[LinkGoogle]', error);
    throw error;
  }
};

export const linkAppleToCurrentUser = async () => {
  try {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Link is only available on iOS');
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    return {
      success: true,
      provider: 'apple',
      email: credential.email,
    };
  } catch (error) {
    console.error('[LinkApple]', error);
    throw error;
  }
};

export const signOutGoogle = async () => {
  // No native Google Sign-in support in Expo Go; this is a no-op for now.
  return;
};
