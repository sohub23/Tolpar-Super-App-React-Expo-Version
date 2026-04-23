import React, { memo } from "react";
import { View, Image, StyleSheet } from "react-native";
import type { MachineLocation } from "@/lib/mockData";

interface AnimatedMarkerProps {
  machine: MachineLocation;
  isSelected?: boolean;
  onPress?: () => void;
}

const MACHINE_IMAGES: Record<string, any> = {
  omama: require("../assets/images/omama.png"),
  vending: require("../assets/images/vending.png"),
  powerbank: require("../assets/images/powerbank.png"),
  locker: require("../assets/images/locker.png"),
};

/**
 * AnimatedMarker — Premium map pin for Smart Machines.
 *
 * ANDROID FIX: The outermost View MUST be a plain rectangle (NO borderRadius).
 * Android's react-native-maps bitmap renderer miscalculates the bounding box
 * when the root View has borderRadius, causing clipping.
 *
 * Solution: Transparent rectangular outer shell → Round inner circle.
 * The bitmap renderer measures the rectangle correctly. The circle is visual only.
 */
export const AnimatedMarker = memo(
  function AnimatedMarker({ machine }: AnimatedMarkerProps) {
    return (
      <View style={s.outerShell}>
        <View style={s.circle}>
          <Image
            source={MACHINE_IMAGES[machine.type]}
            style={s.icon}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  },
  (prev, next) => prev.machine.id === next.machine.id
);

const s = StyleSheet.create({
  // CRITICAL: This outermost View must have NO borderRadius.
  // It must be a plain transparent rectangle so Android measures it correctly.
  outerShell: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  // The visual circle sits inside the rectangular shell.
  circle: {
    width: 35,
    height: 35,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#07C160",
    overflow: "hidden",
  },
  icon: {
    width: 25,
    height: 25,
  },
});
