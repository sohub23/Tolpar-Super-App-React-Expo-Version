import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import type { TextInput as RNTextInput } from "react-native";
import { useRouter } from "expo-router";
import { Eye, EyeOff, Lock, Mail, Smartphone, Info } from "lucide-react-native";
import { useAppStore } from "@/lib/store";

const IS_WEB = Platform.OS === "web";

export default function LoginScreen() {
  const router = useRouter();
  const { login, signup, resetPassword, setPreviewMode } = useAppStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const passwordRef = useRef<RNTextInput>(null);

  const handleSubmit = async () => {
    setError(null);
    setInfoMessage(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    if (isSignUp) {
      const result = await signup(email.trim(), password);
      setLoading(false);
      if (result.success) {
        setInfoMessage(result.message ?? "Account created successfully. Please sign in.");
        setIsSignUp(false);
      } else {
        setError(result.error ?? "Unable to create account.");
      }
      return;
    }

    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        router.replace("/(tabs)");
      } else {
        setError(result.error ?? "Invalid credentials or server unreachable.");
      }
    } catch {
      setError("Invalid credentials or server unreachable.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setInfoMessage(null);

    if (!email.trim()) {
      setError("Enter your email address to reset your password.");
      return;
    }
    setLoading(true);
    const result = await resetPassword(email.trim());
    setLoading(false);
    if (result.success) {
      setInfoMessage(result.message ?? "Reset instructions were sent to your email.");
    } else {
      setError(result.error ?? "Unable to send reset email.");
    }
  };

  const toggleMode = () => {
    setError(null);
    setInfoMessage(null);
    setIsSignUp((prev) => !prev);
  };

  const handlePreviewMode = () => {
    setPreviewMode(true);
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoLetter}>T</Text>
          </View>
          <Text style={styles.appName}>TOLPAR</Text>
          <Text style={styles.subtitle}>{isSignUp ? "Create your account" : "Sign in to your account"}</Text>
        </View>

        {/* Web preview notice */}
        {IS_WEB && (
          <View style={styles.noticeBanner}>
            <Info size={16} color="#B45309" strokeWidth={2} />
            <Text style={styles.noticeText}>
              <Text style={styles.noticeBold}>Browser Preview:</Text> Live XMPP chat requires the native app (iOS/Android). Use Preview Mode below to explore the UI, or install the app to connect to the real server.
            </Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>

          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIconWrap}>
                <Mail size={18} color="#9E9E9E" strokeWidth={1.8} />
              </View>
              <TextInput
                style={styles.inputField}
                placeholder="you@example.com"
                placeholderTextColor="#BDBDBD"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIconWrap}>
                <Lock size={18} color="#9E9E9E" strokeWidth={1.8} />
              </View>
              <TextInput
                ref={passwordRef}
                style={styles.inputField}
                placeholder="Enter your password"
                placeholderTextColor="#BDBDBD"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) setError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#9E9E9E" strokeWidth={1.8} />
                ) : (
                  <Eye size={18} color="#9E9E9E" strokeWidth={1.8} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}

          <TouchableOpacity
            style={styles.signInBtn}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signInBtnText}>{isSignUp ? "Create account" : "Sign In"}</Text>
            )}
          </TouchableOpacity>

          {!isSignUp && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetPassword}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.resetBtnText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.switchModeBtn}
            onPress={toggleMode}
            activeOpacity={0.8}
          >
            <Text style={styles.switchModeText}>
              {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
            </Text>
          </TouchableOpacity>
        </View>

          {/* Preview Mode (web only) */}
          {IS_WEB && (
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={handlePreviewMode}
              activeOpacity={0.8}
            >
              <Smartphone size={16} color="#07C160" strokeWidth={2} />
              <Text style={styles.previewBtnText}>Enter Preview Mode (UI only)</Text>
            </TouchableOpacity>
          )}

        {/* Footer note */}
        <Text style={styles.footerNote}>
          
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 44,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#07C160",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#07C160",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoLetter: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#9E9E9E",
    fontWeight: "400",
  },
  form: {
    gap: 20,
  },
  fieldWrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#424242",
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    gap: 8,
  },
  inputIconWrap: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
    padding: 0,
  },
  domainBadge: {
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    maxWidth: 180,
  },
  domainText: {
    fontSize: 10,
    color: "#9E9E9E",
    fontWeight: "500",
  },
  eyeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 13,
    color: "#F44336",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 4,
  },
  signInBtn: {
    height: 54,
    backgroundColor: "#07C160",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#07C160",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  signInBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 13,
    color: "#1F7A30",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
  },
  resetBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  resetBtnText: {
    color: "#07C160",
    fontSize: 14,
    fontWeight: "600",
  },
  switchModeBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  switchModeText: {
    color: "#424242",
    fontSize: 14,
    fontWeight: "500",
  },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    gap: 8,
    marginTop: 8,
  },
  previewBtnText: {
    color: "#07C160",
    fontSize: 15,
    fontWeight: "600",
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    gap: 8,
  },
  noticeText: {
    fontSize: 13,
    color: "#424242",
    fontWeight: "400",
  },
  noticeBold: {
    fontWeight: "700",
  },
  footerNote: {
    fontSize: 12,
    color: "#BDBDBD",
    textAlign: "center",
    marginTop: 32,
  },
});