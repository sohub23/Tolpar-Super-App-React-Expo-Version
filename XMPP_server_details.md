# Tolpar Chat — Production App (Kiro Prompt)

## Overview
Build a production-ready, enterprise-grade chat application for iOS and Android using React Native with Expo.
Feature parity with WeChat: messaging, group chat, audio/video calls, file sharing, stories, and more.
Backend is fully operational 

---

## Backend (Already Running — Do Not Touch)

| Item | Value |
|---|---|
| WebSocket (primary) | `wss://backend-cloud-1.tolpar.com.bd:5443/ws` |
| BOSH (fallback) | `https://backend-cloud-1.tolpar.com.bd:5443/bosh` |
| File Upload | `https://backend-cloud-1.tolpar.com.bd:5443/upload` |
| XMPP domain | `backend-cloud-1.tolpar.com.bd` |
| MUC domain | `conference.backend-cloud-1.tolpar.com.bd` |
| STUN/TURN | `45.61.51.201:3478` (UDP + TCP) |
| SSL | Valid certificate, wss:// works |

**Always connect via `wss://` on port 5443. Never use plain ws:// in production.**

---

## Platform & Tools

- **Framework**: React Native with Expo SDK (latest stable)
- **Language**: TypeScript (strict mode)
- **Build**: EAS Build for iOS + Android
- **Navigation**: React Navigation v6
- **State**: Zustand
- **Storage**: expo-secure-store (credentials), expo-sqlite (local message cache)
- **Styling**: consistent design system, dark/light mode support

---

## Project Setup

```bash
npx create-expo-app TolparChat --template blank-typescript
cd TolparChat
```

### All Dependencies

```bash
# XMPP
npm install @xmpp/client @xmpp/debug

# Navigation
npm install @react-navigation/native @react-navigation/stack \
  @react-navigation/bottom-tabs @react-navigation/drawer
npm install react-native-screens react-native-safe-area-context \
  react-native-gesture-handler react-native-reanimated

# UI
npm install react-native-paper react-native-vector-icons
npm install react-native-image-crop-picker
npm install react-native-fast-image
npm install @shopify/flash-list          # high-perf message list

# Media & Files
npm install expo-image-picker expo-document-picker
npm install expo-file-system expo-av
npm install expo-camera expo-media-library

# Audio/Video Calls (WebRTC)
npm install react-native-webrtc

# Push Notifications
npm install expo-notifications expo-device

# Storage
npm install expo-secure-store
npm install expo-sqlite

# State
npm install zustand immer

# Utilities
npm install expo-crypto                  # message ID generation
npm install expo-background-fetch expo-task-manager
npm install @react-native-community/netinfo   # network state
npm install react-native-mmkv            # fast key-value store
npm install date-fns                     # date formatting
```

---

## Project Structure

```
TolparChat/
├── app.json
├── App.tsx
├── eas.json
├── src/
│   ├── xmpp/
│   │   ├── client.ts          # Connection singleton + reconnect logic
│   │   ├── messaging.ts       # Send/receive 1:1 messages
│   │   ├── muc.ts             # Group chat (MUC)
│   │   ├── roster.ts          # Contacts / friend list
│   │   ├── presence.ts        # Online status
│   │   ├── mam.ts             # Message history (MAM XEP-0313)
│   │   ├── upload.ts          # File/image upload (XEP-0363)
│   │   ├── calls.ts           # Jingle signaling for calls
│   │   └── push.ts            # Push notification registration
│   ├── webrtc/
│   │   ├── peer.ts            # WebRTC PeerConnection manager
│   │   ├── stun.ts            # STUN/TURN credential fetcher
│   │   └── media.ts           # Audio/video stream handling
│   ├── screens/
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── Chats/
│   │   │   ├── ChatListScreen.tsx
│   │   │   └── ChatScreen.tsx
│   │   ├── Groups/
│   │   │   ├── GroupListScreen.tsx
│   │   │   ├── GroupChatScreen.tsx
│   │   │   └── CreateGroupScreen.tsx
│   │   ├── Calls/
│   │   │   ├── CallScreen.tsx         # Audio + video call UI
│   │   │   └── IncomingCallScreen.tsx
│   │   ├── Contacts/
│   │   │   ├── ContactsScreen.tsx
│   │   │   └── AddContactScreen.tsx
│   │   ├── Profile/
│   │   │   ├── MyProfileScreen.tsx
│   │   │   └── ContactProfileScreen.tsx
│   │   └── Status/
│   │       ├── StatusListScreen.tsx   # Stories/status updates
│   │       └── CreateStatusScreen.tsx
│   ├── components/
│   │   ├── MessageBubble.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── TypingIndicator.tsx
│   │   ├── OnlineIndicator.tsx
│   │   ├── Avatar.tsx
│   │   └── CallButton.tsx
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   ├── rosterStore.ts
│   │   ├── callStore.ts
│   │   └── uiStore.ts
│   ├── db/
│   │   └── schema.ts          # SQLite local message cache
│   ├── services/
│   │   ├── notifications.ts
│   │   └── background.ts      # Background message fetch
│   ├── hooks/
│   │   ├── useXMPP.ts
│   │   ├── useCall.ts
│   │   └── useMessages.ts
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   └── theme/
│       ├── colors.ts
│       └── typography.ts
```

