// WebRTC stub — react-native-webrtc requires a custom dev/production build.
// In Expo Go this module provides no-op stubs so the app doesn't crash.
// Full WebRTC is wired in when built with: npx expo run:android / npx expo run:ios

export interface RTCIceCandidateType {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export type IceCandidateHandler = (candidate: RTCIceCandidateType) => void;
export type TrackHandler = (stream: unknown) => void;

class WebRTCManager {
  readonly isAvailable = false;

  setOnIceCandidate(_handler: IceCandidateHandler) {}
  setOnRemoteTrack(_handler: TrackHandler) {}

  async initCall(_audioOnly = true): Promise<string> {
    throw new Error("WebRTC requires a custom dev build.");
  }

  async handleOffer(_sdp: string): Promise<string> {
    throw new Error("WebRTC requires a custom dev build.");
  }

  async handleAnswer(_sdp: string): Promise<void> {}

  async addIceCandidate(_candidate: RTCIceCandidateType): Promise<void> {}

  setMuted(_muted: boolean): void {}

  endCall(): void {}
}

export const webrtcManager = new WebRTCManager();
export type WebRTCManagerType = WebRTCManager;
