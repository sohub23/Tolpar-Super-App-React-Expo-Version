// Zustand store for Tolpar global state
import { create } from "zustand";
import { mockConversations, mockMessages } from "./mockData";
import { supabase, uploadAvatar, updateProfile as updateSupabaseProfile } from "./supabase";
import { xmppService, XMPP_CONFIG } from "./xmpp";
import type { XMPPStatus } from "./xmpp";
import { webrtcManager } from "./webrtc";
import { Alert } from "react-native";

export interface Message {
  id: string;
  text: string;
  sent: boolean;
  time: string;
}

export interface Conversation {
  id: string;
  name: string;
  initials: string;
  color: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

export interface Contact {
  jid: string;
  name: string;
  subscription: string;
  online: boolean;
}

export type CallStatus = "idle" | "outgoing" | "incoming" | "active";

export interface CallState {
  callStatus: CallStatus;
  callPeer: string | null;   // JID of the other party
  callSid: string | null;    // Jingle session ID
  callMuted: boolean;
  startCall: (peerJID: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
}

export interface GreetingState {
  userTimezone: string;
  setUserTimezone: (timezone: string) => void;
  currentGreeting: any | null;
  setCurrentGreeting: (greeting: any) => void;
}

interface AuthState {
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
    initials: string;
    jid: string;
    avatarUrl: string;
  };
  isLoggedIn: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    fullName?: string,
    avatarUrl?: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateProfile: (
    fullName: string,
    avatarUrl?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setAuthUser: (user: any) => Promise<void>;
}

interface XMPPState {
  connectionStatus: XMPPStatus;
  setConnectionStatus: (status: XMPPStatus) => void;
}

interface ContactsState {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  updatePresence: (jid: string, online: boolean) => void;
}

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, text: string) => void;
  sendXMPPMessage: (toJID: string, text: string) => Promise<void>;
  addIncomingMessage: (fromJID: string, message: Message) => void;
  markAsRead: (conversationId: string) => void;
  startConversation: (jid: string) => Promise<string>;
}

interface AppState
  extends AuthState,
    XMPPState,
    ContactsState,
    ChatState,
    CallState,
    GreetingState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  isPreviewMode: boolean;
  setPreviewMode: (val: boolean) => void;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function createConversationFromJID(jid: string, msg?: Message): Conversation {
  const username = jid.split("@")[0];
  const initials = username.slice(0, 2).toUpperCase();
  const COLORS = ["#07C160", "#E74C3C", "#4A90D9", "#9B59B6", "#F39C12", "#1ABC9C"];
  const color = COLORS[username.charCodeAt(0) % COLORS.length];
  return {
    id: jid,
    name: username,
    initials,
    color,
    lastMessage: msg?.text ?? "",
    timestamp: "Just now",
    unread: msg ? 1 : 0,
    online: false,
  };
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return value.slice(0, 2).toUpperCase();
}

