import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { PhoneOff, Mic, MicOff, Volume2 } from "lucide-react-native";
import { useAppStore } from "@/lib/store";

export default function CallScreen() {
  const router = useRouter();
  const { callPeer, callStatus, callMuted, endCall, toggleMute } = useAppStore();
  const [elapsed, setElapsed] = useState(0);

  const displayName = callPeer ? callPeer.split("@")[0] : "";

  useEffect(() => {
    if (callStatus !== "active") return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [callStatus]);

  // Navigate away if call ended externally
  useEffect(() => {
    if (callStatus === "idle") router.back();
  }, [callStatus]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleEnd = () => {
    endCall();
    router.back();
  };

  const statusLabel =
    callStatus === "outgoing" ? "Calling..." :
    callStatus === "active" ? formatTime(elapsed) :
    "Connecting...";

  const COLORS = ["#07C160","#E74C3C","#4A90D9","#9B59B6","#F39C12","#1ABC9C"];
  const avatarColor = COLORS[(displayName.charCodeAt(0) || 0) % COLORS.length];
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topSection}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.status}>{statusLabel}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleMute} activeOpacity={0.8}>
          {callMuted
            ? <MicOff size={26} color="#FFFFFF" strokeWidth={2} />
            : <Mic size={26} color="#FFFFFF" strokeWidth={2} />}
          <Text style={styles.controlLabel}>{callMuted ? "Unmute" : "Mute"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlBtn, styles.endBtn]} onPress={handleEnd} activeOpacity={0.8}>
          <PhoneOff size={30} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.controlLabel}>End</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} activeOpacity={0.8}>
          <Volume2 size={26} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.controlLabel}>Speaker</Text>
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
    paddingVertical: 40,
  },
  topSection: { alignItems: "center", gap: 16, marginTop: 40 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 40, fontWeight: "700" },
  name: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
  status: { fontSize: 16, color: "rgba(255,255,255,0.6)" },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
    paddingBottom: 20,
  },
  controlBtn: {
    alignItems: "center",
    gap: 8,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
  },
  endBtn: { backgroundColor: "#E74C3C", width: 80, height: 80, borderRadius: 40 },
  controlLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginTop: 2 },
});
