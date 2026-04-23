// Machine Inventory Screen — Full-screen inventory with Slide-to-Unlock
// Apple-style glassmorphism design — minimal, premium, smooth
// Structured for future API integration: replace getInventoryForMachine() with real API call.

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Lock, Unlock, MapPin, ChevronRight, Package } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  interpolateColor,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { getInventoryForMachine } from "@/lib/mockData";
import type { MachineType } from "@/lib/mockData";

const { width: SW } = Dimensions.get("window");
const SLIDER_WIDTH = SW - 64;
const THUMB_SIZE = 60;
const SLIDE_RANGE = SLIDER_WIDTH - THUMB_SIZE - 8;

// Machine display names
function getMachineName(type: string): string {
  switch (type) {
    case "omama": return "O-MAMA Fridge";
    case "vending": return "Smart Vending";
    case "powerbank": return "Power Station";
    case "locker": return "Smart Locker";
    default: return "Smart Machine";
  }
}

export default function MachineInventoryScreen() {
  const router = useRouter();
  const {
    machineId,
    machineBranch,
    machineAddress,
    machineType,
    machineStatus,
  } = useLocalSearchParams<{
    machineId: string;
    machineBranch: string;
    machineAddress: string;
    machineType: string;
    machineStatus: string;
  }>();

  const type = (machineType as MachineType) || "omama";
  const products = getInventoryForMachine(type);
  const machineName = getMachineName(type);

  // Slide-to-unlock state
  const [unlocked, setUnlocked] = useState(false);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const onUnlockSuccess = useCallback(() => {
    setUnlocked(true);
  }, []);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const newX = startX.value + event.translationX;
      translateX.value = Math.max(0, Math.min(newX, SLIDE_RANGE));
    })
    .onEnd(() => {
      if (translateX.value > SLIDE_RANGE * 0.85) {
        translateX.value = withSpring(SLIDE_RANGE, { damping: 15, stiffness: 150 });
        runOnJS(onUnlockSuccess)();
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
      }
    });

  const thumbAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const sliderTextAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SLIDE_RANGE * 0.5], [1, 0], Extrapolation.CLAMP),
  }));

  const sliderTrackAnimStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      translateX.value,
      [0, SLIDE_RANGE],
      ["#1C1C1E", "#07C160"]
    );
    return { backgroundColor: bgColor };
  });

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.headerWrap}>
        <SafeAreaView edges={["top"]} style={s.headerBar}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#1C1C1E" strokeWidth={2} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>{machineName}</Text>
            <Text style={s.headerSub}>{machineBranch || "Machine"}</Text>
          </View>
          <View style={{ width: 40 }} />
        </SafeAreaView>
      </View>

      {/* Machine Info Card */}
      <View style={s.infoCard}>
        <View style={s.infoLeft}>
          <View style={s.infoRow}>
            <MapPin size={13} color="#8E8E93" strokeWidth={2} />
            <Text style={s.infoAddress} numberOfLines={1}>
              {machineAddress || "Machine Location"}
            </Text>
          </View>
          <Text style={s.infoId}>ID: {machineId || "—"}</Text>
        </View>
        <View
          style={[
            s.statusChip,
            machineStatus === "Maintenance" && { backgroundColor: "rgba(243,156,18,0.1)" },
            machineStatus === "Offline" && { backgroundColor: "rgba(231,76,60,0.1)" },
          ]}
        >
          <View
            style={[
              s.statusDot,
              machineStatus === "Maintenance" && { backgroundColor: "#F39C12" },
              machineStatus === "Offline" && { backgroundColor: "#E74C3C" },
            ]}
          />
          <Text
            style={[
              s.statusLabel,
              machineStatus === "Maintenance" && { color: "#F39C12" },
              machineStatus === "Offline" && { color: "#E74C3C" },
            ]}
          >
            {machineStatus || "Online"}
          </Text>
        </View>
      </View>

      {/* Section Header */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Available Items</Text>
        <View style={s.itemsBadge}>
          <Package size={12} color="#8E8E93" strokeWidth={2} />
          <Text style={s.itemsBadgeText}>{products.length}</Text>
        </View>
      </View>

      {/* Product List — Apple-style glass cards */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.gridContainer}>
          {products.map((item: any, index: number) => (
            <View key={item.name + index} style={s.glassCard}>
              {/* Product Image */}
              <View style={s.imgWrap}>
                <Image
                  source={item.image}
                  style={s.productImg}
                  resizeMode="contain"
                />
              </View>
              {/* Product Info */}
              <View style={s.productInfo}>
                <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={s.productCategory}>
                  {type === "powerbank" ? "Charging" : type === "locker" ? "Storage" : "Snack & Drink"}
                </Text>
              </View>
              {/* Price */}
              <View style={s.priceWrap}>
                <Text style={s.priceText}>{item.price}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom spacing for action buttons */}
        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Bottom Action Area */}
      <View style={s.bottomArea}>
        <SafeAreaView edges={["bottom"]} style={s.bottomInner}>
          {!unlocked ? (
            /* Slide to Unlock */
            <View style={s.sliderContainer}>
              <Animated.View style={[s.sliderTrack, sliderTrackAnimStyle]}>
                <Animated.Text style={[s.sliderText, sliderTextAnimStyle]}>
                  Slide to Unlock
                </Animated.Text>
                {/* Chevron hints */}
                <Animated.View style={[s.chevronHints, sliderTextAnimStyle]}>
                  <ChevronRight size={14} color="rgba(255,255,255,0.3)" strokeWidth={2.5} />
                  <ChevronRight size={14} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                  <ChevronRight size={14} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
                </Animated.View>
                <GestureDetector gesture={panGesture}>
                  <Animated.View style={[s.sliderThumb, thumbAnimStyle]}>
                    <Lock size={20} color="#1C1C1E" strokeWidth={2} />
                  </Animated.View>
                </GestureDetector>
              </Animated.View>
            </View>
          ) : (
            /* Unlocked state */
            <View style={s.unlockedContainer}>
              <LinearGradient
                colors={["#07C160", "#00A84F"]}
                style={s.unlockedBanner}
              >
                <Unlock size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={s.unlockedText}>Door Unlocked!</Text>
              </LinearGradient>
            </View>
          )}

          {/* Back to Maps */}
          <TouchableOpacity
            style={s.backToMapsBtn}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <MapPin size={15} color="#1C1C1E" strokeWidth={2} />
            <Text style={s.backToMapsText}>Back to Maps</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F2F7" },

  // ─── Header ────────────────────────────────────────
  headerWrap: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8E8E93",
    marginTop: 1,
  },

  // ─── Info Card ──────────────────────────────────────
  infoCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  infoLeft: { flex: 1, marginRight: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoAddress: { fontSize: 14, fontWeight: "600", color: "#1C1C1E", flex: 1 },
  infoId: { fontSize: 11, color: "#8E8E93", fontWeight: "500", marginTop: 3 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(7,193,96,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#07C160" },
  statusLabel: { fontSize: 12, fontWeight: "700", color: "#07C160" },

  // ─── Section Header ────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1C1C1E",
    letterSpacing: -0.4,
  },
  itemsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemsBadgeText: { fontSize: 13, fontWeight: "700", color: "#1C1C1E" },

  // ─── Product List ──────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // Apple-style Glass Card
  glassCard: {
    width: "48%",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    // Glass effect border
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.95)",
    // Soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  // Product Image Container
  imgWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  productImg: {
    width: 95,
    height: 95,
  },

  // Product Info
  productInfo: {
    alignItems: "center",
    marginBottom: 10,
    height: 40,
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    letterSpacing: -0.2,
    textAlign: "center",
    lineHeight: 18,
  },
  productCategory: {
    fontSize: 11,
    fontWeight: "500",
    color: "#8E8E93",
    marginTop: 4,
  },

  // Price
  priceWrap: {
    backgroundColor: "rgba(7,193,96,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#07C160",
  },

  // ─── Bottom Action Area ────────────────────────────
  bottomArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 12,
  },
  bottomInner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Slide to Unlock
  sliderContainer: { marginBottom: 12 },
  sliderTrack: {
    height: THUMB_SIZE + 8,
    borderRadius: (THUMB_SIZE + 8) / 2,
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  sliderText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.5,
  },
  chevronHints: {
    position: "absolute",
    right: THUMB_SIZE + 16,
    flexDirection: "row",
    alignItems: "center",
    gap: -4,
  },
  sliderThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },

  // Unlocked state
  unlockedContainer: { marginBottom: 12 },
  unlockedBanner: {
    height: THUMB_SIZE + 8,
    borderRadius: (THUMB_SIZE + 8) / 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  unlockedText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // Back to Maps
  backToMapsBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  backToMapsText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
  },
});
