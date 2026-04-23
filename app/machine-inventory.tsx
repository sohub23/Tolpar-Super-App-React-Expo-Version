// Machine Inventory Screen — Full-screen inventory with Slide-to-Unlock
// Navigated to from machine-map.tsx when user taps "Unlock the Door"
// Structured for future API integration: replace getInventoryForMachine() with real API call.

import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Lock, Unlock, MapPin, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  interpolateColor,
  Extrapolation,
} from "react-native-reanimated";
import { PanGestureHandler } from "react-native-gesture-handler";

import { getInventoryForMachine } from "@/lib/mockData";
import type { MachineType } from "@/lib/mockData";

const { width: SW } = Dimensions.get("window");
const SLIDER_WIDTH = SW - 64; // Padding 32 each side
const THUMB_SIZE = 60;
const SLIDE_RANGE = SLIDER_WIDTH - THUMB_SIZE - 8; // 8 for inner padding

const PASTEL_COLORS = [
  "#FCE6BA",
  "#E1F8D1",
  "#D9E2F1",
  "#FCE9E1",
  "#FFF1D0",
  "#E0F5F7",
];

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

  const onUnlockSuccess = useCallback(() => {
    setUnlocked(true);
  }, []);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx: any) => {
      const newX = ctx.startX + event.translationX;
      translateX.value = Math.max(0, Math.min(newX, SLIDE_RANGE));
    },
    onEnd: () => {
      if (translateX.value > SLIDE_RANGE * 0.85) {
        // Unlock!
        translateX.value = withSpring(SLIDE_RANGE, { damping: 15, stiffness: 150 });
        runOnJS(onUnlockSuccess)();
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
      }
    },
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

  // Split products into masonry columns
  const leftColumn = products.filter((_: any, i: number) => i % 2 === 0);
  const rightColumn = products.filter((_: any, i: number) => i % 2 !== 0);

  const renderCard = (item: any, index: number, isRight: boolean) => {
    const absoluteIndex = isRight ? index * 2 + 1 : index * 2;
    const bgColor = PASTEL_COLORS[absoluteIndex % PASTEL_COLORS.length];

    const nameParts = item.name.split(" ");
    const firstWord = nameParts[0];
    const restWords = nameParts.slice(1).join(" ");

    return (
      <View key={item.name} style={[s.card, { backgroundColor: bgColor }]}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>
            {firstWord}
            {restWords ? `\n${restWords}` : ""}
          </Text>
          <View style={s.badge}>
            <Text style={s.badgeText}>
              {type === "powerbank" ? "Charge" : type === "locker" ? "Storage" : "Snack"}
            </Text>
          </View>
        </View>
        <Image
          source={item.image}
          style={s.cardImage}
          resizeMode="contain"
        />
        <View style={s.bottomPill}>
          <Text style={s.price}>{item.price}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <LinearGradient colors={["#FFFFFF", "#F8FAFB"]} style={s.headerGradient}>
        <SafeAreaView edges={["top"]} style={s.headerBar}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#1C1C1E" strokeWidth={2} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>{machineName}</Text>
            <Text style={s.headerSub}>{machineBranch || "Machine"}</Text>
          </View>
          <View style={{ width: 44 }} />
        </SafeAreaView>
      </LinearGradient>

      {/* Machine Info Card */}
      <View style={s.infoCard}>
        <View style={s.infoLeft}>
          <View style={s.infoRow}>
            <MapPin size={14} color="#8E8E93" strokeWidth={2} />
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

      {/* Products Section Header */}
      <View style={s.sectionHeader}>
        <View>
          <Text style={s.sectionHighlight}>Available</Text>
          <Text style={s.sectionTitle}>Products</Text>
        </View>
        <View style={s.itemsCount}>
          <Text style={s.itemsCountText}>{products.length} items</Text>
        </View>
      </View>

      {/* Product Grid (Masonry) */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={s.masonryContainer}>
          <View style={s.column}>
            {leftColumn.map((item: any, i: number) => renderCard(item, i, false))}
          </View>
          <View style={[s.column, s.rightColumnStagger]}>
            {rightColumn.map((item: any, i: number) => renderCard(item, i, true))}
          </View>
        </View>
        {/* Extra space for bottom buttons */}
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
                  <ChevronRight size={16} color="rgba(255,255,255,0.3)" strokeWidth={2.5} />
                  <ChevronRight size={16} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                  <ChevronRight size={16} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
                </Animated.View>
                <PanGestureHandler onGestureEvent={gestureHandler}>
                  <Animated.View style={[s.sliderThumb, thumbAnimStyle]}>
                    <Lock size={22} color="#1C1C1E" strokeWidth={2} />
                  </Animated.View>
                </PanGestureHandler>
              </Animated.View>
            </View>
          ) : (
            /* Unlocked state */
            <View style={s.unlockedContainer}>
              <LinearGradient
                colors={["#07C160", "#00A84F"]}
                style={s.unlockedBanner}
              >
                <Unlock size={22} color="#FFFFFF" strokeWidth={2} />
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
            <MapPin size={16} color="#1C1C1E" strokeWidth={2} />
            <Text style={s.backToMapsText}>Back to Maps</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },

  // Header
  headerGradient: { borderBottomWidth: 0.5, borderBottomColor: "#E5E5EA" },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 6,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1C1C1E",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8E8E93",
    marginTop: 2,
  },

  // Info Card
  infoCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoLeft: { flex: 1, marginRight: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoAddress: { fontSize: 14, fontWeight: "600", color: "#1C1C1E", flex: 1 },
  infoId: { fontSize: 12, color: "#8E8E93", fontWeight: "500", marginTop: 4 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(7,193,96,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#07C160" },
  statusLabel: { fontSize: 12, fontWeight: "700", color: "#07C160" },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionHighlight: {
    fontSize: 22,
    fontWeight: "500",
    color: "#1C1C1E",
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1C1C1E",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  itemsCount: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  itemsCountText: { fontSize: 13, fontWeight: "600", color: "#1C1C1E" },

  // Product Grid
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },

  masonryContainer: { flexDirection: "row", gap: 14 },
  column: { flex: 1, gap: 14 },
  rightColumnStagger: { marginTop: 36 },

  // Card
  card: {
    height: 220,
    borderRadius: 28,
    padding: 18,
    overflow: "hidden",
    position: "relative",
  },
  cardHeader: { zIndex: 10 },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1C1C1E",
    letterSpacing: -0.5,
    lineHeight: 20,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.7)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: "#8E8E93" },

  cardImage: {
    position: "absolute",
    bottom: -30,
    right: -30,
    width: "125%",
    height: "95%",
    transform: [{ rotate: "-15deg" }],
    zIndex: 1,
  },

  bottomPill: {
    position: "absolute",
    bottom: 14,
    left: 14,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    zIndex: 10,
  },
  price: { fontSize: 13, fontWeight: "800", color: "#1C1C1E" },

  // Bottom Action Area
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
    shadowOpacity: 0.08,
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
    shadowOpacity: 0.15,
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
    height: 52,
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
