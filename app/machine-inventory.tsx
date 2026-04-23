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
  Linking,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Lock, Unlock, MapPin, ChevronRight, Package, CheckCircle2, Navigation } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
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
    machinePhoto,
    machineTitle,
  } = useLocalSearchParams<{
    machineId: string;
    machineBranch: string;
    machineAddress: string;
    machineType: string;
    machineStatus: string;
    machinePhoto: string;
    machineTitle: string;
  }>();

  const type = (machineType as MachineType) || "omama";
  const products = getInventoryForMachine(type);
  const machineName = machineTitle || getMachineName(type);

  // Set route handler
  const handleSetRoute = useCallback(() => {
    // Dummy coordinates for now — will be replaced with real API data
    const lat = 23.7537633;
    const lng = 90.3612483;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url!).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  }, []);

  // Slide-to-unlock state
  const [unlocked, setUnlocked] = useState(false);
  const [orderFinished, setOrderFinished] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  // 3D Futuristic animation values
  const doorOpenAnim = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  const onUnlockSuccess = useCallback(() => {
    setUnlocked(true);

    // Door opens smoothly with a spring
    doorOpenAnim.value = withSpring(1, { damping: 14, stiffness: 90 });
    textOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    progressWidth.value = withTiming(1, { duration: 4000, easing: Easing.linear });

    // Dummy API: door locks back after 4s
    setTimeout(() => {
      setOrderFinished(true);
      
      // Door closes smoothly
      doorOpenAnim.value = withSpring(0, { damping: 14, stiffness: 90 });
      
      // Show button after door closes
      setTimeout(() => { 
        btnOpacity.value = withTiming(1, { duration: 400 }); 
      }, 800);
    }, 4000);
  }, []);

  const FRIDGE_WIDTH = 140;
  
  const doorStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(doorOpenAnim.value, [0, 1], [0, -105]);
    return {
      transform: [
        { perspective: 1000 },
        { translateX: -FRIDGE_WIDTH / 2 },
        { rotateY: `${rotateY}deg` },
        { translateX: FRIDGE_WIDTH / 2 }
      ],
    };
  });

  const interiorLightStyle = useAnimatedStyle(() => {
    const opacity = interpolate(doorOpenAnim.value, [0, 1], [0.3, 1]);
    return { opacity };
  });

  const VENDING_DOOR_WIDTH = 106;
  const vendingDoorStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(doorOpenAnim.value, [0, 1], [0, -105]);
    return {
      transform: [
        { perspective: 1000 },
        { translateX: -VENDING_DOOR_WIDTH / 2 },
        { rotateY: `${rotateY}deg` },
        { translateX: VENDING_DOOR_WIDTH / 2 }
      ],
    };
  });

  const popStyle = useAnimatedStyle(() => {
    const translateY = interpolate(doorOpenAnim.value, [0, 1], [0, -35]);
    return { transform: [{ translateY }] };
  });

  const lockerDoorStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(doorOpenAnim.value, [0, 1], [0, -100]);
    return {
      transform: [
        { perspective: 800 },
        { translateX: -28 },
        { rotateY: `${rotateY}deg` },
        { translateX: 28 }
      ],
    };
  });

  const progressBarStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value * 100}%` }));
  const textFadeStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const btnFadeStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

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

  const renderFridgeAnimation = () => (
    <View style={[s.fridgeAnimationWrap, s.orangeGlow]}>
      <View style={[s.fridgeBody, s.orangeBorder]}>
        <View style={s.fridgeSignboard}>
          <Text style={s.fridgeSignboardText}>O-MAMA</Text>
        </View>
        <View style={s.fridgeInterior}>
          <Image source={require('../assets/images/omama-machine-bg.png')} style={s.machineBgImage} />
          <Animated.View style={[s.fridgeGlow, interiorLightStyle]} />
        </View>
        <Animated.View style={[s.fridgeDoor, doorStyle]}>
          <View style={s.doorGlassReal}>
            <View style={s.doorGlassReflection} />
          </View>
          <View style={s.doorHandleReal} />
        </Animated.View>
      </View>
    </View>
  );

  const renderVendingAnimation = () => (
    <View style={[s.fridgeAnimationWrap, s.orangeGlow]}>
      <View style={[s.vendingBody, s.orangeBorder]}>
        <View style={s.vendingInterior}>
          <Image source={require('../assets/images/snack-machine-bg.png')} style={s.machineBgImage} />
          <Animated.View style={[s.fridgeGlow, interiorLightStyle]} />
          <Animated.View style={[s.vendingDoor, vendingDoorStyle]}>
            <View style={s.doorGlassReal}>
              <View style={s.doorGlassReflection} />
            </View>
            <View style={s.doorHandleReal} />
          </Animated.View>
        </View>
        <View style={s.vendingPanel}>
          <View style={s.vendingScreen}>
            <Text style={s.vendingScreenText}>SOHUB</Text>
          </View>
          <View style={s.vendingKeypad} />
          <View style={s.vendingSlot} />
        </View>
        <View style={s.vendingBin} />
      </View>
    </View>
  );

  const renderPowerbankAnimation = () => (
    <View style={s.fridgeAnimationWrap}>
      <View style={s.powerbankStation}>
        <View style={s.pbHeader} />
        <View style={s.pbSlots}>
          <View style={s.pbSlot}><View style={s.pbItem}><View style={s.pbLight}/></View></View>
          <View style={s.pbSlot}>
            <Animated.View style={[s.pbItem, popStyle]}>
              <View style={[s.pbLight, s.pbLightActive]}/>
            </Animated.View>
          </View>
          <View style={s.pbSlot}><View style={s.pbItem}><View style={s.pbLight}/></View></View>
        </View>
      </View>
    </View>
  );

  const renderLockerAnimation = () => (
    <View style={s.fridgeAnimationWrap}>
      <View style={s.lockerStation}>
        <View style={s.lockerGrid}>
          <View style={s.lockerCell}><View style={s.lockerDoorSolid}/></View>
          <View style={s.lockerCell}>
            <View style={s.lockerInterior}><Package color="#FF9500" size={24} /></View>
            <Animated.View style={[s.lockerDoorSolid, s.lockerDoorAnimated, lockerDoorStyle]}>
               <View style={s.lockerHandle}/>
            </Animated.View>
          </View>
          <View style={s.lockerCell}><View style={s.lockerDoorSolid}/></View>
          <View style={s.lockerCell}><View style={s.lockerDoorSolid}/></View>
        </View>
        <View style={s.lockerConsole}>
          <View style={s.lockerScreen}/>
        </View>
      </View>
    </View>
  );

  const renderMachineAnimation = () => {
    switch (type) {
      case "vending":
        return renderVendingAnimation();
      case "powerbank":
        return renderPowerbankAnimation();
      case "locker":
        return renderLockerAnimation();
      case "omama":
      default:
        return renderFridgeAnimation();
    }
  };

  if (unlocked) {
    return (
      <View style={s.root}>
        {/* Header - Unlocked */}
        <View style={s.headerWrap}>
          <SafeAreaView edges={["top"]} style={s.headerBar}>
            <View style={{ width: 40 }} />
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>{machineName}</Text>
              <Text style={s.headerSub}>{machineBranch || "Machine"}</Text>
            </View>
            <View style={{ width: 40 }} />
          </SafeAreaView>
        </View>

        {/* Futuristic 3D Progress Content */}
        <View style={s.progressContainer}>
          {renderMachineAnimation()}

          {/* 3D Status text */}
          <Animated.View style={[s.statusTextWrap, textFadeStyle]}>
            {orderFinished ? (
              <>
                <Text style={s.statusTitle3D}>SESSION COMPLETE</Text>
                <Text style={s.statusDesc}>
                  The door is securely locked. Thank you for using the {machineName}!
                </Text>
              </>
            ) : (
              <>
                <Text style={s.statusTitle3D}>DOOR UNLOCKED</Text>
                <Text style={s.statusDesc}>
                  Please collect your items.{"\n"}The machine will auto-lock when you close the door.
                </Text>
              </>
            )}
          </Animated.View>

          {/* Progress bar */}
          {!orderFinished && (
            <View style={s.progressBarTrack}>
              <Animated.View style={[s.progressBarFill, progressBarStyle]} />
            </View>
          )}
        </View>

        {/* Bottom Actions */}
        <View style={s.bottomArea}>
          <SafeAreaView edges={["bottom"]} style={s.bottomInner}>
            {orderFinished ? (
              <Animated.View style={btnFadeStyle}>
                <TouchableOpacity
                  style={[s.routeBtn, s.btnPrimary]}
                  activeOpacity={0.8}
                  onPress={() => router.back()}
                >
                  <MapPin size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={[s.routeBtnText, { color: "#FFFFFF" }]}>Back to Maps</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View style={s.loadingBtn}>
                <Text style={s.loadingBtnText}>Communicating with machine...</Text>
              </View>
            )}
          </SafeAreaView>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.headerWrap}>
        <SafeAreaView edges={["top"]} style={s.headerBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#1C1C1E" strokeWidth={2} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>{machineName}</Text>
            <Text style={s.headerSub}>{machineBranch || "Machine"}</Text>
          </View>
          <View style={{ width: 40 }} />
        </SafeAreaView>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Machine Info Card — Info Left, Photo Right */}
        <View style={s.productCard}>
          <View style={s.productCardRow}>
            <View style={s.productCardInfo}>
              <Text style={s.productCardName} numberOfLines={1}>{machineName}</Text>
              <View style={s.productCardAddressRow}>
                <MapPin size={12} color="#8E8E93" strokeWidth={2} />
                <Text style={s.productCardAddress} numberOfLines={1}>{machineAddress || "Machine Location"}</Text>
              </View>
              <View style={s.productCardMetaRow}>
                <View style={[s.statusChip, machineStatus === "Maintenance" && { backgroundColor: "rgba(243,156,18,0.1)" }, machineStatus === "Offline" && { backgroundColor: "rgba(231,76,60,0.1)" }]}>
                  <View style={[s.statusDot, machineStatus === "Maintenance" && { backgroundColor: "#F39C12" }, machineStatus === "Offline" && { backgroundColor: "#E74C3C" }]} />
                  <Text style={[s.statusLabel, machineStatus === "Maintenance" && { color: "#F39C12" }, machineStatus === "Offline" && { color: "#E74C3C" }]}>{machineStatus || "Online"}</Text>
                </View>
                <Text style={s.availText}>Open 24/7</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={() => machinePhoto && setShowImageModal(true)}>
              {machinePhoto ? (
                <Image source={{ uri: machinePhoto }} style={s.machineThumb} />
              ) : (
                <View style={[s.machineThumb, { backgroundColor: "#F2F2F7", alignItems: "center", justifyContent: "center" }]}>
                  <Package size={24} color="#8E8E93" strokeWidth={1.5} />
                </View>
              )}
            </TouchableOpacity>
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

        {/* Product Grid — 3 per row */}
        <View style={s.gridContainer}>
          {products.map((item: any, index: number) => (
            <View key={item.name + index} style={s.glassCard}>
              <View style={s.imgWrap}>
                <Image source={item.image} style={s.productImg} resizeMode="contain" />
              </View>
              <View style={s.productInfo}>
                <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
              </View>
              <View style={s.priceWrap}>
                <Text style={s.priceText}>{item.price}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Bottom — 2 Buttons in 1 Row */}
      <View style={s.bottomArea}>
        <SafeAreaView edges={["bottom"]} style={s.bottomInner}>
          <View style={s.bottomBtnRow}>
            <TouchableOpacity style={s.routeBtn} activeOpacity={0.8} onPress={handleSetRoute}>
              <Navigation size={16} color="#1C1C1E" strokeWidth={2} />
              <Text style={s.routeBtnText}>Set to Route</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.unlockDoorBtn} activeOpacity={0.8} onPress={() => setShowUnlockModal(true)}>
              <Unlock size={16} color="#FFFFFF" strokeWidth={2} />
              <Text style={s.unlockDoorBtnText}>Unlock the Door</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* ─── Unlock Confirmation Overlay (Replaces Modal) ─── */}
      {showUnlockModal && (
        <View style={[StyleSheet.absoluteFill, s.modalOverlay]}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => { setShowUnlockModal(false); translateX.value = withSpring(0); }} 
          />
          <View style={s.modalCard}>
            <View style={s.modalIconWrap}>
              <Unlock size={28} color="#07C160" strokeWidth={2} />
            </View>
            <Text style={s.modalTitle}>Open the Door</Text>
            <Text style={s.modalDesc}>The machine door will be unlocked. Please collect your items after unlocking.</Text>
            
            {/* Slide to Unlock */}
            <View style={s.sliderContainer}>
              <View style={s.sliderTrackGreen}>
                <Animated.Text style={[s.sliderText, sliderTextAnimStyle]}>Slide to Unlock</Animated.Text>
                <Animated.View style={[s.chevronHints, sliderTextAnimStyle]}>
                  <ChevronRight size={14} color="rgba(255,255,255,0.3)" strokeWidth={2.5} />
                  <ChevronRight size={14} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                  <ChevronRight size={14} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
                </Animated.View>
                <GestureDetector gesture={panGesture}>
                  <Animated.View style={[s.sliderThumb, thumbAnimStyle]}>
                    <Lock size={20} color="#07C160" strokeWidth={2} />
                  </Animated.View>
                </GestureDetector>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ─── Image Preview Modal ─── */}
      <Modal visible={showImageModal} transparent animationType="fade" statusBarTranslucent>
        <TouchableOpacity style={s.imageModalOverlay} activeOpacity={1} onPress={() => setShowImageModal(false)}>
          {machinePhoto && <Image source={{ uri: machinePhoto }} style={s.imageModalFull} resizeMode="contain" />}
        </TouchableOpacity>
      </Modal>
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
  // ─── Machine Product Card ──────────────────────────
  productCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  productCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  machineThumb: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#F2F2F7",
    marginRight: 12,
  },
  productCardInfo: {
    flex: 1,
  },
  productCardName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1C1C1E",
    letterSpacing: -0.3,
  },
  productCardAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  productCardAddress: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
    flex: 1,
  },
  productCardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  availText: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "600",
  },
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

  // Product Card — 3 per row
  glassCard: {
    width: "31%",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },

  // Product Image Container
  imgWrap: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  productImg: {
    width: 65,
    height: 65,
  },

  // Product Info
  productInfo: {
    alignItems: "center",
    marginBottom: 6,
    height: 32,
    justifyContent: "center",
  },
  productName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1C1C1E",
    letterSpacing: -0.2,
    textAlign: "center",
    lineHeight: 14,
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
    fontSize: 11,
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
  sliderContainer: { marginBottom: 12, width: "100%" },
  sliderTrackGreen: {
    height: THUMB_SIZE + 8,
    borderRadius: (THUMB_SIZE + 8) / 2,
    backgroundColor: "#07C160",
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

  // Bottom 2 Buttons
  bottomBtnRow: {
    flexDirection: "row",
    gap: 12,
  },
  routeBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  routeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
  },
  unlockDoorBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#07C160",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  unlockDoorBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // ─── Modal Styles ──────────────────────────────
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 24,
    alignItems: "center",
    zIndex: 999, // Ensure it's above everything
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 24,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(7,193,96,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1C1C1E",
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  modalDesc: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalFull: {
    width: "100%",
    height: "100%",
  },

  // ─── Machine Animations ──────────────────────────
  progressContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    marginTop: -40,
  },
  fridgeAnimationWrap: {
    width: 200,
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    perspective: 1000,
  },
  orangeBorder: {
    borderColor: "#FF9500",
    borderWidth: 3,
  },
  orangeGlow: {
    shadowColor: "#FF9500",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  // FRIDGE (omama)
  fridgeBody: {
    width: 140,
    height: 240,
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  fridgeSignboard: {
    width: "100%",
    height: 24,
    backgroundColor: "#1C1C1E",
    borderBottomWidth: 2,
    borderBottomColor: "#FF9500",
    alignItems: "center",
    justifyContent: "center",
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  fridgeSignboardText: {
    color: "#FF9500",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
  },
  fridgeInterior: {
    width: 124,
    height: 206,
    backgroundColor: "#1C1C1E",
    borderRadius: 8,
    marginTop: 4,
    alignItems: "center",
    overflow: "hidden",
  },
  fridgeGlow: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255,149,0,0.15)",
  },
  machineBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  fridgeDoor: {
    position: "absolute",
    top: 26, left: -2,
    width: 140, height: 216,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  doorGlassReal: {
    flex: 1,
    margin: 8,
    backgroundColor: "rgba(200,220,240,0.2)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    overflow: "hidden",
  },
  doorGlassReflection: {
    position: "absolute",
    top: -50, right: -50,
    width: 200, height: 200,
    backgroundColor: "rgba(255,255,255,0.1)",
    transform: [{ rotate: "45deg" }],
  },

  doorHandleReal: {
    position: "absolute",
    right: 6, top: "40%",
    width: 6, height: 60,
    backgroundColor: "#D1D1D6",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#AEAEB2",
  },

  // VENDING MACHINE (snack)
  vendingBody: {
    width: 160,
    height: 250,
    backgroundColor: "#2C2C2E",
    borderRadius: 16,
    flexDirection: "row",
    padding: 8,
  },
  vendingInterior: {
    width: 106,
    height: "100%",
    backgroundColor: "#1C1C1E",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#48484A",
    overflow: "hidden",
  },
  vendingDoor: {
    position: "absolute",
    top: -2, left: -2,
    width: 106, height: 232,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  vendingPanel: {
    width: 36,
    marginLeft: 6,
    alignItems: "center",
    paddingTop: 10,
  },
  vendingScreen: {
    width: 32, height: 16, backgroundColor: "#FF9500", borderRadius: 3, marginBottom: 12,
    justifyContent: "center", alignItems: "center",
  },
  vendingScreenText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  vendingKeypad: {
    width: 26, height: 36, backgroundColor: "#48484A", borderRadius: 3, marginBottom: 12,
  },
  vendingSlot: {
    width: 16, height: 4, backgroundColor: "#1C1C1E", borderRadius: 2,
  },
  vendingBin: {
    position: "absolute",
    bottom: 8, left: 8,
    width: 90, height: 26,
    backgroundColor: "#1C1C1E",
    borderTopWidth: 2, borderTopColor: "#48484A",
    borderRadius: 4,
  },

  // POWERBANK STATION
  powerbankStation: {
    width: 140,
    height: 220,
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#3A3A3C",
    alignItems: "center",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  pbHeader: {
    width: 80, height: 24, backgroundColor: "#2C2C2E", borderRadius: 12, marginBottom: 20,
  },
  pbSlots: {
    width: "100%", gap: 16, alignItems: "center",
  },
  pbSlot: {
    width: 90, height: 32, backgroundColor: "#2C2C2E", borderRadius: 6,
    justifyContent: "center", alignItems: "center",
  },
  pbItem: {
    width: 80, height: 28, backgroundColor: "#3A3A3C", borderRadius: 4,
    justifyContent: "center", alignItems: "flex-end", paddingRight: 8,
    borderWidth: 1, borderColor: "#48484A",
  },
  pbLight: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#8E8E93",
  },
  pbLightActive: {
    backgroundColor: "#34C759",
    shadowColor: "#34C759", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4,
  },

  // SMART LOCKER
  lockerStation: {
    width: 180,
    height: 240,
    backgroundColor: "#E5E5EA",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D1D6",
    flexDirection: "row",
    padding: 8,
  },
  lockerGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  lockerCell: {
    width: 56, height: 60,
    backgroundColor: "#1C1C1E",
    borderRadius: 4,
    justifyContent: "center", alignItems: "center",
  },
  lockerInterior: {
    position: "absolute",
    alignItems: "center", justifyContent: "center",
  },
  lockerDoorSolid: {
    width: "100%", height: "100%",
    backgroundColor: "#D1D1D6",
    borderRadius: 4,
    borderWidth: 1, borderColor: "#AEAEB2",
  },
  lockerDoorAnimated: {
    position: "absolute", top: 0, left: 0,
    justifyContent: "center", alignItems: "flex-end", paddingRight: 4,
    shadowColor: "#000", shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  lockerHandle: {
    width: 4, height: 16, backgroundColor: "#8E8E93", borderRadius: 2,
  },
  lockerConsole: {
    width: 40,
    backgroundColor: "#C7C7CC",
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
    paddingTop: 16,
  },
  lockerScreen: {
    width: 28, height: 20, backgroundColor: "#0A84FF", borderRadius: 4,
  },

  statusTextWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  statusTitle3D: {
    fontSize: 28,
    fontWeight: "900",
    color: "#07C160",
    textShadowColor: "rgba(7,193,96,0.3)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  statusDesc: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  progressBarTrack: {
    width: "80%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(7,193,96,0.15)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#07C160",
  },
  btnPrimary: {
    backgroundColor: "#07C160",
    borderWidth: 0,
  },
  loadingBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(7,193,96,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 4,
  },
  loadingBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#07C160",
    letterSpacing: 0.3,
  },
});
