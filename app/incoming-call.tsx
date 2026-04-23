import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Phone, PhoneOff } from "lucide-react-native";
import { useAppStore } from "@/lib/store";

export default function IncomingCallScreen() {
  const router = useRouter();
  const { callPeer, acceptCall, rejectCall } = useAppStore();

  const displayName = callPeer ? callPeer.split("@")[0] : "Unknown";
  const COLORS = ["#07C160","#E74C3C","#4A90D9","#9B59B6","#F39C12","#1ABC9C"];
  const avatarColor = COLORS[(displayName.charCodeAt(0) || 0) % COLORS.length];
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleAccept = async () => {
    await acceptCall();
    router.replace("/call");
  };

  const handleReject = () => {
    rejectCall();
    router.back();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topSection}>
        <Text style={styles.incomingLabel}>Incoming Audio Call</Text>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={handleReject} activeOpacity={0.8}>
          <PhoneOff size={32} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.actionLabel}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={handleAccept} activeOpacity={0.8}>
          <Phone size={32} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.actionLabel}>Accept</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1A1A2E",
    justifyContent: "space-between",
    paddingVertical: 60,
  },
  topSection: { alignItems: "center", gap: 20 },
  incomingLabel: { fontSize: 14, color: "rgba(255,255,255,0.6)", letterSpacing: 1 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 40, fontWeight: "700" },
  name: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 60,
    paddingBottom: 20,
  },
  actionBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rejectBtn: { backgroundColor: "#E74C3C" },
  acceptBtn: { backgroundColor: "#07C160" },
  actionLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
});
