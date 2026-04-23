import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScannerScreen() {
  const router = useRouter();
  const { expectedType } = useLocalSearchParams<{ expectedType: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const laserY = useSharedValue(0);

  useEffect(() => {
    laserY.value = withRepeat(
      withSequence(
        withTiming(250, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserY.value }],
  }));

  if (!permission) return <View style={s.container} />;

  if (!permission.granted) {
    return (
      <View style={s.center}>
        <Text style={s.permText}>We need your permission to show the camera.</Text>
        <TouchableOpacity style={s.btn} onPress={requestPermission}>
          <Text style={s.btnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.backBtnStandalone} onPress={() => router.back()}>
          <Text style={s.backBtnStandaloneText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getMachineName = (type: string) => {
    switch (type) {
      case 'omama': return 'O-MAMA Fridge';
      case 'vending': return 'Snacks Vending';
      case 'powerbank': return 'Powerbank Station';
      case 'locker': return 'Smart Locker';
      default: return 'Machine';
    }
  };

  const expectedName = getMachineName(expectedType || 'omama');

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    if (scanned) return;
    setScanned(true);

    // Dynamic Context-Aware Validation Logic
    const scannedData = data.toLowerCase();
    
    // For demo/testing: We will accept ANY QR code so you can easily test the UI flow.
    const isMatch = true;

    if (isMatch) {
      Alert.alert(
        "✅ Access Granted",
        `Successfully connected to ${expectedName}.`,
        [{ text: "Continue", onPress: () => router.back() }]
      );
    } else {
      Alert.alert(
        "❌ Invalid Machine!",
        `You scanned a different QR code.\n\nYou selected: ${expectedName}\nBut the QR code is for something else.\n\nPlease scan the correct machine.`,
        [{ text: "Try Again", onPress: () => setScanned(false) }]
      );
    }
  };

  return (
    <View style={s.container}>
      {Platform.OS === 'web' ? (
        <View style={s.center}>
          <Text style={s.permText}>Camera is not supported on Web Browser.</Text>
          <TouchableOpacity style={s.btn} onPress={() => router.back()}>
            <Text style={s.btnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <SafeAreaView style={s.overlay} edges={['top', 'bottom']}>
            
            {/* Header */}
            <View style={s.header}>
              <TouchableOpacity style={s.backIconWrap} onPress={() => router.back()}>
                <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={s.title}>Scan {expectedName}</Text>
              <View style={{ width: 44 }} />
            </View>

            {/* Scanner Cutout Area */}
            <View style={s.cutoutContainer}>
              <View style={s.cutout}>
                <Animated.View style={[s.laser, laserStyle]} />
                
                {/* 4 Corner brackets for premium UI */}
                <View style={[s.corner, s.tl]} />
                <View style={[s.corner, s.tr]} />
                <View style={[s.corner, s.bl]} />
                <View style={[s.corner, s.br]} />
              </View>
              <Text style={s.instruction}>
                Align the QR code within the frame to unlock.
              </Text>
            </View>

          </SafeAreaView>
        </CameraView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F7F9FB' },
  permText: { fontSize: 16, color: '#1C1C1E', textAlign: 'center', marginBottom: 24, fontWeight: '500' },
  btn: { backgroundColor: '#07C160', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  backBtnStandalone: { marginTop: 16, padding: 10 },
  backBtnStandaloneText: { color: '#8E8E93', fontWeight: '600', fontSize: 16 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingTop: 10,
    backgroundColor: 'transparent'
  },
  backIconWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)' },
  title: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  cutoutContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cutout: {
    width: 260, height: 260,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    position: 'relative'
  },
  laser: {
    width: '100%', height: 3,
    backgroundColor: '#07C160',
    shadowColor: '#07C160', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5
  },
  instruction: { color: '#FFF', fontSize: 14, fontWeight: '500', marginTop: 32, opacity: 0.8 },

  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#07C160', borderWidth: 4 },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 16 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 16 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 16 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 16 },
});
