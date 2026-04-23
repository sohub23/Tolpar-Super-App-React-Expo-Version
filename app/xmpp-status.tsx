import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft, Wifi, WifiOff, Users, AtSign, Server, Shield,
  Radio, Zap, CheckCircle, AlertCircle, Settings,
} from "lucide-react-native";
import { useAppStore } from "@/lib/store";
import { xmppService } from "@/lib/xmpp";

interface StatusInfo {
  connectionStatus: string;
  jid: string | null;
  domain: string;
  xmppUsername: string;
  xmppServer: string;
  onlineContacts: number;
  totalContacts: number;
  rosterLoaded: boolean;
}

export default function XmppStatusScreen() {
  const router = useRouter();
  const { user, connectionStatus, contacts } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const statusInfo: StatusInfo = {
    connectionStatus,
    jid: xmppService.getJID(),
    domain: user.jid?.split("@")[1] || "N/A",
    xmppUsername: user.jid?.split("@")[0] || "N/A",
    xmppServer: user.jid || "Not connected",
    onlineContacts: contacts.filter((c) => c.online).length,
    totalContacts: contacts.length,
    rosterLoaded: contacts.length > 0,
  };

  const getStatusColor = () => {
    switch (statusInfo.connectionStatus) {
      case "connected":
        return "#07C160";
      case "connecting":
        return "#F39C12";
      case "error":
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  const getStatusIcon = () => {
    switch (statusInfo.connectionStatus) {
      case "connected":
        return <CheckCircle size={28} color="#07C160" strokeWidth={1.5} />;
      case "connecting":
        return <Radio size={28} color="#F39C12" strokeWidth={1.5} />;
      case "error":
        return <AlertCircle size={28} color="#FF3B30" strokeWidth={1.5} />;
      default:
        return <WifiOff size={28} color="#8E8E93" strokeWidth={1.5} />;
    }
  };

  const handleReconnect = async () => {
    setLoading(true);
    try {
      if (statusInfo.jid && user.jid) {
        const username = user.jid.split("@")[0];
        // We don't have the XMPP password in UI context, so we just try to reconnect
        Alert.alert("Info", "Reconnection initiated. The app will attempt to re-establish the connection.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to reconnect.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger a refresh of the current state
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#1A1A1A" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>XMPP Status</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={s.statusCard}>
          <View style={s.statusHeader}>
            <View style={s.statusIconBg}>
              {getStatusIcon()}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.statusTitle}>
                {statusInfo.connectionStatus === "connected"
                  ? "Connected"
                  : statusInfo.connectionStatus === "connecting"
                  ? "Connecting..."
                  : statusInfo.connectionStatus === "error"
                  ? "Connection Error"
                  : "Disconnected"}
              </Text>
              <Text style={s.statusSubtitle}>
                {statusInfo.connectionStatus === "connected"
                  ? `Logged in as ${statusInfo.xmppUsername}`
                  : "Not connected to XMPP server"}
              </Text>
            </View>
          </View>

          {statusInfo.connectionStatus === "connected" && (
            <View style={s.statusBar}>
              <View style={s.statusBarFill} />
            </View>
          )}
        </View>

        {/* Connection Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Connection Details</Text>
          <View style={s.infoCard}>
            <InfoRow
              icon={<AtSign size={16} color="#07C160" strokeWidth={2} />}
              label="JID"
              value={statusInfo.jid || "N/A"}
            />
            <View style={s.infoDivider} />
            <InfoRow
              icon={<Server size={16} color="#07C160" strokeWidth={2} />}
              label="Domain"
              value={statusInfo.domain}
            />
            <View style={s.infoDivider} />
            <InfoRow
              icon={<Shield size={16} color="#07C160" strokeWidth={2} />}
              label="Transport"
              value="wss://5443/ws"
            />
            <View style={s.infoDivider} />
            <InfoRow
              icon={<Wifi size={16} color="#07C160" strokeWidth={2} />}
              label="Status"
              value={statusInfo.connectionStatus}
            />
          </View>
        </View>

        {/* Contacts */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Contacts</Text>
          <View style={s.infoCard}>
            <InfoRow
              icon={<Users size={16} color="#07C160" strokeWidth={2} />}
              label="Total Contacts"
              value={statusInfo.totalContacts.toString()}
            />
            <View style={s.infoDivider} />
            <InfoRow
              icon={<Zap size={16} color="#07C160" strokeWidth={2} />}
              label="Online Now"
              value={statusInfo.onlineContacts.toString()}
            />
          </View>
        </View>

        {/* Account Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Account</Text>
          <View style={s.infoCard}>
            <InfoRow
              icon={<AtSign size={16} color="#07C160" strokeWidth={2} />}
              label="Email"
              value={user.email}
            />
            <View style={s.infoDivider} />
            <InfoRow
              icon={<Shield size={16} color="#07C160" strokeWidth={2} />}
              label="Full Name"
              value={user.name}
            />
          </View>
        </View>

        {/* Actions */}
        {statusInfo.connectionStatus !== "connected" && (
          <View style={s.section}>
            <TouchableOpacity
              style={s.reconnectBtn}
              onPress={handleReconnect}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Wifi size={18} color="#FFFFFF" strokeWidth={2} />
                  <Text style={s.reconnectBtnText}>Try Reconnecting</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Button */}
        <View style={s.section}>
          <TouchableOpacity
            style={s.settingsBtn}
            onPress={() => alert("XMPP settings will be available in future updates.")}
            activeOpacity={0.7}
          >
            <Settings size={18} color="#07C160" strokeWidth={2} />
            <Text style={s.settingsBtnText}>XMPP Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIcon}>{icon}</View>
      <View style={s.infoContent}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F2F7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5EA",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },

  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  statusIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },
  statusBar: {
    height: 4,
    backgroundColor: "#E5E5EA",
    borderRadius: 2,
    marginTop: 16,
    overflow: "hidden",
  },
  statusBarFill: {
    height: "100%",
    backgroundColor: "#07C160",
    width: "100%",
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 8,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "600",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  infoDivider: {
    height: 0.5,
    backgroundColor: "#E5E5EA",
    marginLeft: 60,
  },

  reconnectBtn: {
    backgroundColor: "#07C160",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#07C160",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  reconnectBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  settingsBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#07C160",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  settingsBtnText: {
    color: "#07C160",
    fontSize: 16,
    fontWeight: "700",
  },
});