---

## Feature Specifications

### 1. Authentication
- Login with username + password via XMPP SASL
- Register new account (POST to ejabberd API or in-band if enabled)
- Auto-reconnect on network change
- Session persistence via expo-secure-store
- Biometric lock (Face ID / fingerprint) on app open

### 2. One-to-One Chat
- Real-time messaging via WebSocket
- Message types: text, image, video, audio note, file, location
- Delivery states: sent (✓), delivered (✓✓), read (✓✓ blue)  — XEP-0184
- Typing indicator — XEP-0085
- Message reactions (emoji) — XEP-0444
- Reply to message (quote)
- Forward message
- Delete message (for me / for everyone)
- Message search
- Multi-device sync — XEP-0280 (carbons)
- Offline message delivery — XEP-0160

### 3. Group Chat (MUC)
- Create group with name, avatar, description
- Add/remove members
- Admin/member roles
- Group message history (MAM enabled on server)
- @mention with notification
- Mute group
- Leave / delete group
- Max 500 members (server configured)

### 4. Audio/Video Calls
- 1:1 audio call
- 1:1 video call
- Call signaling via Jingle (XEP-0166) over XMPP
- ICE/STUN/TURN via `45.61.51.201:3478` (server provides credentials via XEP-0215)
- In-call controls: mute, speaker, camera flip, hold
- Call history log
- Incoming call screen (even when app is backgrounded)
- Ringtone + vibration on incoming call

**Call flow to implement:**
```
Caller:
1. Fetch TURN credentials via IQ to mod_stun_disco
2. Create RTCPeerConnection with ICE servers
3. Get local media stream
4. Create offer SDP
5. Send Jingle session-initiate IQ to callee

Callee:
6. Show IncomingCallScreen
7. On accept: create RTCPeerConnection, set remote SDP
8. Create answer SDP
9. Send Jingle session-accept IQ

Both:
10. Exchange ICE candidates via Jingle transport-info IQs
11. WebRTC connects → media flows
```

### 5. File & Media Sharing
- Image picker + camera capture
- Video recording + sharing
- Audio note recording (hold-to-record)
- Document sharing (PDF, Office, etc.)
- Upload flow (XEP-0363):
  1. Request upload slot via IQ
  2. HTTP PUT file to returned URL
  3. Send GET URL as message body
- Progress indicator during upload
- Auto-download images, manual download for files
- Media gallery per chat

### 6. User Profiles & Contacts
- Avatar upload (stored via XEP-0363, referenced in vCard)
- Display name, bio, status message
- Online/away/offline presence
- Last seen timestamp
- Add contact by username/JID
- Contact search
- Block/unblock user — XEP-0191
- Privacy settings

### 7. Status / Stories
- Post photo/video/text status (24h expiry)
- View contacts' statuses
- Implemented via PubSub (XEP-0060) on server
- Story viewers list

### 8. Push Notifications
- Register Expo push token with ejabberd via XEP-0357
- Notifications for: new message, missed call, group mention
- Notification actions: reply inline, mark as read
- Background message fetch via expo-background-fetch

### 9. Local Message Cache (SQLite)
- Store all messages locally for offline viewing
- Schema: messages, chats, contacts, media
- Sync with MAM on reconnect (fetch since last message ID)
- Full-text search on local messages

### 10. Settings
- Notification preferences per chat
- Theme: light / dark / system
- Media auto-download settings
- Account: change password, delete account
- Privacy: last seen, profile photo, status visibility
- Storage: clear cache, media usage

---

## XMPP Client Core

```typescript
// src/xmpp/client.ts
import { client, xml } from '@xmpp/client';

const DOMAIN  = 'backend-cloud-1.tolpar.com.bd';
const WS_URL  = `wss://${DOMAIN}:5443/ws`;

let xmpp: ReturnType<typeof client> | null = null;

export function getClient() { return xmpp; }

export async function connect(username: string, password: string) {
  xmpp = client({
    service: WS_URL,
    domain: DOMAIN,
    username,
    password,
  });

  xmpp.on('online', () => {
    xmpp!.send(xml('presence'));          // announce online
    enableCarbons();                       // multi-device sync
    fetchRoster();                         // load contacts
  });

  xmpp.on('stanza', handleStanza);
  xmpp.on('error', handleError);
  xmpp.on('offline', handleOffline);

  await xmpp.start();
}

function enableCarbons() {
  xmpp!.send(xml('iq', { type: 'set', id: 'carbons' },
    xml('enable', { xmlns: 'urn:xmpp:carbons:2' })
  ));
}
```

---

## WebRTC Call Core

```typescript
// src/webrtc/peer.ts
import { RTCPeerConnection, RTCSessionDescription, mediaDevices } from 'react-native-webrtc';

