import React from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PenSquare, Search, Plus, Wifi, WifiOff, MessageCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { mockStories } from "@/lib/mockData";
import { useAppStore } from "@/lib/store";
import { flattenStyle } from "@/utils/flatten-style";

function StatusBadge({ status }: { status: string }) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  return (
    <View
      style={flattenStyle([
        styles.statusBadge,
        isConnected
          ? styles.statusConnected
          : isConnecting
          ? styles.statusConnecting
          : styles.statusDisconnected,
      ])}
    >
      {isConnected ? (
        <Wifi size={10} color="#07C160" strokeWidth={2} />
      ) : (
        <WifiOff size={10} color={isConnecting ? "#F39C12" : "#9E9E9E"} strokeWidth={2} />
      )}
      <Text
        style={flattenStyle([
          styles.statusText,
          isConnected
            ? styles.statusTextConnected
            : isConnecting
            ? styles.statusTextConnecting
            : styles.statusTextDisconnected,
        ])}
      >
        {isConnected ? "Online" : isConnecting ? "Connecting..." : "Offline"}
      </Text>
    </View>
  );
}

// Generate avatar initials + color from a JID/name
function getAvatarProps(name: string): { initials: string; color: string } {
  const COLORS = [
    "#07C160", "#E74C3C", "#4A90D9", "#9B59B6",
    "#F39C12", "#1ABC9C", "#E91E63", "#607D8B",
  ];
  const clean = name.split("@")[0];
  const parts = clean.split(/[._\-\s]/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : clean.slice(0, 2).toUpperCase();
  const colorIndex = clean.charCodeAt(0) % COLORS.length;
  return { initials, color: COLORS[colorIndex] };
}

export default function ChatScreen() {
  const router = useRouter();
  const { connectionStatus, conversations, isLoggedIn } = useAppStore();

  // When logged in, show real conversations. When in preview/logged-out, show mock conversations.
  // conversations array already reflects the correct state (mock or real) from the store.
  const isEmpty = isLoggedIn && conversations.length === 0;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Messages</Text>
            <StatusBadge status={connectionStatus} />
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} activeOpacity={0.7}>
              <Search size={20} color="#1A1A1A" strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.7}
              onPress={() => router.push("/new-chat" as never)}
            >
              <PenSquare size={20} color="#1A1A1A" strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#9E9E9E" strokeWidth={1.8} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#9E9E9E"
          />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stories Row */}
        <View style={styles.storiesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesScrollContent}
          >
            {mockStories.map((story) => (
              <TouchableOpacity key={story.id} style={styles.storyItem} activeOpacity={0.7}>
                <View
                  style={flattenStyle([
                    styles.storyRing,
                    story.hasUnread
                      ? styles.storyRingUnread
                      : story.isAdd
                      ? styles.storyRingAdd
                      : styles.storyRingRead,
                  ])}
                >
                  <View style={flattenStyle([styles.storyAvatar, { backgroundColor: story.color }])}>
                    {story.isAdd ? (
                      <Plus size={20} color="#666" strokeWidth={2} />
                    ) : (
                      <Text style={styles.storyInitials}>{story.initials}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.storyName} numberOfLines={1}>
                  {story.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Empty state when logged in but no conversations */}
        {isEmpty ? (
          <View style={styles.emptyState}>
            <MessageCircle size={56} color="#E0E0E0" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the pencil button above to start chatting with someone.
            </Text>
            <TouchableOpacity
              style={styles.emptyStartBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/new-chat" as never)}
            >
              <PenSquare size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.emptyStartBtnText}>Start a Chat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Conversation list (real or mock) */
          <View style={styles.conversationList}>
            {conversations.map((conv) => {
              const avatar = getAvatarProps(conv.name || conv.id);
              return (
                <TouchableOpacity
                  key={conv.id}
                  style={styles.conversationItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push(`/chat/${encodeURIComponent(conv.id)}` as never);
                  }}
                >
                  <View style={styles.avatarWrapper}>
                    <View style={flattenStyle([styles.avatar, { backgroundColor: conv.color || avatar.color }])}>
                      <Text style={styles.avatarInitials}>{conv.initials || avatar.initials}</Text>
                    </View>
                    {conv.online && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.convInfo}>
                    <View style={styles.convTopRow}>
                      <Text style={styles.convName}>{conv.name}</Text>
                      <Text style={styles.convTime}>{conv.timestamp}</Text>
                    </View>
                    <View style={styles.convBottomRow}>
                      <Text style={styles.convLastMessage} numberOfLines={1}>
                        {conv.lastMessage}
                      </Text>
                      {conv.unread > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>
                            {conv.unread > 9 ? "9+" : conv.unread}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#1A1A1A" },
  headerActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  statusConnected: { backgroundColor: "#E8F8F0" },
  statusConnecting: { backgroundColor: "#FFF3E0" },
  statusDisconnected: { backgroundColor: "#F5F5F5" },
  statusText: { fontSize: 11, fontWeight: "500" },
  statusTextConnected: { color: "#07C160" },
  statusTextConnecting: { color: "#F39C12" },
  statusTextDisconnected: { color: "#9E9E9E" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1A1A1A", padding: 0 },
  scrollView: { flex: 1 },
  storiesSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  storiesScrollContent: { paddingHorizontal: 16, gap: 12 },
  storyItem: { alignItems: "center", width: 64 },
  storyRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    marginBottom: 6,
  },
  storyRingUnread: { borderWidth: 2.5, borderColor: "#07C160" },
  storyRingRead: { borderWidth: 2.5, borderColor: "#E0E0E0" },
  storyRingAdd: { borderWidth: 2.5, borderColor: "transparent" },
  storyAvatar: {
    flex: 1,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  storyInitials: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  storyName: { fontSize: 11, color: "#333", fontWeight: "500", textAlign: "center" },
  conversationList: { backgroundColor: "#FFFFFF", marginTop: 8 },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: "#07C160",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  convInfo: { flex: 1 },
  convTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  convName: { fontSize: 15, fontWeight: "600", color: "#1A1A1A", flex: 1 },
  convTime: { fontSize: 12, color: "#9E9E9E" },
  convBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  convLastMessage: { fontSize: 13, color: "#9E9E9E", flex: 1 },
  unreadBadge: {
    backgroundColor: "#07C160",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  unreadText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  emptyState: {
    alignItems: "center",
    paddingVertical: 56,
    paddingHorizontal: 32,
    gap: 12,
    backgroundColor: "#FFFFFF",
    marginTop: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#424242" },
  emptySubtitle: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 4,
  },
  emptyStartBtn: {
    backgroundColor: "#07C160",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  emptyStartBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  bottomPad: { height: 24 },
});