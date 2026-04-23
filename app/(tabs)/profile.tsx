import React, { useState } from "react";
import {
  ScrollView, View, Text, TouchableOpacity, Alert,
  TextInput, Modal, ActivityIndicator, Switch, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import {
  Shield, Bell, Lock, Sun, Globe, LifeBuoy, Info, Activity,
  ChevronRight, Wallet, Package, CreditCard, Heart, LogOut, Edit3,
} from "lucide-react-native";
import { useAppStore } from "@/lib/store";
import { uploadAvatar } from "@/lib/supabase";
import { flattenStyle } from "@/utils/flatten-style";

const SETTINGS_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  shield: Shield, bell: Bell, lock: Lock, sun: Sun,
  globe: Globe, "life-buoy": LifeBuoy, info: Info, activity: Activity,
};
const SERVICE_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  wallet: Wallet, package: Package, "credit-card": CreditCard, heart: Heart,
};

const profileServices = [
  { id: "wallet", icon: "wallet", label: "Wallet" },
  { id: "package", icon: "package", label: "Orders" },
  { id: "credit-card", icon: "credit-card", label: "Payment" },
  { id: "heart", icon: "heart", label: "Favorites" },
];

const profileSettings = [
  { id: "notifications", icon: "bell", label: "Notifications", group: "account", hasToggle: false },
  { id: "security", icon: "shield", label: "Security", group: "account", hasToggle: false },
  { id: "privacy", icon: "lock", label: "Privacy", group: "account", hasToggle: false },
  { id: "dark-mode", icon: "sun", label: "Dark Mode", group: "preferences", hasToggle: true },
  { id: "language", icon: "globe", label: "Language", group: "preferences", hasToggle: false },
  { id: "help", icon: "life-buoy", label: "Help & Support", group: "support", hasToggle: false },
  { id: "about", icon: "info", label: "About", group: "support", hasToggle: false },
  { id: "xmpp-status", icon: "activity", label: "XMPP Status", group: "support", hasToggle: false },
];

