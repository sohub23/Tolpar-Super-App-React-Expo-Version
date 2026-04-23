// Web fallback for react-native-maps to prevent Metro bundler crashes on the web platform.
import React from "react";
import { View } from "react-native";

export const MapView = React.forwardRef((props: any, ref) => {
  return <View ref={ref as any} {...props} />;
});

export const Marker = (props: any) => {
  return <View {...props} />;
};

export const UrlTile = (props: any) => {
  return null;
};
