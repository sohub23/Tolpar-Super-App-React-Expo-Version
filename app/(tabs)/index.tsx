import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Modal,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ScanQrCode, Bell, Search, CreditCard, ArrowRightLeft,
  PlusCircle, Receipt, Plane, ShoppingBag, HeartPulse,
  Grid2x2, Utensils, Car, Building2, Star, ArrowDownLeft, Zap,
  X, CheckCircle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Camera, CameraView } from "expo-camera";
import {
  bannerSlides, quickActions, myServices,
  nearbyBusinesses, recentActivity,
} from "@/lib/mockData";
import { flattenStyle } from "@/utils/flatten-style";
import { useSupabaseGreetings } from "@/hooks/useSupabaseGreetings";
import { MachineCard } from "@/components/MachineCard";

const { width: SW } = Dimensions.get("window");
const BANNER_W = SW - 32;

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  "scan-qr-code": ScanQrCode, "credit-card": CreditCard, "arrow-right-left": ArrowRightLeft,
  "plus-circle": PlusCircle, receipt: Receipt, plane: Plane,
  "shopping-bag": ShoppingBag, "heart-pulse": HeartPulse,
  "grid-2x2": Grid2x2, utensils: Utensils, car: Car,
  "building-2": Building2, "arrow-down-left": ArrowDownLeft, zap: Zap,
};
function getIcon(name: string, size: number, color: string) {
  const I = ICON_MAP[name] || Grid2x2;
  return <I size={size} color={color} strokeWidth={1.8} />;
}

// Machine image assets mapping
const MACHINE_IMAGES: Record<string, any> = {
  omama: require("../../assets/images/omama.png"),
  vending: require("../../assets/images/vending.png"),
  powerbank: require("../../assets/images/powerbank.png"),
  locker: require("../../assets/images/locker.png"),
};