const mockUser = {
  followers: 1250,
  following: 89,
  posts: 42,
  balance: 2500,
  initials: "JD",
  name: "John Doe",
  username: "@johndoe",
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, darkMode, toggleDarkMode, logout, updateProfile } = useAppStore();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState(user.name);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setUploading(true);
      try {
        const base64 = result.assets[0].base64;
        const publicUrl = await uploadAvatar(user.id, base64, 'avatar.jpg');

        if (publicUrl) {
          const success = await updateProfile(user.name, publicUrl);
          if (success.success) {
            Alert.alert('Success', 'Avatar updated successfully!');
          } else {
            Alert.alert('Error', success.error ?? 'Failed to update avatar.');
          }
        } else {
          Alert.alert('Error', 'Failed to upload avatar. Please try again.');
        }
      } catch (e) {
        console.warn('[Profile] Avatar upload error:', e);
        Alert.alert('Error', 'An error occurred while uploading.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleEditProfile = () => {
    setNewName(user.name);
    setEditModalVisible(true);
  };

  const handleSaveName = async () => {
    if (!newName?.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    console.log('[Profile] Updating name to:', newName.trim());
    setLoading(true);
    const result = await updateProfile(newName.trim());
    setLoading(false);
    console.log('[Profile] Update result:', result);
    if (result.success) {
      Alert.alert('Success', 'Profile updated!');
      setEditModalVisible(false);
    } else {
      Alert.alert('Error', result.error ?? 'Failed to update profile.');
    }
  };

  const handleXmppStatus = () => {
    router.push('/xmpp-status' as never);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
              router.replace('/login' as never);
            } catch (e) {
              console.warn('[Profile] Logout error:', e);
              Alert.alert('Error', 'Failed to sign out.');
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={s.root}>
      <SafeAreaView edges={["top"]} style={s.headerSafe}>
        <View style={s.headerBar}>
          <Text style={s.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={s.editBtn} 
            activeOpacity={0.7}
            onPress={handleEditProfile}
            disabled={loading}
          >
            <Edit3 size={18} color="#07C160" strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Profile Hero */}
        <View style={s.heroCard}>
          <TouchableOpacity 
            style={s.avatarContainer}
            onPress={handlePickAvatar}
            disabled={uploading}
            activeOpacity={0.7}
          >
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={s.avatarImage}
                placeholder={user.initials}
                placeholderContentFit="cover"
                contentFit="cover"
              />
            ) : (
              <LinearGradient colors={["#00C853", "#007E33"]} style={s.avatarRing}>
                <Text style={s.avatarText}>{user.initials}</Text>
              </LinearGradient>
            )}
            {uploading && (
              <View style={s.uploadOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
            <View style={s.cameraIcon}>
              <Text style={s.cameraEmoji}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={s.userName}>{user.name}</Text>
          <Text style={s.userEmail}>{user.email}</Text>
          <TouchableOpacity style={s.editProfileBtn} activeOpacity={0.8} onPress={handleEditProfile}>
            <Text style={s.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* XMPP Status Quick View */}
        <TouchableOpacity 
          style={s.xmppCard}
          onPress={handleXmppStatus}
          activeOpacity={0.7}
        >
          <View style={s.xmppLeft}>
            <View style={s.xmppIconWrap}>
              <Activity size={18} color="#07C160" strokeWidth={2} />
            </View>
            <View>
              <Text style={s.xmppLabel}>XMPP Connection</Text>
              <Text style={s.xmppValue}>{user.jid || "Not connected"}</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#C7C7CC" strokeWidth={2} />
        </TouchableOpacity>

        {/* Stats */}
        <View style={s.statsCard}>
          {[
            { value: `${(mockUser.followers / 1000).toFixed(1)}K`, label: "Followers" },
            { value: String(mockUser.following), label: "Following" },
            { value: String(mockUser.posts), label: "Posts" },
          ].map((stat, i, arr) => (
            <React.Fragment key={stat.label}>
              <TouchableOpacity style={s.statItem} activeOpacity={0.7}>
                <Text style={s.statNum}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={s.statDiv} />}
            </React.Fragment>
          ))}
        </View>

        {/* Wallet */}
        <LinearGradient
          colors={["#00C853", "#007E33"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.walletCard}
        >
          <View style={s.walletDeco} />
          <View>
            <Text style={s.walletLabel}>Tolpar Wallet</Text>
            <Text style={s.walletBalance}>৳ {mockUser.balance}</Text>
          </View>
          <TouchableOpacity style={s.walletBtn} activeOpacity={0.8}>
            <Text style={s.walletBtnText}>Add Money</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Services */}
        <View style={s.card}>
          <View style={s.servicesRow}>
            {profileServices.map((sv, i) => {
              const Icon = SERVICE_ICONS[sv.icon] || Wallet;
              return (
                <TouchableOpacity key={sv.id} style={s.serviceItem} activeOpacity={0.7}>
                  <View style={s.serviceIcon}>
                    <Icon size={20} color="#07C160" strokeWidth={1.8} />
                  </View>
                  <Text style={s.serviceLabel}>{sv.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Settings Groups */}
        {(["account", "preferences", "support"] as const).map((group) => {
          const items = profileSettings.filter((s) => s.group === group);
          const label = group.charAt(0).toUpperCase() + group.slice(1);
          return (
            <View key={group} style={s.settingsGroup}>
              <Text style={s.groupLabel}>{label}</Text>
              <View style={s.settingsCard}>
                {items.map((setting, i) => {
                  const Icon = SETTINGS_ICONS[setting.icon] || Info;
                  return (
                    <View key={setting.id}>
                      <TouchableOpacity
                        style={s.settingRow}
                        activeOpacity={0.7}
                        onPress={setting.id === "xmpp-status" ? handleXmppStatus : undefined}
                      >
                        <View style={s.settingLeft}>
                          <View style={s.settingIconWrap}>
                            <Icon size={16} color="#8E8E93" strokeWidth={1.8} />
                          </View>
                          <Text style={s.settingLabel}>{setting.label}</Text>
                        </View>
                        {setting.hasToggle ? (
                          <Switch
                            value={darkMode}
                            onValueChange={toggleDarkMode}
                            trackColor={{ false: "#E5E5EA", true: "#07C160" }}
                            thumbColor="#FFFFFF"
                          />
                        ) : (
                          <ChevronRight size={17} color="#C7C7CC" strokeWidth={2} />
                        )}
                      </TouchableOpacity>
                      {i < items.length - 1 && <View style={s.settingDiv} />}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Sign Out */}
        <View style={s.settingsGroup}>
          <View style={s.settingsCard}>
            <TouchableOpacity 
              style={s.settingRow} 
              activeOpacity={0.7}
              onPress={handleSignOut}
              disabled={loading}
            >
              <View style={s.settingLeft}>
                <View style={flattenStyle([s.settingIconWrap, { backgroundColor: "#FFF0EF" }])}>
                  <LogOut size={16} color="#FF3B30" strokeWidth={1.8} />
                </View>
                <Text style={s.signOutText}>Sign Out</Text>
              </View>
              {loading && <ActivityIndicator size="small" color="#FF3B30" />}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.version}>Tolpar v1.0.0</Text>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Edit Name</Text>
            <TextInput
              style={s.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your full name"
              autoFocus={true}
              maxLength={50}
            />
            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalButton, s.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={s.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalButton, s.saveButton]}
                onPress={handleSaveName}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F2F7" },
  headerSafe: { backgroundColor: "#FFFFFF", borderBottomWidth: 0.5, borderBottomColor: "#E5E5EA" },
  headerBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#1C1C1E", letterSpacing: -0.5 },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F2F2F7", alignItems: "center", justifyContent: "center",
  },
  scroll: { flex: 1 },
  content: { paddingTop: 0 },

  heroCard: {
    backgroundColor: "#FFFFFF", alignItems: "center",
    paddingVertical: 32, marginBottom: 8,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 14,
  },
  avatarRing: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#07C160", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  avatarImage: {
    width: 90, height: 90, borderRadius: 45,
    shadowColor: "#07C160", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  avatarText: { color: "#FFFFFF", fontSize: 34, fontWeight: "800" },
  uploadOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 45, backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  cameraIcon: {
    position: "absolute", bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#07C160",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#FFFFFF",
  },
  cameraEmoji: { fontSize: 16 },
  userName: { fontSize: 22, fontWeight: "700", color: "#1C1C1E", letterSpacing: -0.3 },
  userEmail: { fontSize: 14, color: "#8E8E93", marginTop: 2, marginBottom: 16 },
  editProfileBtn: {
    borderWidth: 1.5, borderColor: "#07C160", borderRadius: 20,
    paddingHorizontal: 24, paddingVertical: 8,
  },
  editProfileText: { color: "#07C160", fontSize: 14, fontWeight: "600" },

  xmppCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: "#FFFFFF", borderRadius: 16,
    padding: 16, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  xmppLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  xmppIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "#E8F8F0",
    alignItems: "center", justifyContent: "center",
  },
  xmppLabel: { fontSize: 13, color: "#8E8E93", fontWeight: "500" },
  xmppValue: { fontSize: 15, color: "#1C1C1E", fontWeight: "600", marginTop: 2 },

  statsCard: {
    backgroundColor: "#FFFFFF", flexDirection: "row",
    alignItems: "center", paddingVertical: 18,
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800", color: "#1C1C1E", letterSpacing: -0.3 },
  statLabel: { fontSize: 12, color: "#8E8E93", marginTop: 3, fontWeight: "500" },
  statDiv: { width: 0.5, height: 36, backgroundColor: "#E5E5EA" },

  walletCard: {
    marginHorizontal: 16, borderRadius: 20, padding: 22,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#07C160", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 16, elevation: 6,
  },
  walletDeco: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.07)", top: -50, right: -20,
  },
  walletLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "500", marginBottom: 4 },
  walletBalance: { color: "#FFFFFF", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  walletBtn: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  walletBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },

  card: {
    backgroundColor: "#FFFFFF", marginHorizontal: 16,
    borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  servicesRow: { flexDirection: "row", justifyContent: "space-between" },
  serviceItem: { alignItems: "center", flex: 1 },
  serviceIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "#E8F8F0",
    alignItems: "center", justifyContent: "center", marginBottom: 7,
  },
  serviceLabel: { fontSize: 11, color: "#3C3C43", fontWeight: "500", textAlign: "center" },

  settingsGroup: { marginHorizontal: 16, marginBottom: 8 },
  groupLabel: {
    fontSize: 13, fontWeight: "600", color: "#8E8E93",
    marginBottom: 6, marginLeft: 4,
    textTransform: "uppercase", letterSpacing: 0.4,
  },
  settingsCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  settingRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#F2F2F7",
    alignItems: "center", justifyContent: "center",
  },
  settingLabel: { fontSize: 15, color: "#1C1C1E", fontWeight: "500" },
  settingDiv: { height: 0.5, backgroundColor: "#F2F2F7", marginLeft: 60 },
  signOutText: { fontSize: 15, color: "#FF3B30", fontWeight: "500" },
  version: { textAlign: "center", color: "#C7C7CC", fontSize: 12, marginTop: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1C1C1E",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F2F2F7",
  },
  saveButton: {
    backgroundColor: "#07C160",
  },
  cancelButtonText: {
    color: "#8E8E93",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
