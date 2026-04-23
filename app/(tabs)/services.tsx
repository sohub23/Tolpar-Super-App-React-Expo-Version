import React, { useState, useRef, useEffect } from "react";
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Wallet, Building2, TrendingUp, Car, Bus, Plane, Utensils,
  ShoppingCart, Pill, HeartPulse, ShoppingBag, Shirt, Film, Music,
  Gamepad2, ExternalLink,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { serviceCategories, allServices, featuredBusinesses } from "@/lib/mockData";
import { flattenStyle } from "@/utils/flatten-style";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  wallet: Wallet, "building-2": Building2, "trending-up": TrendingUp,
  car: Car, bus: Bus, plane: Plane, utensils: Utensils,
  "shopping-cart": ShoppingCart, pill: Pill, "heart-pulse": HeartPulse,
  "shopping-bag": ShoppingBag, shirt: Shirt, film: Film, music: Music,
  "gamepad-2": Gamepad2,
};
function getIcon(name: string, size: number, color: string) {
  const I = ICON_MAP[name] || Wallet;
  return <I size={size} color={color} strokeWidth={1.8} />;
}

function FadeRow({ children, delay }: { children: React.ReactNode; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity: anim, transform: [{ translateY: slide }] }}>{children}</Animated.View>;
}

export default function ServicesScreen() {
  const [activeCategory, setActiveCategory] = useState("All");
  const filtered = activeCategory === "All" ? allServices : allServices.filter((s) => s.category === activeCategory);

  return (
    <View style={s.root}>
      <SafeAreaView edges={["top"]} style={s.header}>
        <Text style={s.headerTitle}>Services</Text>
        <Text style={s.headerSub}>All mini apps in one place</Text>
      </SafeAreaView>

      {/* Category chips */}
      <View style={s.chipsBg}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsContent}
        >
          {serviceCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.75}
            >
              {activeCategory === cat ? (
                <LinearGradient colors={["#00C853", "#007E33"]} style={s.chipActive} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={s.chipTextActive}>{cat}</Text>
                </LinearGradient>
              ) : (
                <View style={s.chip}>
                  <Text style={s.chipText}>{cat}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Service Grid */}
        <FadeRow delay={0}>
          <View style={s.card}>
            <Text style={s.sectionTitle}>{activeCategory === "All" ? "All Services" : activeCategory}</Text>
            <View style={s.grid}>
              {filtered.map((sv) => (
                <TouchableOpacity key={sv.id} style={s.serviceCard} activeOpacity={0.75}>
                  <View style={flattenStyle([s.serviceIcon, { backgroundColor: sv.color + "18" }])}>
                    {getIcon(sv.icon, 24, sv.color)}
                  </View>
                  <Text style={s.serviceName} numberOfLines={1}>{sv.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </FadeRow>

        {/* Featured */}
        <FadeRow delay={120}>
          <View style={s.featuredHeader}>
            <Text style={s.sectionTitle}>Featured</Text>
            <TouchableOpacity activeOpacity={0.7}><Text style={s.seeAll}>See All ›</Text></TouchableOpacity>
          </View>
          <View style={s.featuredGrid}>
            {featuredBusinesses.map((biz) => (
              <TouchableOpacity key={biz.id} style={s.featuredCard} activeOpacity={0.8}>
                <LinearGradient
                  colors={biz.gradientColors as [string, string]}
                  style={s.featuredBanner}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <View style={s.featuredTag}>
                    <Text style={s.featuredTagText}>{biz.category}</Text>
                  </View>
                  <View style={s.featuredBannerDeco} />
                </LinearGradient>
                <View style={s.featuredInfo}>
                  <Text style={s.featuredName} numberOfLines={1}>{biz.name}</Text>
                  <Text style={s.featuredDesc} numberOfLines={2}>{biz.description}</Text>
                  <TouchableOpacity style={s.openBtn} activeOpacity={0.8}>
                    <ExternalLink size={11} color="#07C160" strokeWidth={2} />
                    <Text style={s.openBtnText}>Open</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  header: {
    backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 0, shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#1C1C1E", marginTop: 8, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: "#8E8E93", marginTop: 2, fontWeight: "500" },
  chipsBg: { backgroundColor: "#FFFFFF", borderBottomWidth: 0.5, borderBottomColor: "#E5E5EA" },
  chipsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#F2F2F7", borderWidth: 1, borderColor: "#E5E5EA",
  },
  chipActive: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 13, color: "#3C3C43", fontWeight: "500" },
  chipTextActive: { fontSize: 13, color: "#FFFFFF", fontWeight: "600" },
  scroll: { flex: 1 },
  content: { paddingTop: 16 },
  card: {
    backgroundColor: "#FFFFFF", marginHorizontal: 16,
    borderRadius: 20, padding: 16, marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1C1C1E", marginBottom: 14, letterSpacing: -0.2 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  serviceCard: { width: "33.33%", alignItems: "center", paddingVertical: 10 },
  serviceIcon: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  serviceName: { fontSize: 11, color: "#3C3C43", fontWeight: "500", textAlign: "center", paddingHorizontal: 4 },
  featuredHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 10,
  },
  seeAll: { color: "#07C160", fontSize: 14, fontWeight: "600" },
  featuredGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12, marginBottom: 4 },
  featuredCard: {
    width: "47%", backgroundColor: "#FFFFFF", borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  featuredBanner: { height: 96, padding: 10, justifyContent: "flex-end", overflow: "hidden" },
  featuredBannerDeco: {
    position: "absolute", width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.1)", top: -30, right: -20,
  },
  featuredTag: {
    backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
    alignSelf: "flex-start",
  },
  featuredTagText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
  featuredInfo: { padding: 12 },
  featuredName: { fontSize: 13, fontWeight: "700", color: "#1C1C1E", marginBottom: 3 },
  featuredDesc: { fontSize: 11, color: "#8E8E93", lineHeight: 15, marginBottom: 10 },
  openBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#E8F8F0", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start",
  },
  openBtnText: { color: "#07C160", fontSize: 11, fontWeight: "600" },
});