function getXmppDomain(serverOrDomain: string) {
  try {
    if (serverOrDomain.includes("://")) {
      return new URL(serverOrDomain).hostname;
    }
    return serverOrDomain;
  } catch {
    return serverOrDomain;
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  // ─── Auth ─────────────────────────────────────────────────────────────────────
  user: {
    id: "user_001",
    email: "",
    name: "Tolpar User",
    username: "@tolpar_user",
    initials: "TL",
    jid: "",
    avatarUrl: "",
  },
  isLoggedIn: false,

  login: async (email: string, password: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !password) {
        return { success: false, error: "Email and password are required." };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const user = data.user;
      if (!user || !user.id) {
        return { success: false, error: "Unable to authenticate user." };
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, xmpp_username, xmpp_password, xmpp_server")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.message !== "No rows found") {
        console.warn("[Store] Profile fetch error:", profileError);
      }

      const emailLocalPart = normalizedEmail.split("@")[0];
      const displayName = profile?.full_name ?? emailLocalPart;
      const xmppUsername = profile?.xmpp_username ?? emailLocalPart;
      const xmppPassword = profile?.xmpp_password ?? password;
      const xmppServer = profile?.xmpp_server;
      const jidDomain = xmppServer ? getXmppDomain(xmppServer) : XMPP_CONFIG.domain;
      const jid = `${xmppUsername}@${jidDomain}`;
      const initials = getInitials(displayName);

      set({
        isLoggedIn: true,
        user: {
          id: user.id,
          email: normalizedEmail,
          name: displayName,
          username: `@${emailLocalPart}`,
          initials,
          jid,
          avatarUrl: profile?.avatar_url ?? "",
        },
        connectionStatus: "connecting",
        conversations: [],
        messages: {},
      });

      xmppService.onStatusChange((status) => {
        set({ connectionStatus: status });
      });

      xmppService.onPresence((presJid, type) => {
        get().updatePresence(presJid, type === "available" || type === "");
      });

      xmppService.onMessage((from, body, id, timestamp) => {
        const incomingMsg: Message = {
          id,
          text: body,
          sent: false,
          time: timestamp,
        };
        get().addIncomingMessage(from, incomingMsg);
      });

      xmppService.onJingle((event) => {
        const state = get();
        if (event.action === "session-initiate") {
          (state as AppState & { _pendingOfferSdp?: string })._pendingOfferSdp = event.sdp ?? "";
          set({ callStatus: "incoming", callPeer: event.from, callSid: event.sid });
        } else if (event.action === "session-accept") {
          if (event.sdp) {
            webrtcManager.handleAnswer(event.sdp).catch(() => {});
          }
          set({ callStatus: "active" });
        } else if (event.action === "session-terminate") {
          webrtcManager.endCall();
          set({ callStatus: "idle", callPeer: null, callSid: null, callMuted: false });
        } else if (event.action === "transport-info") {
          if (event.candidate) {
            webrtcManager.addIceCandidate(event.candidate).catch(() => {});
          }
        }
      });

      xmppService.enableAutoAcceptSubscriptions();
      (async () => {
        try {
          const connected = await xmppService.connect(xmppUsername, xmppPassword, xmppServer);
          if (!connected) {
            set({ connectionStatus: "disconnected" });
            return;
          }

          const rosterItems = await xmppService.fetchRoster();
          const contacts: Contact[] = rosterItems.map((item) => ({
            jid: item.jid,
            name: item.name,
            subscription: item.subscription,
            online: false,
          }));
          set({ contacts });
        } catch (xmppError) {
          console.warn("[Store] XMPP background connection failed:", xmppError);
          set({ connectionStatus: "disconnected" });
        }
      })();

      return { success: true };
    } catch (e) {
      console.warn("[Store] Login error:", e);
      return { success: false, error: "Invalid credentials or server unreachable." };
    }
  },

  signup: async (email: string, password: string, fullName?: string, avatarUrl?: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const defaultName = fullName?.trim() || normalizedEmail.split('@')[0] || 'User';
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: defaultName,
            avatar_url: avatarUrl?.trim() || null,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const userId = data.user?.id;
      if (userId) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: userId,
          full_name: defaultName,
          avatar_url: avatarUrl?.trim() || null,
        });
        if (profileError) {
          console.warn("[Store] Profile creation warning:", profileError);
        }
      }

      const message = data.session
        ? "Account created successfully. You can sign in now."
        : "Account created. Check your email to confirm your account.";
      return { success: true, message };
    } catch (e) {
      console.warn("[Store] Signup error:", e);
      return { success: false, error: "Unable to create account at this time." };
    }
  },

  resetPassword: async (email: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, message: "If that email exists, a reset link was sent." };
    } catch (e) {
      console.warn("[Store] Reset password error:", e);
      return { success: false, error: "Unable to send reset email." };
    }
  },

  updateProfile: async (fullName: string, avatarUrl?: string) => {
    const state = get();
    console.log('[Store] Update profile called with:', { fullName, avatarUrl, isLoggedIn: state.isLoggedIn, userId: state.user.id });
    if (!state.isLoggedIn || !state.user.id) {
      return { success: false, error: "Not logged in." };
    }

    try {
      const updates: Record<string, unknown> = {
        full_name: fullName.trim(),
      };

      if (avatarUrl) {
        updates.avatar_url = avatarUrl;
      }

      console.log('[Store] Calling updateSupabaseProfile with:', state.user.id, updates);
      const success = await updateSupabaseProfile(state.user.id, updates);
      console.log('[Store] updateSupabaseProfile result:', success);
      if (!success) {
        return { success: false, error: "Failed to update profile." };
      }

      const initials = getInitials(fullName);
      set((s) => ({
        user: {
          ...s.user,
          name: fullName.trim(),
          initials,
          avatarUrl: avatarUrl ?? s.user.avatarUrl,
        },
      }));

      return { success: true };
    } catch (e) {
      console.warn("[Store] Update profile error:", e);
      return { success: false, error: "Unable to update profile." };
    }
  },

  logout: async () => {
    try {
      await xmppService.disconnect();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("[Store] Logout error:", e);
    }
    set({
      isLoggedIn: false,
      user: {
        id: "user_001",
        email: "",
        name: "Tolpar User",
        username: "@tolpar_user",
        initials: "TL",
        jid: "",
        avatarUrl: "",
      },
      connectionStatus: "disconnected",
      contacts: [],
      conversations: mockConversations, // restore mock data on logout
      messages: mockMessages,
    });
  },

  setAuthUser: async (oauthUser: any) => {
    try {
      // Get current Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error('No active Supabase session found');
      }

      const user = session.user;
      
      // Fetch or create profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, xmpp_username, xmpp_password, xmpp_server")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.message !== "No rows found") {
        console.warn("[Store] Profile fetch error:", profileError);
      }

      // Use OAuth data for user info
      const email = user.email || oauthUser.email || '';
      const displayName = profile?.full_name || oauthUser.name || oauthUser.givenName || email.split('@')[0];
      const emailLocalPart = email.split('@')[0];
      const xmppUsername = profile?.xmpp_username || emailLocalPart;
      const xmppPassword = profile?.xmpp_password || 'default_password'; // OAuth users need XMPP password
      const xmppServer = profile?.xmpp_server;
      const jidDomain = xmppServer ? getXmppDomain(xmppServer) : XMPP_CONFIG.domain;
      const jid = `${xmppUsername}@${jidDomain}`;
      const initials = getInitials(displayName);

      set({
        isLoggedIn: true,
        user: {
          id: user.id,
          email,
          name: displayName,
          username: `@${emailLocalPart}`,
          initials,
          jid,
          avatarUrl: profile?.avatar_url || oauthUser.photo || oauthUser.picture || '',
        },
        connectionStatus: "connecting",
        conversations: [],
        messages: {},
      });

      // Set up XMPP connection (same as login method)
      xmppService.onStatusChange((status) => {
        set({ connectionStatus: status });
      });

      xmppService.onPresence((presJid, type) => {
        get().updatePresence(presJid, type === "available" || type === "");
      });

      xmppService.onMessage((from, body, id, timestamp) => {
        const incomingMsg: Message = {
          id,
          text: body,
          sent: false,
          time: timestamp,
        };
        get().addIncomingMessage(from, incomingMsg);
      });

      xmppService.onJingle((event) => {
        const state = get();
        if (event.action === "session-initiate") {
          (state as AppState & { _pendingOfferSdp?: string })._pendingOfferSdp = event.sdp ?? "";
          set({ callStatus: "incoming", callPeer: event.from, callSid: event.sid });
        } else if (event.action === "session-accept") {
          if (event.sdp) {
            webrtcManager.handleAnswer(event.sdp).catch(() => {});
          }
          set({ callStatus: "active" });
        } else if (event.action === "session-terminate") {
          webrtcManager.endCall();
          set({ callStatus: "idle", callPeer: null, callSid: null, callMuted: false });
        } else if (event.action === "transport-info") {
          if (event.candidate) {
            webrtcManager.addIceCandidate(event.candidate).catch(() => {});
          }
        }
      });

      xmppService.enableAutoAcceptSubscriptions();
      (async () => {
        try {
          const connected = await xmppService.connect(xmppUsername, xmppPassword, xmppServer);
          if (!connected) {
            set({ connectionStatus: "disconnected" });
            return;
          }

          const rosterItems = await xmppService.fetchRoster();
          const contacts: Contact[] = rosterItems.map((item) => ({
            jid: item.jid,
            name: item.name,
            subscription: item.subscription,
            online: false,
          }));
          set({ contacts });
        } catch (xmppError) {
          console.warn("[Store] XMPP background connection failed:", xmppError);
          set({ connectionStatus: "disconnected" });
        }
      })();

    } catch (error) {
      console.error('[Store] setAuthUser error:', error);
      throw error;
    }
  },

  // ─── XMPP ─────────────────────────────────────────────────────────────────────
  connectionStatus: "disconnected",
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  // ─── Contacts ─────────────────────────────────────────────────────────────────
  contacts: [],
  setContacts: (contacts) => set({ contacts }),
  updatePresence: (jid, online) => {
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.jid === jid ? { ...c, online } : c
      ),
      conversations: state.conversations.map((conv) =>
        conv.id === jid ? { ...conv, online } : conv
      ),
    }));
  },

  // ─── Chat ─────────────────────────────────────────────────────────────────────
  conversations: mockConversations, // initial/preview state has mock data
  messages: mockMessages,

  sendMessage: (conversationId, text) => {
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      text,
      sent: true,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    set((state) => {
      const existing =
        state.messages[conversationId] ||
        state.messages["default"] ||
        [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, newMsg],
        },
        conversations: state.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: text, timestamp: "Just now" }
            : c
        ),
      };
    });
  },

  sendXMPPMessage: async (toJID: string, text: string) => {
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      text,
      sent: true,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Optimistically update store
    set((state) => {
      const existing = state.messages[toJID] || [];
      const existingConv = state.conversations.find((c) => c.id === toJID);
      const updatedConversations = existingConv
        ? state.conversations.map((c) =>
            c.id === toJID
              ? { ...c, lastMessage: text, timestamp: "Just now" }
              : c
          )
        : [createConversationFromJID(toJID), ...state.conversations];

      return {
        messages: {
          ...state.messages,
          [toJID]: [...existing, newMsg],
        },
        conversations: updatedConversations,
      };
    });

    // Send via XMPP
    try {
      await xmppService.sendMessage(toJID, text);
    } catch (e) {
      console.warn("[Store] XMPP sendMessage error:", e);
      // Message is already in local store for optimistic UX
    }
  },

  addIncomingMessage: (fromJID: string, message: Message) => {
    set((state) => {
      const existing = state.conversations.find((c) => c.id === fromJID);
      const newConversations = existing
        ? state.conversations.map((c) =>
            c.id === fromJID
              ? { ...c, lastMessage: message.text, timestamp: "Just now", unread: c.unread + 1 }
              : c
          )
        : [createConversationFromJID(fromJID, message), ...state.conversations];

      return {
        conversations: newConversations,
        messages: {
          ...state.messages,
          [fromJID]: [...(state.messages[fromJID] || []), message],
        },
      };
    });
  },

  markAsRead: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread: 0 } : c
      ),
    }));
  },

  startConversation: async (jid: string) => {
    // Send subscription request so they appear in each other's roster
    await xmppService.subscribe(jid);

    // Create conversation in store if not already present
    set((state) => {
      const existing = state.conversations.find((c) => c.id === jid);
      if (existing) return state;
      return {
        conversations: [createConversationFromJID(jid), ...state.conversations],
      };
    });

    return jid;
  },

  // ─── Call ─────────────────────────────────────────────────────────────────────
  callStatus: "idle" as CallStatus,
  callPeer: null,
  callSid: null,
  callMuted: false,

  startCall: async (peerJID: string) => {
    if (!webrtcManager.isAvailable) {
      Alert.alert("Audio Calls", "Audio calls require a custom dev build and are not supported in Expo Go.");
      return;
    }
    const sid = `call_${Date.now()}`;
    set({ callStatus: "outgoing", callPeer: peerJID, callSid: sid, callMuted: false });
    try {
      webrtcManager.setOnIceCandidate((candidate) => {
        xmppService.sendJingleCandidate(peerJID, sid, candidate).catch(() => {});
      });
      const sdp = await webrtcManager.initCall(true);
      await xmppService.sendJingleInitiate(peerJID, sid, sdp);
    } catch (e) {
      console.warn("[Call] startCall error:", e);
      webrtcManager.endCall();
      set({ callStatus: "idle", callPeer: null, callSid: null });
    }
  },

  acceptCall: async () => {
    const { callPeer, callSid } = get();
    if (!callPeer || !callSid) return;
    try {
      webrtcManager.setOnIceCandidate((candidate) => {
        xmppService.sendJingleCandidate(callPeer, callSid, candidate).catch(() => {});
      });
      const pendingSdp = (get() as AppState & { _pendingOfferSdp?: string })._pendingOfferSdp ?? "";
      const answerSdp = await webrtcManager.handleOffer(pendingSdp);
      await xmppService.sendJingleAccept(callPeer, callSid, answerSdp);
      set({ callStatus: "active" });
    } catch (e) {
      console.warn("[Call] acceptCall error:", e);
      webrtcManager.endCall();
      set({ callStatus: "idle", callPeer: null, callSid: null });
    }
  },

  rejectCall: () => {
    const { callPeer, callSid } = get();
    if (callPeer && callSid) xmppService.sendJingleTerminate(callPeer, callSid).catch(() => {});
    webrtcManager.endCall();
    set({ callStatus: "idle", callPeer: null, callSid: null });
  },

  endCall: () => {
    const { callPeer, callSid } = get();
    if (callPeer && callSid) xmppService.sendJingleTerminate(callPeer, callSid).catch(() => {});
    webrtcManager.endCall();
    set({ callStatus: "idle", callPeer: null, callSid: null, callMuted: false });
  },

  toggleMute: () => {
    const muted = !get().callMuted;
    webrtcManager.setMuted(muted);
    set({ callMuted: muted });
  },

  // ─── Greetings ────────────────────────────────────────────────────────────────
  userTimezone: 'Asia/Dhaka',
  setUserTimezone: (timezone: string) => set({ userTimezone: timezone }),
  currentGreeting: null,
  setCurrentGreeting: (greeting: any) => set({ currentGreeting: greeting }),

  // ─── UI ───────────────────────────────────────────────────────────────────────
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  isPreviewMode: false,
  setPreviewMode: (val: boolean) => {
    set({ isPreviewMode: val, isLoggedIn: val });
  },
}));