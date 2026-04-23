import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Refrigerator, Grid2x2, ShoppingBag } from "lucide-react-native";

interface MachineCardProps {
  id: string;
  label: string;
  color: string;
  image: string; // Not used directly anymore, but kept for interface compatibility
  machineType: string;
  onPress: (type: string) => void;
}

const MACHINE_ICON_IMAGES: Record<string, any> = {
  vending: require("../assets/images/icons/vending-icon.png"),
  powerbank: require("../assets/images/icons/powerbank-icon.png"),
  locker: require("../assets/images/icons/locker-icon.png"),
};

export function MachineCard({ id, label, color, image, machineType, onPress }: MachineCardProps) {
  const isCustomIcon = !!MACHINE_ICON_IMAGES[machineType];
  const themeGreen = "#07C160"; // To match the Scan QR, Pay, etc.

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.8}
      onPress={() => onPress(machineType)}
    >
      <View style={s.iconWrap}>
        {isCustomIcon ? (
          <Image 
            source={MACHINE_ICON_IMAGES[machineType]} 
            style={[s.iconImage, { tintColor: themeGreen }]} 
            resizeMode="contain"
          />
        ) : (
          <Refrigerator size={24} color={themeGreen} strokeWidth={1.8} />
        )}
      </View>
      <Text style={s.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    width: "25%", // Match QuickItem width
    alignItems: "center",
    paddingVertical: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  iconImage: {
    width: 26,
    height: 26,
  },
  label: {
    fontSize: 11,
    color: "#3C3C43",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 14,
  },
});
