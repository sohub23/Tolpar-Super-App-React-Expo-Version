import React, { useRef, useEffect } from "react";
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, TextInput, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search, MapPin, Star, Clock, TrendingUp,
  Map, ExternalLink, Building2, Trees, ShoppingBag, HeartPulse,
} from "lucide-react-native";
import { trendingTopics, nearbyPlaces, forYouFeed } from "@/lib/mockData";
import { flattenStyle } from "@/utils/flatten-style";

const NEARBY_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  "Shopping Mall": ShoppingBag, Restaurant: Building2, Park: Trees, Hospital: HeartPulse,
};

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

export default function DiscoverScreen() {
  return (
    <View style={s.root}>
      <SafeAreaView edges={["top"]} style={s.header}>
        <Text style={s.headerTitle}>Discover</Text>
        <View style={s.searchBar}>
          <Search size={15} color="#8E8E93" strokeWidth={1.8} />
          <TextInput
            style={s.searchInput}
            placeholder="Search places, topics…"
            placeholderTextColor="#8E8E93"
          />
        </View>
      </SafeAreaView>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Trending */}
        <FadeRow delay={0}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <TrendingUp size={15} color="#07C160" strokeWidth={2.2} />
              <Text style={s.sectionTitle}>Trending</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}><Text style={s.seeAll}>See All ›</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.trendingContent}>
            {trendingTopics.map((topic) => (
              <TouchableOpacity key={topic.id} activeOpacity={0.82}>
                <LinearGradient
                  colors={topic.gradient as [string, string]}
                  style={s.trendingCard}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <View style={s.trendingDeco} />
                  <TrendingUp size={18} color="rgba(255,255,255,0.6)" strokeWidth={1.8} />
                  <Text style={s.trendingTitle} numberOfLines={2}>{topic.title}</Text>
                  <View style={s.trendingTag}>
                    <Text style={s.trendingTagText}>Trending</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </FadeRow>

        {/* Nearby */}
        <FadeRow delay={100}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <MapPin size={15} color="#07C160" strokeWidth={2.2} />
              <Text style={s.sectionTitle}>Nearby</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}><Text style={s.seeAll}>See All ›</Text></TouchableOpacity>
          </View>

          {/* Map CTA */}
          <TouchableOpacity style={s.mapCard} activeOpacity={0.85}>
            <LinearGradient
              colors={["#00C853", "#007E33"]}
              style={s.mapGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={s.mapDeco} />
              <Map size={32} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
              <Text style={s.mapTitle}>Explore on Map</Text>
              <Text style={s.mapSub}>Find businesses around you</Text>
              <View style={s.mapBtn}>
                <ExternalLink size={12} color="#07C160" strokeWidth={2} />
                <Text style={s.mapBtnText}>Open Map</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.nearbyCard}>
            {nearbyPlaces.map((place, i) => {
              const Icon = NEARBY_ICONS[place.category] || Building2;
              return (
                <View key={place.id}>
                  <TouchableOpacity style={s.nearbyRow} activeOpacity={0.7}>
                    <View style={s.nearbyIcon}>
                      <Icon size={19} color="#07C160" strokeWidth={1.8} />
                    </View>
                    <View style={s.nearbyInfo}>
                      <Text style={s.nearbyName}>{place.name}</Text>
                      <Text style={s.nearbyCategory}>{place.category}</Text>
                    </View>
                    <View style={s.nearbyMeta}>
                      <View style={s.ratingRow}>
                        <Star size={11} color="#FF9500" fill="#FF9500" />
                        <Text style={s.ratingText}>{place.rating}</Text>
                      </View>
                      <View style={s.distRow}>
                        <MapPin size={10} color="#8E8E93" strokeWidth={1.8} />
                        <Text style={s.distText}>{place.distance}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  {i < nearbyPlaces.length - 1 && <View style={s.sep} />}
                </View>
              );
            })}
          </View>
        </FadeRow>

        {/* For You */}
        <FadeRow delay={200}>
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <Star size={15} color="#07C160" strokeWidth={2.2} />
              <Text style={s.sectionTitle}>For You</Text>
            </View>
          </View>

          {forYouFeed.map((item) => (
            <TouchableOpacity key={item.id} style={s.feedCard} activeOpacity={0.8}>
              <View style={flattenStyle([s.feedThumb, { backgroundColor: item.color + "20" }])}>
                <View style={flattenStyle([s.feedThumbIcon, { backgroundColor: item.color }])}>
                  <TrendingUp size={15} color="#FFF" strokeWidth={1.8} />
                </View>
              </View>
              <View style={s.feedContent}>
                <Text style={s.feedTitle} numberOfLines={2}>{item.title}</Text>
                <View style={s.feedMeta}>
                  <Text style={flattenStyle([s.feedSource, { color: item.color }])}>{item.source}</Text>
                  <View style={s.dot} />
                  <Clock size={10} color="#8E8E93" strokeWidth={1.8} />
                  <Text style={s.feedTime}>{item.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
    borderBottomWidth: 0.5, borderBottomColor: "#E5E5EA",
  },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#1C1C1E", marginTop: 8, marginBottom: 12, letterSpacing: -0.5 },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F2F2F7", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1C1C1E", padding: 0 },
  scroll: { flex: 1 },
  content: { paddingTop: 8 },

  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, marginTop: 16, marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1C1C1E", letterSpacing: -0.2 },
  seeAll: { color: "#07C160", fontSize: 14, fontWeight: "600" },

  trendingContent: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  trendingCard: {
    width: 156, borderRadius: 18, padding: 16,
    minHeight: 136, justifyContent: "space-between", overflow: "hidden",
  },
  trendingDeco: {
    position: "absolute", width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.1)", top: -25, right: -15,
  },
  trendingTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 8 },
  trendingTag: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start",
  },
  trendingTagText: { color: "rgba(255,255,255,0.9)", fontSize: 11, fontWeight: "600" },

  mapCard: { marginHorizontal: 16, borderRadius: 20, overflow: "hidden", marginBottom: 10 },
  mapGradient: {
    padding: 24, alignItems: "center",
    minHeight: 140, justifyContent: "center", gap: 6, overflow: "hidden",
  },
  mapDeco: {
    position: "absolute", width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)", top: -60, right: -40,
  },
  mapTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  mapSub: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  mapBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#FFFFFF", borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7, marginTop: 6,
  },
  mapBtnText: { color: "#07C160", fontSize: 13, fontWeight: "600" },

  nearbyCard: {
    backgroundColor: "#FFFFFF", marginHorizontal: 16,
    borderRadius: 20, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  nearbyRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  nearbyIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "#E8F8F0", alignItems: "center", justifyContent: "center",
  },
  nearbyInfo: { flex: 1 },
  nearbyName: { fontSize: 14, fontWeight: "600", color: "#1C1C1E" },
  nearbyCategory: { fontSize: 12, color: "#8E8E93", marginTop: 2 },
  nearbyMeta: { alignItems: "flex-end", gap: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  ratingText: { fontSize: 12, color: "#1C1C1E", fontWeight: "600" },
  distRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  distText: { fontSize: 11, color: "#8E8E93" },
  sep: { height: 0.5, backgroundColor: "#F2F2F7", marginLeft: 72 },

  feedCard: {
    backgroundColor: "#FFFFFF", marginHorizontal: 16, marginBottom: 8,
    borderRadius: 18, flexDirection: "row", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  feedThumb: { width: 88, alignItems: "center", justifyContent: "center" },
  feedThumbIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  feedContent: { flex: 1, padding: 14 },
  feedTitle: { fontSize: 14, fontWeight: "600", color: "#1C1C1E", lineHeight: 20 },
  feedMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  feedSource: { fontSize: 12, fontWeight: "600" },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#C7C7CC" },
  feedTime: { fontSize: 11, color: "#8E8E93" },
});
