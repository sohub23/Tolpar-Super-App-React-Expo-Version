import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { flattenStyle } from "@/utils/flatten-style";

interface MachineCardProps {
  id: string;
  label: string;
  color: string;
  image: string; // the image name or uri
  machineType: string;
  onPress: (type: string) => void;
}

const MACHINE_IMAGES: Record<string, any> = {
  omama: require("../assets/images/omama.png"),
  vending: require("../assets/images/vending.png"),
  powerbank: require("../assets/images/powerbank.png"),
  locker: require("../assets/images/locker.png"),
};

export function MachineCard({ id, label, color, image, machineType, onPress }: MachineCardProps) {
  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.8}
      onPress={() => onPress(machineType)}
    >
      <View style={s.iconWrap}>
        <Image
          source={MACHINE_IMAGES[image] || { uri: image }}
          style={s.image}
          contentFit="contain"
          transition={200}
        />
      </View>
      <Text style={s.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    width: "23%",
    alignItems: "center",
    paddingVertical: 10,
  },
  iconWrap: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  image: {
    width: 60,
    height: 60,
  },
  label: {
    fontSize: 12,
    color: "#1C1C1E",
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: -0.1,
  },
});
