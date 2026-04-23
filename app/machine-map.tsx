// Machine Map Screen — Standalone module for Smart Machine Ecosystem
// Updated to use react-native-maps, dynamic bounding box zoom, and dedicated inventory page.

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Search, Phone, Navigation, QrCode, LockOpen } from "lucide-react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { machineLocations } from "@/lib/mockData";
import type { MachineLocation, MachineType } from "@/lib/mockData";
import { AnimatedMarker } from "@/components/AnimatedMarker";
import { MapView, Marker } from "@/components/MapModule";

const { height: SH } = Dimensions.get("window");

// Apple Maps-inspired clean, minimal map style (Silver tone)
const CLEAN_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

export default function MachineMapScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const machineType = (type as MachineType) || "omama";

  const mapRef = useRef<any>(null);

  const filteredMachines = machineLocations.filter((m) => m.type === machineType);
  const [selectedMachine, setSelectedMachine] = useState<MachineLocation | null>(null);
  
  // Panel state
  const [panelVisible, setPanelVisible] = useState(false);
  const panelTranslateY = useSharedValue(500);

  // Performance: Let bitmaps render for 3s, then stop tracking to boost touch speed
  const [markersReady, setMarkersReady] = useState(true);
  // Dynamic bounding box: fit all filtered markers on map load
  useEffect(() => {
    const timer = setTimeout(() => setMarkersReady(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (filteredMachines.length > 0 && mapRef.current && Platform.OS !== "web") {
      // Small delay to let the map initialize
      const fitTimer = setTimeout(() => {
        const coords = filteredMachines.map((m) => ({
          latitude: m.lat,
          longitude: m.lng,
        }));
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 120, right: 60, bottom: 380, left: 60 },
          animated: true,
        });
      }, 500);
      return () => clearTimeout(fitTimer);
    }
  }, [machineType]);

  const panelAnimStyle = useAnimatedStyle(() => {
    panelTranslateY.value = withSpring(panelVisible ? 0 : 500, {
      damping: 28,
      stiffness: 200,
      mass: 0.8,
    });
    return { transform: [{ translateY: panelTranslateY.value }] };
  });

  const handleMarkerPress = useCallback((machine: MachineLocation) => {
    setSelectedMachine(machine);
    setPanelVisible(true);
    // Pan map to marker — gentle offset so marker stays visible above the panel
    mapRef.current?.animateToRegion({
      latitude: machine.lat - 0.003,
      longitude: machine.lng,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    }, 600);
  }, []);

  const handleSetRoute = useCallback(() => {
    if (!selectedMachine) return;
    const { lat, lng } = selectedMachine;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url!).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  }, [selectedMachine]);

  const handleUnlockDoor = useCallback(() => {
    if (!selectedMachine) return;
    router.push({
      pathname: "/machine-inventory",
      params: {
        machineId: selectedMachine.id,
        machineBranch: selectedMachine.branch,
        machineAddress: selectedMachine.address,
        machineType: selectedMachine.type,
        machineStatus: selectedMachine.status,
      },
    });
  }, [selectedMachine, router]);

  return (
    <View style={s.root}>
      {/* ─── Map Area ─── */}
      {Platform.OS === "web" ? (
        <View style={[s.map, s.webFallback]}>
          <MaterialIcons name="map" size={48} color="#D1D1D6" />
          <Text style={s.webFallbackText}>Map view is not supported on Web.</Text>
          <Text style={s.webFallbackSub}>Please view on iOS or Android.</Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={s.map}
          initialRegion={{
            latitude: 23.7600,
            longitude: 90.3900,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          mapType="standard"
          customMapStyle={CLEAN_MAP_STYLE}
        >
          {filteredMachines.map((machine) => (
            <Marker
              key={machine.id}
              coordinate={{ latitude: machine.lat, longitude: machine.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={markersReady}
              flat={true}
              onPress={(e: any) => {
                e.stopPropagation();
                handleMarkerPress(machine);
              }}
            >
              <AnimatedMarker
                machine={machine}
              />
            </Marker>
          ))}
        </MapView>
      )}

      {/* ─── App Bar ─── */}
      <SafeAreaView edges={["top"]} style={s.appBar} pointerEvents="box-none">
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#1C1C1E" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={s.searchBtn} activeOpacity={0.7}>
          <Search size={20} color="#1C1C1E" strokeWidth={1.8} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Tap map to hide panel */}
      {panelVisible && (
        <TouchableOpacity
          style={s.mapTapOverlay}
          activeOpacity={1}
          onPress={() => setPanelVisible(false)}
        />
      )}

      {/* ─── Floating Details Panel ─── */}
      <Animated.View style={[s.detailsPanel, panelAnimStyle]}>
        {selectedMachine && (
          <View style={s.panelContent}>
            <View style={s.dragHandle} />
            
            <View style={s.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.panelBranch}>{selectedMachine.branch}</Text>
                <Text style={s.panelAddress}>{selectedMachine.address} — 300 m</Text>
              </View>
              <Image source={{ uri: selectedMachine.photo }} style={s.thumbImg} />
            </View>

            {/* Status */}
            <View style={s.statusRow}>
              <View style={[
                s.statusBadge,
                selectedMachine.status === "Maintenance" && { backgroundColor: "rgba(243,156,18,0.1)" },
              ]}>
                <View style={[s.dot, selectedMachine.status === "Maintenance" ? { backgroundColor: "#F39C12" } : {}]} />
                <Text style={[
                  s.statusText,
                  selectedMachine.status === "Maintenance" && { color: "#F39C12" },
                ]}>
                  {selectedMachine.status}
                </Text>
              </View>
              <Text style={s.availText}>Open 24/7</Text>
            </View>

            {/* Actions */}
            <View style={s.actionRow}>
              <TouchableOpacity style={s.routeBtn} activeOpacity={0.8} onPress={handleSetRoute}>
                <Navigation size={18} color="#1C1C1E" strokeWidth={2} />
                <Text style={s.routeBtnText}>Set a Route</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.unlockBtn} activeOpacity={0.8} onPress={handleUnlockDoor}>
                <LockOpen size={16} color="#FFFFFF" strokeWidth={2} />
                <Text style={s.unlockBtnText}>Unlock the Door</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Persistent Scan QR Code Button (Anchored Bottom) */}
      <View style={s.persistentBottom}>
        <SafeAreaView edges={["bottom"]} style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <TouchableOpacity 
            style={s.qrBtn} 
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: "/scanner", params: { expectedType: selectedMachine?.type || machineType } })}
          >
            <QrCode size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={s.qrBtnText}>SCAN QR CODE</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F7F9FB" },
  map: { ...StyleSheet.absoluteFillObject },
  
  appBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  searchBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },

  mapTapOverlay: {
    position: "absolute", top: 100, left: 0, right: 0, bottom: 350,
  },

  // Details Panel
  detailsPanel: {
    position: "absolute", left: 16, right: 16, bottom: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  panelContent: { paddingHorizontal: 24, paddingBottom: 24 },
  dragHandle: {
    width: 36, height: 5, borderRadius: 3,
    backgroundColor: "#E5E5EA", alignSelf: "center",
    marginTop: 12, marginBottom: 16,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  panelBranch: { fontSize: 24, fontWeight: "900", color: "#1C1C1E", letterSpacing: -0.5 },
  panelAddress: { fontSize: 14, color: "#8E8E93", fontWeight: "500", marginTop: 4 },
  thumbImg: { width: 50, height: 50, borderRadius: 16, backgroundColor: "#F2F2F7" },

  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 16, gap: 12 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(7,193,96,0.1)",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#07C160" },
  statusText: { fontSize: 13, fontWeight: "700", color: "#07C160" },
  availText: { fontSize: 13, color: "#8E8E93", fontWeight: "600" },

  actionRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  routeBtn: {
    flex: 1, height: 52, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 16, backgroundColor: "#F2F2F7",
  },
  routeBtnText: { fontWeight: "700", fontSize: 14, color: "#1C1C1E" },
  unlockBtn: {
    flex: 1, height: 52, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 16, backgroundColor: "#07C160",
  },
  unlockBtnText: { fontWeight: "700", fontSize: 14, color: "#FFFFFF" },

  persistentBottom: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "transparent",
  },
  qrBtn: {
    height: 60, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 20, backgroundColor: "#07C160",
    shadowColor: "#07C160", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  qrBtnText: { fontWeight: "900", fontSize: 16, color: "#FFFFFF", letterSpacing: 0.5 },

  webFallback: {
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  webFallbackText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
    marginTop: 12,
  },
  webFallbackSub: {
    fontSize: 14,
    color: "#C7C7CC",
    marginTop: 4,
  },
});
