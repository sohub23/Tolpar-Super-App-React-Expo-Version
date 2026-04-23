import React, { forwardRef, useMemo } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { ShoppingBag, SlidersHorizontal } from "lucide-react-native";

interface Product {
  name: string;
  price: string;
  image: any; 
}

interface InventorySheetProps {
  products: Product[];
  onClose: () => void;
}

const PASTEL_COLORS = [
  "#FCE6BA", // Peach/Orange
  "#E1F8D1", // Green
  "#D9E2F1", // Light Blue
  "#FCE9E1", // Pinkish
  "#FFF1D0", // Yellow
  "#E0F5F7", // Cyan
];

export const InventorySheet = forwardRef<BottomSheet, InventorySheetProps>(
  ({ products, onClose }, ref) => {
    // Large snap points for the expanded shopping experience
    const snapPoints = useMemo(() => ["60%", "90%"], []);

    const renderBackdrop = (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} onPress={onClose} opacity={0.4} />
    );

    // Split products into two columns for masonry layout
    const leftColumn = products.filter((_, i) => i % 2 === 0);
    const rightColumn = products.filter((_, i) => i % 2 !== 0);

    const renderCard = (item: Product, index: number, isRight: boolean) => {
      // Pick color based on absolute index to maintain consistency
      const absoluteIndex = isRight ? index * 2 + 1 : index * 2;
      const bgColor = PASTEL_COLORS[absoluteIndex % PASTEL_COLORS.length];

      // Split name for better typography (e.g., "Mojo Cola" -> "Mojo\nCola")
      const nameParts = item.name.split(" ");
      const firstWord = nameParts[0];
      const restWords = nameParts.slice(1).join(" ");

      return (
        <View key={item.name} style={[s.card, { backgroundColor: bgColor }]}>
          {/* Top Text */}
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>
              {firstWord}
              {restWords ? `\n${restWords}` : ""}
            </Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>Snack</Text>
            </View>
          </View>

          {/* Large Background Image */}
          <Image
            source={item.image}
            style={s.cardImage}
            resizeMode="contain"
          />

          {/* Bottom Pill */}
          <View style={s.bottomPill}>
            <Text style={s.price}>{item.price}</Text>
          </View>
        </View>
      );
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        onClose={onClose}
        handleIndicatorStyle={s.handle}
        backgroundStyle={s.bg}
      >
        <View style={s.header}>
          <View>
            <Text style={s.titleHighlight}>Smart Machine</Text>
            <Text style={s.title}>Collections</Text>
          </View>
          
          <View style={s.headerRight}>
            <View style={s.itemsCount}>
              <Text style={s.itemsCountText}>{products.length} items</Text>
            </View>
            <TouchableOpacity style={s.filterBtn}>
              <SlidersHorizontal size={18} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* BottomSheetScrollView allows blazing fast scrolling for manual masonry columns */}
        <BottomSheetScrollView 
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={s.masonryContainer}>
            {/* Left Column */}
            <View style={s.column}>
              {leftColumn.map((item, i) => renderCard(item, i, false))}
            </View>
            
            {/* Right Column - Staggered by moving it down */}
            <View style={[s.column, s.rightColumnStagger]}>
              {rightColumn.map((item, i) => renderCard(item, i, true))}
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const s = StyleSheet.create({
  bg: { backgroundColor: "#FAFAFA", borderRadius: 40 },
  handle: { width: 40, height: 5, backgroundColor: "#E5E5EA", marginTop: 12 },
  
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "flex-end",
    paddingHorizontal: 24, 
    paddingVertical: 20,
    paddingBottom: 24,
  },
  titleHighlight: { fontSize: 24, fontWeight: "500", color: "#1C1C1E", letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: "800", color: "#1C1C1E", letterSpacing: -0.5, marginTop: 2 },
  
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemsCount: {
    backgroundColor: "#F2F2F7",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  itemsCountText: { fontSize: 13, fontWeight: "600", color: "#1C1C1E" },
  filterBtn: {
    backgroundColor: "#FFFFFF",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
  
  masonryContainer: {
    flexDirection: "row",
    gap: 16,
  },
  column: {
    flex: 1,
    gap: 16,
  },
  rightColumnStagger: {
    marginTop: 40, // This creates the staggered masonry effect!
  },

  // Card Design matching reference
  card: {
    height: 240, // Tall card for modern look
    borderRadius: 32,
    padding: 20,
    overflow: "hidden",
    position: "relative",
  },
  cardHeader: {
    zIndex: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1C1C1E",
    letterSpacing: -0.5,
    lineHeight: 22,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.7)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8E8E93",
  },
  
  // Large dynamic image
  cardImage: {
    position: "absolute",
    bottom: -30,
    right: -30,
    width: "125%",
    height: "95%",
    transform: [{ rotate: "-15deg" }], // Dynamic tilt like reference
    zIndex: 1,
  },

  // Bottom Floating Pill
  bottomPill: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.85)", // Frosted glass effect
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1C1C1E",
  },
});

