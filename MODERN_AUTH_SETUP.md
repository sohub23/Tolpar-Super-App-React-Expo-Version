# Modern Authentication Setup Guide

This guide explains how to set up Google Sign-in, Apple Sign-in with PassKey/Face ID, and biometric authentication for your Tolpar app.

## 1. Google Sign-in Setup

### Android Configuration

1. **Get Google Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable "Google+ API"
   - Create OAuth 2.0 credentials (Android)
   - Add SHA-1 fingerprint of your app

2. **Get SHA-1 Fingerprint:**
   ```bash
   # For debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # For release keystore
   keytool -list -v -keystore /path/to/release.keystore
   ```

3. **Add to app.json:**
   ```json
   {
     "expo": {
       "plugins": [
         [
           "@react-native-google-signin/google-signin",
           {
             "googleServicesFile": "./google-services.json"
           }
         ]
       ]
     }
   }
   ```

### iOS Configuration

1. **Get Google Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials (iOS)
   - Download GoogleService-Info.plist

2. **Add to app.json:**
   ```json
   {
     "expo": {
       "plugins": [
         [
           "@react-native-google-signin/google-signin",
           {
             "googleServicesFile": "./GoogleService-Info.plist"
           }
         ]
       ]
     }
   }
   ```

### Set Environment Variables

Create `.env.local` file:
```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

---

## 2. Apple Sign-in Setup

### iOS Requirements

1. **Enable Sign in with Apple:**
   - Open Xcode
   - Select your project > Targets > Signing & Capabilities
   - Click "+ Capability" > Search "Sign in with Apple"
   - Add "Sign in with Apple"

2. **App Configuration in Xcode:**
   - Team ID: needed for certificate
   - Bundle ID: must match your app's bundle ID

3. **Configure in Supabase (Optional):**
   - Go to Supabase Auth > Providers > Apple
   - Add your Apple Service ID and Team ID

### app.json Configuration

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.tolpar.app"
    },
    "plugins": [
      "expo-apple-authentication"
    ]
  }
}
```

---

## 3. Face ID / Biometric Setup

### iOS

Face ID is automatically available if:
- Device has Face ID capability
- App requests `NSFaceIDUsageDescription` in Info.plist

The `expo-local-authentication` package handles this automatically.

### Android

For Android 9+:
- Biometric API automatically available
- Supports fingerprint, face, iris
- Requires `USE_BIOMETRIC` permission

---

## 4. Supabase Integration

### Modern Auth Flow

```
User Opens App
    ↓
Check Biometric Available
    ↓
    ├─→ Available → Show "Sign in with Face ID" button
    │
Check Installed Providers
    ↓
    ├─→ iOS → Show "Sign in with Apple" button
    ├─→ Android/iOS → Show "Sign in with Google" button
    └─→ Show "Sign in with Email" button
```

### Supabase Config

1. **Enable OAuth Providers:**
   - Go to Supabase Project > Authentication > Providers
   - Enable Google
   - Enable Apple (iOS only)

2. **Add Redirect URL:**
   - Add `tolpar://auth-callback` to allowed redirect URLs

---

## 5. Usage Example

### Basic Sign-in Flow

```typescript
import { signInWithGoogle, signInWithApple, authenticateWithBiometric } from '@/lib/modern-auth';

// Google Sign-in
const handleGoogleSignIn = async () => {
  const result = await signInWithGoogle();
  // User is now authenticated with Google OAuth through Supabase
};

// Apple Sign-in
const handleAppleSignIn = async () => {
  const result = await signInWithApple();
  // User is now authenticated with Apple OAuth through Supabase
};

// Biometric Auth (Face ID on iOS, Fingerprint on Android)
const handleBiometricSignIn = async () => {
  const success = await authenticateWithBiometric('Unlock Tolpar');
  if (success) {
    // User verified via Face ID/Fingerprint
  }
};
```

---

## 6. Environment Variables Reference

Add these to your `.env.local` file:

```env
# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxx.apps.googleusercontent.com

# Supabase (already configured)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Apple OAuth in Supabase
APPLE_SERVICE_ID=com.tolpar.service
APPLE_TEAM_ID=your-team-id
```

---

## 7. Testing Locally

```bash
# Test on iOS Simulator
npm run ios

# Test on Android Emulator
npm run android

# Test with specific provider (requires real device for biometric)
npx expo start --ios
```

---

## 8. Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Use redirect URLs** - Set specific OAuth redirect URLs
3. **Validate tokens** - Always verify tokens server-side via Supabase
4. **Secure storage** - Tokens stored automatically by Supabase
5. **Require strong biometric** - Use `strongBiometryIsAvailable`

---

## 9. Troubleshooting

### Google Sign-in Issues

- **"Sign in cancelled"** - User dismissed the sign-in dialog
- **"No services available"** - Google Play Services not installed (Android)
- **"Invalid Client ID"** - Verify credentials in console and `.env`

### Apple Sign-in Issues

- **"Not available"** - Only works on iOS 13+
- **"User cancelled"** - User dismissed Apple Sign-in dialog
- **"Invalid Bundle ID"** - Bundle ID doesn't match Xcode config

### Biometric Issues

- **"Not available"** - Device doesn't support biometrics
- **"User not enrolled"** - No fingerprint/Face ID set up on device
- **"Authentication failed"** - Wrong biometric or too many attempts

---

## 10. Modern App Pattern (Like ChatGPT, Uber)

The typical modern authentication flow:

```
┌────────────────────────┐
│   Sign In Screen       │
├────────────────────────┤
│ 🔐 Sign in with Face ID│ (if available)
├────────────────────────┤
│ 🔍 Sign in with Google │ (all platforms)
│ 🍎 Sign in with Apple  │ (iOS only)
├────────────────────────┤
│ 📧 Sign in with Email  │ (fallback)
└────────────────────────┘
         ↓
    Check Email
         ↓
    ┌─────────────────────┐
    │ New User?           │
    ├─────────────────────┤
    │ YES → Create Account│
    │ NO → Link Provider  │
    └─────────────────────┘
```

This provides the best UX by offering quick biometric auth, social login, and traditional email fallback.
