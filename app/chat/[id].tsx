import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  ArrowLeft,
  Phone,
  Video,
  Paperclip,
  Smile,
  Send,
} from "lucide-react-native";
import { useAppStore } from "@/lib/store";
import { flattenStyle } from "@/utils/flatten-style";

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const EMOJIS = [
    "😀","😂","😍","🥰","😎","😭","😅","🤣","😊","😇",
    "🥳","😏","😒","😔","😢","😡","🤔","🤗","😴","🤩",
    "👍","👎","👏","🙌","🤝","❤️","🔥","✨","🎉","💯",
    "😘","🥺","😱","🤯","😤","🙄","😋","🤤","😜","🤪",
    "👋","✌️","🤞","🫶","💪","🫠","🥹","😶","🫡","🤭",
  ];

  const handleEmojiPress = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const toggleEmoji = () => {
    if (!showEmoji) {
      Keyboard.dismiss();
    } else {
      inputRef.current?.focus();
    }
    setShowEmoji((prev) => !prev);
  };

  const store = useAppStore();
  const { messages: storeMessages, contacts, markAsRead, sendXMPPMessage, startCall } = store;

  // Decode the JID from the URL param
  const jid = id ? decodeURIComponent(id) : "";

  // Resolve contact info — prefer roster, fallback to JID parsing
  const rosterContact = contacts.find((c) => c.jid === jid);
  const username = rosterContact
    ? rosterContact.name || jid.split("@")[0]
    : jid.split("@")[0];
  const online = rosterContact?.online ?? false;

  // Avatar
  function getAvatar(nameStr: string): { initials: string; color: string } {
    const COLORS = [
      "#07C160", "#E74C3C", "#4A90D9", "#9B59B6",
      "#F39C12", "#1ABC9C", "#E91E63", "#607D8B",
    ];
    const clean = nameStr.split("@")[0];
    const parts = clean.split(/[._\-\s]/);
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : clean.slice(0, 2).toUpperCase();
    const colorIndex = clean.charCodeAt(0) % COLORS.length;
    return { initials, color: COLORS[colorIndex] };
  }

  const { initials, color } = getAvatar(username);

  // Get messages from store for this JID
  const messages = storeMessages[jid] || [];

  // Mark as read when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (jid) markAsRead(jid);
    }, [jid, markAsRead])
  );

  // Scroll to bottom on initial load
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !jid) return;
    const text = inputText.trim();
    setInputText("");
    await sendXMPPMessage(jid, text);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#1A1A1A" strokeWidth={2} />
        </TouchableOpacity>
        <View style={flattenStyle([styles.headerAvatar, { backgroundColor: color }])}>
          <Text style={styles.headerAvatarText}>{initials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{username}</Text>
          <View style={styles.onlineRow}>
            {online && <View style={styles.onlineDot} />}
            <Text style={online ? styles.onlineText : styles.offlineText}>
              {online ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.7} onPress={() => startCall(jid)}>
            <Phone size={20} color="#07C160" strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.7}>
            <Video size={20} color="#07C160" strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dateSeparator}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>Today</Text>
          <View style={styles.dateLine} />
        </View>

        {messages.length === 0 && (
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyMessagesText}>
              Say hello to {username}!
            </Text>
          </View>
        )}

        {messages.map((msg) => (
          <View key={msg.id} style={msg.sent ? styles.sentRow : styles.receivedRow}>
            {!msg.sent && (
              <View style={flattenStyle([styles.msgAvatar, { backgroundColor: color }])}>
                <Text style={styles.msgAvatarText}>{initials[0]}</Text>
              </View>
            )}
            <View style={msg.sent ? styles.sentBubble : styles.receivedBubble}>
              <Text style={msg.sent ? styles.sentText : styles.receivedText}>
                {msg.text}
              </Text>
              <Text style={msg.sent ? styles.sentTime : styles.receivedTime}>
                {msg.time}
              </Text>
            </View>
          </View>
        ))}
        <View style={styles.messagesBottomPad} />
      </ScrollView>

      {/* Emoji Picker */}
      {showEmoji && (
        <View style={styles.emojiPanel}>
          <FlatList
            data={EMOJIS}
            keyExtractor={(item) => item}
            numColumns={10}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.emojiItem}
                onPress={() => handleEmojiPress(item)}
                activeOpacity={0.6}
              >
                <Text style={styles.emojiText}>{item}</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Input Bar */}
      <SafeAreaView edges={["bottom"]} style={styles.inputArea}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.inputActionBtn} activeOpacity={0.7}>
            <Paperclip size={22} color="#9E9E9E" strokeWidth={1.8} />
          </TouchableOpacity>
          <View style={styles.textInputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#9E9E9E"
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => setShowEmoji(false)}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity style={styles.emojiBtn} activeOpacity={0.7} onPress={toggleEmoji}>
              <Smile size={20} color={showEmoji ? "#07C160" : "#9E9E9E"} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={flattenStyle([
              styles.sendBtn,
              inputText.trim().length > 0 && styles.sendBtnActive,
            ])}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <Send size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#07C160",
  },
  onlineText: { fontSize: 12, color: "#07C160", fontWeight: "500" },
  offlineText: { fontSize: 12, color: "#9E9E9E" },
  headerActions: { flexDirection: "row", gap: 8 },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingTop: 12 },
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 12,
  },
  dateLine: { flex: 1, height: 0.5, backgroundColor: "#E0E0E0" },
  dateText: { fontSize: 12, color: "#9E9E9E", fontWeight: "500" },
  emptyMessages: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyMessagesText: {
    fontSize: 14,
    color: "#C0C0C0",
    fontStyle: "italic",
  },
  sentRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  receivedRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  msgAvatarText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  sentBubble: {
    backgroundColor: "#07C160",
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: "75%",
  },
  receivedBubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sentText: { color: "#FFFFFF", fontSize: 14, lineHeight: 20 },
  receivedText: { color: "#1A1A1A", fontSize: 14, lineHeight: 20 },
  sentTime: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  receivedTime: { color: "#9E9E9E", fontSize: 10, marginTop: 4 },
  messagesBottomPad: { height: 8 },
  inputArea: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  inputActionBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  textInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A1A",
    maxHeight: 100,
    padding: 0,
  },
  emojiBtn: {
    marginLeft: 8,
    paddingBottom: 2,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#CCCCCC",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnActive: { backgroundColor: "#07C160" },
  emojiPanel: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0.5,
    borderTopColor: "#E0E0E0",
    paddingHorizontal: 8,
    paddingVertical: 10,
    height: 220,
  },
  emojiItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  emojiText: { fontSize: 24 },
});