export async function createPeerConnection(iceServers: RTCIceServer[]) {
  const pc = new RTCPeerConnection({ iceServers });
  const stream = await mediaDevices.getUserMedia({ audio: true, video: true });
  stream.getTracks().forEach(track => pc.addTrack(track, stream));
  return { pc, stream };
}
```

```typescript
// src/webrtc/stun.ts — fetch TURN credentials from ejabberd
export async function fetchIceServers(xmpp: any): Promise<RTCIceServer[]> {
  // Send XEP-0215 IQ to get STUN/TURN credentials
  // ejabberd mod_stun_disco responds with time-limited credentials
  return [
    { urls: 'stun:45.61.51.201:3478' },
    { urls: 'turn:45.61.51.201:3478', username: '...', credential: '...' },
  ];
}
```

---

## Navigation Structure

```
AppNavigator
├── AuthStack (unauthenticated)
│   ├── LoginScreen
│   └── RegisterScreen
└── MainTabs (authenticated)
    ├── ChatsTab
    │   ├── ChatListScreen
    │   └── ChatScreen
    ├── StatusTab
    │   ├── StatusListScreen
    │   └── CreateStatusScreen
    ├── CallsTab
    │   └── CallHistoryScreen
    └── ProfileTab
        └── MyProfileScreen
    (Modal screens — full screen overlays)
    ├── CallScreen
    ├── IncomingCallScreen
    ├── GroupChatScreen
    ├── CreateGroupScreen
    └── ContactProfileScreen
```

---

## EAS Build Configuration

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

```bash
# Build for both platforms
eas build --platform all --profile production
```

---

## app.json Key Config

```json
{
  "expo": {
    "name": "Tolpar Chat",
    "slug": "tolpar-chat",
    "version": "1.0.0",
    "plugins": [
      "react-native-webrtc",
      ["expo-notifications", { "icon": "./assets/notification-icon.png" }],
      ["expo-camera", { "cameraPermission": "Allow Tolpar to access your camera for video calls." }],
      ["expo-media-library", { "photosPermission": "Allow Tolpar to access your photos." }]
    ],
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Allow Tolpar to access your microphone for calls.",
        "NSCameraUsageDescription": "Allow Tolpar to access your camera for video calls."
      }
    },
    "android": {
      "permissions": ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
    }
  }
}
```

---

## Implementation Order

Build in this exact order — each phase is independently testable:

**Phase 1 — Connection & Auth** (foundation)
1. `src/xmpp/client.ts` — connect, reconnect, error handling
2. `LoginScreen` + `RegisterScreen`
3. Session persistence (auto-login on reopen)

**Phase 2 — Contacts & Presence**
4. `src/xmpp/roster.ts` — fetch/add/remove contacts
5. `ContactsScreen`, `AddContactScreen`
6. Online/offline presence indicators

**Phase 3 — 1:1 Messaging**
7. `src/xmpp/messaging.ts` — send/receive
8. `ChatListScreen`, `ChatScreen`
9. SQLite local cache
10. Delivery receipts + typing indicator

**Phase 4 — Media**
11. `src/xmpp/upload.ts` — file upload slot
12. Image/video/audio/file sending in chat
13. Media gallery view

**Phase 5 — Group Chat**
14. `src/xmpp/muc.ts`
15. `GroupChatScreen`, `CreateGroupScreen`
16. Group member management

**Phase 6 — Calls**
17. `src/webrtc/stun.ts` — fetch ICE servers
18. `src/webrtc/peer.ts` — PeerConnection
19. `src/xmpp/calls.ts` — Jingle signaling
20. `CallScreen`, `IncomingCallScreen`

**Phase 7 — Notifications & Background**
21. Push token registration
22. Background message fetch
23. Notification actions

**Phase 8 — Status & Polish**
24. Status/stories (PubSub)
25. Profile editing
26. Settings screen
27. Dark mode
28. Performance audit (FlashList, image caching)

---

## Production Checklist

- [ ] Auto-reconnect on network loss/change
- [ ] Exponential backoff on reconnect
- [ ] Message queue — don't drop messages sent while reconnecting
- [ ] SQLite migration strategy for app updates
- [ ] Image compression before upload
- [ ] Video thumbnail generation
- [ ] Audio note waveform visualization
- [ ] Unread message badge on app icon
- [ ] Background call handling (CallKit on iOS, ConnectionService on Android)
- [ ] End-to-end encryption (OMEMO — XEP-0384) — implement last
- [ ] Accessibility (screen reader, font scaling)
- [ ] RTL language support
- [ ] Crash reporting (Sentry)
- [ ] Analytics (opt-in only)
- [ ] App Store / Play Store assets ready

---

## Kiro Build Instructions

1. Read this entire file before writing any code
2. Check server is live: `curl -sk -o /dev/null -w "%{http_code}" https://backend-cloud-1.tolpar.com.bd:5443/ws` — must return `200`
3. Set up project and install all dependencies
4. Build Phase 1 first — do not proceed until login and connection work
5. After each phase, test on a real device or simulator before moving on
6. Use two simulators (alice + bob) to test messaging and calls
7. Never hardcode credentials — use expo-secure-store
8. All network calls must handle errors gracefully with user-facing feedback
9. Follow the file structure exactly — it maps to the feature set
10. Complete all phases before submitting