// Staggered fade-in row
function FadeRow({ children, delay }: { children: React.ReactNode; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: slide }] }}>
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef<ScrollView>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Greeting system
  const { greeting } = useSupabaseGreetings();

  // QR Scanner state
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  // Balance count-up animation
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayBalance, setDisplayBalance] = useState("0.00");
  useEffect(() => {
    Animated.timing(countAnim, { toValue: 12500, duration: 900, delay: 300, useNativeDriver: false }).start();
    countAnim.addListener(({ value }) => {
      setDisplayBalance(value.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    });
    return () => countAnim.removeAllListeners();
  }, []);

  // Camera permission and sound setup
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    autoRef.current = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % bannerSlides.length;
        bannerRef.current?.scrollTo({ x: next * (BANNER_W + 12), animated: true });
        return next;
      });
    }, 3200);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []);

  // Handle QR code scan
  const handleQRScan = (data: string) => {
    if (!scanned) {
      setScanned(true);
      setScannedData(data);
    }
  };

  // Open QR scanner modal
  const openQRScanner = () => {
    if (hasPermission === null) {
      Alert.alert('Permission', 'Camera permission is required');
      return;
    }
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera access is required to scan QR codes');
      return;
    }
    setQrModalVisible(true);
    setScanned(false);
    setScannedData(null);
  };

  // Handle quick action tap
  const handleQuickActionTap = (actionId: string) => {
    if (actionId === 'qr') {
      openQRScanner();
    }
  };

  return (
    <View style={s.root}>
      {/* QR Scanner Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={qrModalVisible}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={s.qrContainer}>
          {!scannedData ? (
            <>
              <CameraView
                style={s.qrCamera}
                facing="back"
                onBarcodeScanned={({ data }) => handleQRScan(data)}
              />
              <View style={s.qrOverlay}>
                <View style={s.qrCornerTL} />
                <View style={s.qrCornerTR} />
                <View style={s.qrCornerBL} />
                <View style={s.qrCornerBR} />
                <Text style={s.qrText}>Align QR code in frame</Text>
              </View>
              <TouchableOpacity
                style={s.qrCloseBtn}
                onPress={() => setQrModalVisible(false)}
              >
                <X size={28} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={s.qrResultContainer}>
              <LinearGradient
                colors={["#07C160", "#00A84F"]}
                style={s.qrResultGradient}
              >
                <CheckCircle size={60} color="#FFFFFF" strokeWidth={1.5} />
                <Text style={s.qrResultTitle}>Scanned Successfully!</Text>
                <View style={s.qrResultBox}>
                  <Text style={s.qrResultLabel}>Data:</Text>
                  <Text style={s.qrResultData} selectable>
                    {scannedData}
                  </Text>
                </View>
              </LinearGradient>
              <View style={s.qrResultActions}>
                <TouchableOpacity
                  style={s.qrActionBtn}
                  onPress={() => {
                    setQrModalVisible(false);
                    setScannedData(null);
                    setScanned(false);
                  }}
                >
                  <Text style={s.qrActionBtnText}>Done</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.qrActionBtnSecondary}
                  onPress={() => {
                    setScannedData(null);
                    setScanned(false);
                  }}
                >
                  <Text style={s.qrActionBtnSecondaryText}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Header */}
      <LinearGradient colors={["#FFFFFF", "#FFFFFF"]} style={s.header}>
        <SafeAreaView edges={["top"]} style={s.headerInner}>
          <View>
            <Text style={s.greeting}>
              {greeting ? `${greeting.emoji ? greeting.emoji + ' ' : ''}${greeting.message}` : 'Good morning 👋'}
            </Text>
            <Text style={s.logo}>Tolpar</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity
              style={s.headerBtn}
              activeOpacity={0.7}
              onPress={openQRScanner}
            >
              <ScanQrCode size={21} color="#1C1C1E" strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity style={s.headerBtn} activeOpacity={0.7}>
              <Bell size={21} color="#1C1C1E" strokeWidth={1.8} />
              <View style={s.notifDot} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Search */}
        <FadeRow delay={0}>
          <TouchableOpacity style={s.searchBar} activeOpacity={0.8}>
            <Search size={16} color="#8E8E93" strokeWidth={1.8} />
            <Text style={s.searchText}>Search services, businesses…</Text>
          </TouchableOpacity>
        </FadeRow>

        {/* Balance Card */}
        <FadeRow delay={80}>
          <LinearGradient
            colors={["#00C853", "#007E33"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.balanceCard}
          >
            {/* Decorative circles */}
            <View style={s.deco1} />
            <View style={s.deco2} />
            <Text style={s.balanceLabel}>Total Balance</Text>
            <Text style={s.balanceAmount}>৳ {displayBalance}</Text>
            <View style={s.balanceRow}>
              <TouchableOpacity style={s.balanceAction} activeOpacity={0.8}>
                <Text style={s.balanceActionText}>Top Up</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.balanceAction} activeOpacity={0.8}>
                <Text style={s.balanceActionText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.balanceAction} activeOpacity={0.8}>
                <Text style={s.balanceActionText}>History</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </FadeRow>

        {/* Quick Actions */}
        <FadeRow delay={160}>
          <View style={s.card}>
            <View style={s.quickGrid}>
              {quickActions.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={s.quickItem}
                  activeOpacity={0.7}
                  onPress={() => handleQuickActionTap(a.id)}
                >
                  <View style={s.quickIcon}>
                    {getIcon(a.icon, 20, "#07C160")}
                  </View>
                  <Text style={s.quickLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </FadeRow>

        {/* Banner Carousel */}
        <FadeRow delay={240}>
          <View style={s.bannerSection}>
            <ScrollView
              ref={bannerRef}
              horizontal pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={BANNER_W + 12}
              contentContainerStyle={s.bannerContent}
              onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                setActiveBanner(Math.round(e.nativeEvent.contentOffset.x / (BANNER_W + 12)));
              }}
              scrollEventThrottle={16}
            >
              {bannerSlides.map((slide) => (
                <LinearGradient
                  key={slide.id}
                  colors={slide.gradientColors as [string, string]}
                  style={s.bannerSlide}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <View style={s.bannerDeco} />
                  <Text style={s.bannerTitle}>{slide.title}</Text>
                  <Text style={s.bannerSub}>{slide.subtitle}</Text>
                  <TouchableOpacity style={s.bannerBtn} activeOpacity={0.8}>
                    <Text style={s.bannerBtnText}>Learn More</Text>
                  </TouchableOpacity>
                </LinearGradient>
              ))}
            </ScrollView>
            <View style={s.dots}>
              {bannerSlides.map((_, i) => (
                <View key={i} style={i === activeBanner ? s.dotActive : s.dot} />
              ))}
            </View>
          </View>
        </FadeRow>

        {/* My Services — Machine Quick Access */}
        <FadeRow delay={300}>
          <View style={s.card}>
            <Text style={s.sectionTitle}>Smart Machines</Text>
            <View style={s.servicesGrid}>
              {myServices.map((sv) => (
                <MachineCard
                  key={sv.id}
                  id={sv.id}
                  label={sv.label}
                  color={sv.color}
                  image={(sv as any).image}
                  machineType={(sv as any).machineType}
                  onPress={(type) => router.push({ pathname: "/machine-map", params: { type } })}
                />
              ))}
            </View>
          </View>
        </FadeRow>

        {/* Nearby */}
        <FadeRow delay={360}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Nearby</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={s.seeAll}>See All ›</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.nearbyContent}>
            {nearbyBusinesses.map((biz) => (
              <TouchableOpacity key={biz.id} style={s.bizCard} activeOpacity={0.8}>
                <View style={flattenStyle([s.bizTop, { backgroundColor: biz.color + "18" }])}>
                  <View style={flattenStyle([s.bizAvatar, { backgroundColor: biz.color }])}>
                    <Building2 size={18} color="#FFF" strokeWidth={1.8} />
                  </View>
                </View>
                <View style={s.bizBody}>
                  <Text style={s.bizName} numberOfLines={1}>{biz.name}</Text>
                  <View style={s.bizRatingRow}>
                    <Star size={11} color="#FF9500" fill="#FF9500" />
                    <Text style={s.bizRating}>{biz.rating}</Text>
                    <Text style={s.bizDist}>· {biz.distance}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </FadeRow>

        {/* Recent Activity */}
        <FadeRow delay={420}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity activeOpacity={0.7}><Text style={s.seeAll}>See All ›</Text></TouchableOpacity>
          </View>
          <View style={s.card}>
            {recentActivity.map((item, i) => (
              <View key={item.id}>
                <TouchableOpacity style={s.activityRow} activeOpacity={0.7}>
                  <View style={flattenStyle([s.activityIcon, { backgroundColor: item.color + "15" }])}>
                    {getIcon(item.icon, 18, item.color)}
                  </View>
                  <View style={s.activityInfo}>
                    <Text style={s.activityTitle}>{item.title}</Text>
                    <Text style={s.activitySub}>{item.subtitle}</Text>
                  </View>
                  <View style={s.activityRight}>
                    <Text style={flattenStyle([s.activityAmount, { color: item.type === "credit" ? "#07C160" : "#1C1C1E" }])}>
                      {item.amount}
                    </Text>
                    <Text style={s.activityDate}>{item.date}</Text>
                  </View>
                </TouchableOpacity>
                {i < recentActivity.length - 1 && <View style={s.sep} />}
              </View>
            ))}
          </View>
        </FadeRow>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F2F2F7" },

  // Header
  header: { backgroundColor: "#FFFFFF" },
  headerInner: {
    flexDirection: "row", alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, paddingTop: 4,
  },
  greeting: { fontSize: 13, color: "#8E8E93", fontWeight: "500", marginBottom: 2 },
  logo: { fontSize: 28, fontWeight: "800", color: "#1C1C1E", letterSpacing: -0.5 },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#F2F2F7",
    alignItems: "center", justifyContent: "center",
  },
  notifDot: {
    position: "absolute", top: 9, right: 9,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: "#FF3B30", borderWidth: 1.5, borderColor: "#F2F2F7",
  },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 0 },

  // Search
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    marginHorizontal: 16, marginBottom: 12, gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  searchText: { color: "#8E8E93", fontSize: 15, flex: 1 },

  // Balance Card
  balanceCard: {
    marginHorizontal: 16, borderRadius: 24,
    padding: 24, marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#07C160", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 20, elevation: 8,
  },
  deco1: {
    position: "absolute", width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)", top: -60, right: -40,
  },
  deco2: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: 20,
  },
  balanceLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "500", marginBottom: 6 },
  balanceAmount: { color: "#FFFFFF", fontSize: 40, fontWeight: "800", letterSpacing: -1, marginBottom: 20 },
  balanceRow: { flexDirection: "row", gap: 10 },
  balanceAction: {
    backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  balanceActionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },

  // Card container
  card: {
    backgroundColor: "#FFFFFF", marginHorizontal: 16,
    borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },

  // Quick Actions
  quickGrid: { flexDirection: "row", flexWrap: "wrap" },
  quickItem: { width: "25%", alignItems: "center", paddingVertical: 10 },
  quickIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "#F2F2F7",
    alignItems: "center", justifyContent: "center", marginBottom: 7,
  },
  quickLabel: { fontSize: 11, color: "#3C3C43", fontWeight: "500", textAlign: "center", lineHeight: 14 },

  // Banner
  bannerSection: { marginHorizontal: 16, marginBottom: 12 },
  bannerContent: { gap: 12 },
  bannerSlide: {
    width: BANNER_W, borderRadius: 20, padding: 22,
    minHeight: 120, justifyContent: "flex-end", overflow: "hidden",
  },
  bannerDeco: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.08)", top: -50, right: -30,
  },
  bannerTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", marginBottom: 3, letterSpacing: -0.3 },
  bannerSub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 14 },
  bannerBtn: {
    backgroundColor: "rgba(255,255,255,0.22)", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    alignSelf: "flex-start",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
  },
  bannerBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 10 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#C7C7CC" },
  dotActive: { width: 20, height: 5, borderRadius: 2.5, backgroundColor: "#07C160" },

  // Services
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1C1C1E", marginBottom: 14, letterSpacing: -0.2 },
  servicesGrid: { flexDirection: "row", justifyContent: "space-between" },
  serviceItem: { alignItems: "center", flex: 1 },
  serviceIcon: {
    width: 54, height: 54, borderRadius: 16,
    alignItems: "center", justifyContent: "center", marginBottom: 7,
  },
  serviceLabel: { fontSize: 11, color: "#3C3C43", fontWeight: "500", textAlign: "center" },

  // Section header
  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, marginBottom: 10,
  },
  seeAll: { color: "#07C160", fontSize: 14, fontWeight: "600" },

  // Nearby
  nearbyContent: { paddingHorizontal: 16, gap: 12, marginBottom: 12 },
  bizCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, width: 140,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  bizTop: { height: 76, alignItems: "center", justifyContent: "center" },
  bizAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  bizBody: { padding: 10 },
  bizName: { fontSize: 13, fontWeight: "600", color: "#1C1C1E", marginBottom: 4 },
  bizRatingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  bizRating: { fontSize: 12, color: "#1C1C1E", fontWeight: "600" },
  bizDist: { fontSize: 11, color: "#8E8E93" },

  // Activity
  activityRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  activityIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: "600", color: "#1C1C1E" },
  activitySub: { fontSize: 12, color: "#8E8E93", marginTop: 2 },
  activityRight: { alignItems: "flex-end" },
  activityAmount: { fontSize: 14, fontWeight: "700" },
  activityDate: { fontSize: 11, color: "#8E8E93", marginTop: 2 },
  sep: { height: 0.5, backgroundColor: "#F2F2F7", marginLeft: 56 },

  // QR Scanner
  qrContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  qrCamera: {
    flex: 1,
    width: "100%",
  },
  qrOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  qrCornerTL: {
    position: "absolute",
    top: "20%",
    left: "15%",
    width: 50,
    height: 50,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#07C160",
  },
  qrCornerTR: {
    position: "absolute",
    top: "20%",
    right: "15%",
    width: 50,
    height: 50,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#07C160",
  },
  qrCornerBL: {
    position: "absolute",
    bottom: "20%",
    left: "15%",
    width: 50,
    height: 50,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#07C160",
  },
  qrCornerBR: {
    position: "absolute",
    bottom: "20%",
    right: "15%",
    width: 50,
    height: 50,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#07C160",
  },
  qrText: {
    position: "absolute",
    bottom: 60,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  qrCloseBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  qrResultContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  qrResultGradient: {
    width: "100%",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginBottom: 30,
  },
  qrResultTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 15,
    marginBottom: 20,
  },
  qrResultBox: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 15,
    padding: 15,
    marginTop: 10,
  },
  qrResultLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  qrResultData: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    lineHeight: 22,
  },
  qrResultActions: {
    width: "100%",
    gap: 12,
  },
  qrActionBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#07C160",
    justifyContent: "center",
    alignItems: "center",
  },
  qrActionBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  qrActionBtnSecondary: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
  },
  qrActionBtnSecondaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1C1C1E",
  },
});
