import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, UserPlus } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "@/lib/store";
import { XMPP_CONFIG } from "@/lib/xmpp";
import { flattenStyle } from "@/utils/flatten-style";

const DOMAIN = XMPP_CONFIG.domain;

function getAvatarProps(username: string): { initials: string; color: string } {
  const COLORS = ["#07C160", "#E74C3C", "#4A90D9", "#9B59B6", "#F39C12", "#1ABC9C"];
  const initials = username.slice(0, 2).toUpperCase();
  const color = COLORS[username.charCodeAt(0) % COLORS.length];
  return { initials, color };
}

export default function NewChatScreen() {
  const router = useRouter();
  const { user, startConversation } = useAppStore();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Derive own local username (strip leading @)
  const ownUsername = user.username.startsWith("@")
    ? user.username.slice(1)
    : user.username;

  // Suggested: the "other" test user
  const suggestedUsers = ownUsername === "alice" ? ["bob"] : ownUsername === "bob" ? ["alice"] : [];

  const handleStart = async (targetUsername?: string) => {
    const name = (targetUsername ?? username).trim().toLowerCase();
    if (!name) {
      setError("Please enter a username.");
      return;
    }
    if (name === ownUsername) {
      setError("You cannot start a chat with yourself.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const jid = `${name}@${DOMAIN}`;
      await startConversation(jid);
      router.replace(`/chat/${encodeURIComponent(jid)}` as never);
    } catch (e) {
      console.warn("[NewChat] Error starting conversation:", e);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#1A1A1A" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Chat</Text>
        <View style={styles.headerSpacer} />
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>Start a conversation</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter username"
                placeholderTextColor="#9E9E9E"
                value={username}
                onChangeText={(t) => { setUsername(t.trim()); setError(""); }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => handleStart()}
              />
            </View>
            <View style={styles.domainBadge}>
              <Text style={styles.domainText} numberOfLines={1}>@{DOMAIN}</Text>
            </View>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => handleStart()}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <UserPlus size={18} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.startBtnText}>Start Chat</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Suggested Section */}
        {suggestedUsers.length > 0 && (
          <View style={styles.suggestedSection}>
            <Text style={styles.sectionLabel}>Suggested</Text>
            {suggestedUsers.map((suggestedUser) => {
              const { initials, color } = getAvatarProps(suggestedUser);
              return (
                <TouchableOpacity
                  key={suggestedUser}
                  style={styles.suggestionItem}
                  activeOpacity={0.7}
                  onPress={() => handleStart(suggestedUser)}
                >
                  <View style={flattenStyle([styles.suggestionAvatar, { backgroundColor: color }])}>
                    <Text style={styles.suggestionAvatarText}>{initials}</Text>
                  </View>
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionName}>{suggestedUser}</Text>
                    <Text style={styles.suggestionJID}>
                      {suggestedUser}@{DOMAIN}
                    </Text>
                  </View>
                  <View style={styles.suggestionAction}>
                    <Text style={styles.suggestionActionText}>Chat</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerSpacer: { width: 36 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 8 },
  inputSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9E9E9E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    fontSize: 15,
    color: "#1A1A1A",
    padding: 0,
  },
  domainBadge: {
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxWidth: 120,
  },
  domainText: {
    fontSize: 12,
    color: "#9E9E9E",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 13,
    color: "#E74C3C",
    fontWeight: "500",
  },
  startBtn: {
    backgroundColor: "#07C160",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  suggestedSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    gap: 4,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F5F5F5",
  },
  suggestionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionAvatarText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  suggestionInfo: { flex: 1 },
  suggestionName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  suggestionJID: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  suggestionAction: {
    backgroundColor: "#E8F8F0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  suggestionActionText: {
    color: "#07C160",
    fontSize: 13,
    fontWeight: "600",
  },
});