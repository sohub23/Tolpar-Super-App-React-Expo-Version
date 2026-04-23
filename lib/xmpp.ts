// XMPP Service for Tolpar — Production-grade singleton
// Connects to backend-cloud-1.tolpar.com.bd via WebSocket
// Uses @xmpp/client v0.13 (stable, React Native compatible)

export type XMPPStatus = "disconnected" | "connecting" | "connected" | "error";

export interface RosterItem {
  jid: string;
  name: string;
  subscription: string;
}

export const XMPP_CONFIG = {
  service: "wss://backend-cloud-1.tolpar.com.bd:5443/ws",
  servicePlain: "ws://backend-cloud-1.tolpar.com.bd:5280/ws",
  bosh: "https://backend-cloud-1.tolpar.com.bd:5443/bosh",
  fileUpload: "https://backend-cloud-1.tolpar.com.bd:5443/upload",
  domain: "backend-cloud-1.tolpar.com.bd",
  mucDomain: "conference.backend-cloud-1.tolpar.com.bd",
  stun: "45.61.51.201:3478",
};

type MessageHandler = (
  from: string,
  body: string,
  id: string,
  timestamp: string
) => void;
type PresenceHandler = (jid: string, type: string) => void;
type StatusHandler = (status: XMPPStatus) => void;
type SubscriptionHandler = (from: string) => void;

export type JingleAction =
  | "session-initiate"
  | "session-accept"
  | "session-terminate"
  | "transport-info";

export interface JingleEvent {
  action: JingleAction;
  from: string;
  sid: string;
  sdp?: string;
  candidate?: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null };
}

type JingleHandler = (event: JingleEvent) => void;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const xmppLib = require("@xmpp/client");
const { xml } = xmppLib;

class XMPPService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null;
  private status: XMPPStatus = "disconnected";
  private messageHandlers: Set<MessageHandler> = new Set();
  private presenceHandlers: Set<PresenceHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private subscriptionHandlers: Set<SubscriptionHandler> = new Set();
  private currentJID: string | null = null;
  private autoAcceptEnabled = false;
  private jingleHandlers: Set<JingleHandler> = new Set();

  private setStatus(status: XMPPStatus) {
    this.status = status;
    this.statusHandlers.forEach((h) => {
      try { h(status); } catch (e) { console.warn("[XMPP] Status handler error:", e); }
    });
  }

  private bareJID(jid: string): string {
    return jid.split("/")[0];
  }

  async connect(username: string, password: string, serverOrDomain?: string): Promise<boolean> {
    if (this.client) {
      await this.disconnect();
    }
    this.setStatus("connecting");

    const endpoints = serverOrDomain
      ? this.buildEndpoints(serverOrDomain)
      : [XMPP_CONFIG.service, XMPP_CONFIG.servicePlain];
    const domain = serverOrDomain ? this.parseDomain(serverOrDomain) : XMPP_CONFIG.domain;

    for (const endpoint of endpoints) {
      console.log(`[XMPP] Trying: ${endpoint}`);
      const success = await this._tryConnect(username, password, endpoint, domain);
      if (success) return true;
      console.warn(`[XMPP] Failed on ${endpoint}`);
    }

    this.setStatus("error");
    return false;
  }

  private buildEndpoints(serverOrDomain: string): string[] {
    if (serverOrDomain.includes("://")) {
      return [serverOrDomain];
    }
    return [
      `wss://${serverOrDomain}:5443/ws`,
      `ws://${serverOrDomain}:5280/ws`,
    ];
  }

  private parseDomain(serverOrDomain: string): string {
    try {
      if (serverOrDomain.includes("://")) {
        return new URL(serverOrDomain).hostname;
      }
      return serverOrDomain;
    } catch {
      return serverOrDomain;
    }
  }

  private async _tryConnect(username: string, password: string, endpoint: string, domain: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let resolved = false;
      const resolveOnce = (value: boolean) => {
        if (!resolved) { resolved = true; resolve(value); }
      };

      const timeout = setTimeout(() => {
        console.warn(`[XMPP] Timeout on ${endpoint}`);
        try { if (this.client) { this.client.stop().catch(() => {}); this.client = null; } } catch (_) {}
        resolveOnce(false);
      }, 20000);

      try {
        const xmpp = xmppLib.client({
          service: endpoint,
          domain: XMPP_CONFIG.domain,
          resource: "tolpar-mobile",
          username,
          password,
        });

        this.client = xmpp;
        this.currentJID = `${username}@${XMPP_CONFIG.domain}`;

        xmpp.on("online", async () => {
          console.log("[XMPP] ✅ Connected as", this.currentJID, "via", endpoint);
          clearTimeout(timeout);
          this.setStatus("connected");
          try { await xmpp.send(xml("presence")); } catch (e) { console.warn("[XMPP] Presence error:", e); }
          resolveOnce(true);
        });

        xmpp.on("offline", () => {
          console.log("[XMPP] Disconnected");
          this.setStatus("disconnected");
        });

        xmpp.on("error", (err: Error) => {
          const msg = err?.message ?? String(err);
          console.warn(`[XMPP] ❌ Error on ${endpoint}:`, msg);
          clearTimeout(timeout);
          try { xmpp.stop().catch(() => {}); } catch (_) {}
          this.client = null;
          resolveOnce(false);
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        xmpp.on("stanza", (stanza: any) => {
          try { this.handleStanza(stanza); } catch (e) { console.warn("[XMPP] Stanza error:", e); }
        });

        xmpp.start().catch((err: Error) => {
          console.warn(`[XMPP] start() threw on ${endpoint}:`, err?.message ?? err);
          clearTimeout(timeout);
          this.client = null;
          resolveOnce(false);
        });
      } catch (err) {
        console.warn("[XMPP] Constructor exception:", err);
        clearTimeout(timeout);
        this.client = null;
        resolveOnce(false);
      }
    });
  }

  async disconnect(): Promise<void> {
    this.autoAcceptEnabled = false;
    if (!this.client) return;
    try { await this.client.stop(); } catch (e) { console.warn("[XMPP] Disconnect error:", e); }
    finally {
      this.client = null;
      this.currentJID = null;
      this.setStatus("disconnected");
    }
  }

  async sendMessage(to: string, body: string): Promise<void> {
    if (!this.client || this.status !== "connected") {
      console.warn("[XMPP] Cannot send: not connected");
      return;
    }
    try {
      await this.client.send(xml("message", { type: "chat", to }, xml("body", {}, body)));
    } catch (e) {
      console.warn("[XMPP] Send error:", e);
      throw e;
    }
  }

  async sendPresence(): Promise<void> {
    if (!this.client || this.status !== "connected") return;
    try { await this.client.send(xml("presence")); } catch (e) { console.warn("[XMPP] Presence error:", e); }
  }

  async fetchRoster(): Promise<RosterItem[]> {
    if (!this.client || this.status !== "connected") return [];

    return new Promise<RosterItem[]>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn("[XMPP] Roster timeout");
        resolve([]);
      }, 8000);

      try {
        const iqId = `roster_${Date.now()}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const onStanza = (stanza: any) => {
          if (stanza.is("iq") &&
            (stanza.attrs.type === "result" || stanza.attrs.type === "error") &&
            stanza.attrs.id === iqId) {
            this.client?.removeListener("stanza", onStanza);
            clearTimeout(timeout);

            if (stanza.attrs.type === "error") { resolve([]); return; }

            const query = stanza.getChild("query", "jabber:iq:roster");
            if (!query) { resolve([]); return; }

            const items: RosterItem[] = query.getChildren("item").map((item: { attrs: { jid: string; name?: string; subscription?: string } }) => ({
              jid: item.attrs.jid,
              name: item.attrs.name || item.attrs.jid.split("@")[0],
              subscription: item.attrs.subscription || "none",
            }));

            console.log("[XMPP] Roster:", items.length, "contacts");
            resolve(items);
          }
        };

        this.client.on("stanza", onStanza);
        this.client.send(
          xml("iq", { type: "get", id: iqId }, xml("query", { xmlns: "jabber:iq:roster" }))
        ).catch(() => { clearTimeout(timeout); resolve([]); });
      } catch (e) {
        clearTimeout(timeout);
        resolve([]);
      }
    });
  }

  /** Send a subscription request to a JID */
  async subscribe(to: string): Promise<void> {
    if (!this.client || this.status !== "connected") {
      console.warn("[XMPP] Cannot subscribe: not connected");
      return;
    }
    try {
      console.log("[XMPP] Subscribing to", to);
      await this.client.send(xml("presence", { type: "subscribe", to }));
    } catch (e) {
      console.warn("[XMPP] Subscribe error:", e);
    }
  }

  /** Accept a presence subscription from a JID */
  async acceptSubscription(from: string): Promise<void> {
    if (!this.client || this.status !== "connected") {
      console.warn("[XMPP] Cannot accept subscription: not connected");
      return;
    }
    try {
      console.log("[XMPP] Accepting subscription from", from);
      await this.client.send(xml("presence", { type: "subscribed", to: from }));
    } catch (e) {
      console.warn("[XMPP] Accept subscription error:", e);
    }
  }

  /**
   * Enable auto-accepting all incoming subscription requests.
   * Also sends a mutual subscribe back so both parties end up in each other's roster.
   * Call once after connecting.
   */
  enableAutoAcceptSubscriptions(): void {
    if (this.autoAcceptEnabled) return;
    this.autoAcceptEnabled = true;
    console.log("[XMPP] Auto-accept subscriptions enabled");
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => { this.messageHandlers.delete(handler); };
  }

  onPresence(handler: PresenceHandler): () => void {
    this.presenceHandlers.add(handler);
    return () => { this.presenceHandlers.delete(handler); };
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => { this.statusHandlers.delete(handler); };
  }

  onSubscriptionRequest(handler: SubscriptionHandler): () => void {
    this.subscriptionHandlers.add(handler);
    return () => { this.subscriptionHandlers.delete(handler); };
  }

  onJingle(handler: JingleHandler): () => void {
    this.jingleHandlers.add(handler);
    return () => { this.jingleHandlers.delete(handler); };
  }

  async sendJingleInitiate(to: string, sid: string, sdp: string): Promise<void> {
    if (!this.client || this.status !== "connected") return;
    await this.client.send(
      xml("iq", { type: "set", to, id: `jingle_${sid}` },
        xml("jingle", { xmlns: "urn:ietf:params:xml:ns:jingle", action: "session-initiate", sid, initiator: this.currentJID },
          xml("content", { name: "audio", creator: "initiator" },
            xml("description", { xmlns: "urn:xmpp:jingle:apps:rtp:1", media: "audio" }),
            xml("transport", { xmlns: "urn:xmpp:jingle:transports:ice-udp:1" },
              xml("fingerprint", { xmlns: "urn:xmpp:jingle:apps:dtls:0", hash: "sha-256" }, sdp)
            )
          )
        )
      )
    );
  }

  async sendJingleAccept(to: string, sid: string, sdp: string): Promise<void> {
    if (!this.client || this.status !== "connected") return;
    await this.client.send(
      xml("iq", { type: "set", to, id: `jingle_accept_${sid}` },
        xml("jingle", { xmlns: "urn:ietf:params:xml:ns:jingle", action: "session-accept", sid, responder: this.currentJID },
          xml("content", { name: "audio", creator: "initiator" },
            xml("description", { xmlns: "urn:xmpp:jingle:apps:rtp:1", media: "audio" }),
            xml("transport", { xmlns: "urn:xmpp:jingle:transports:ice-udp:1" },
              xml("fingerprint", { xmlns: "urn:xmpp:jingle:apps:dtls:0", hash: "sha-256" }, sdp)
            )
          )
        )
      )
    );
  }

  async sendJingleTerminate(to: string, sid: string): Promise<void> {
    if (!this.client || this.status !== "connected") return;
    await this.client.send(
      xml("iq", { type: "set", to, id: `jingle_term_${sid}` },
        xml("jingle", { xmlns: "urn:ietf:params:xml:ns:jingle", action: "session-terminate", sid },
          xml("reason", {}, xml("success"))
        )
      )
    );
  }

  async sendJingleCandidate(
    to: string, sid: string,
    candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null }
  ): Promise<void> {
    if (!this.client || this.status !== "connected") return;
    await this.client.send(
      xml("iq", { type: "set", to, id: `jingle_ice_${Date.now()}` },
        xml("jingle", { xmlns: "urn:ietf:params:xml:ns:jingle", action: "transport-info", sid },
          xml("content", { name: "audio", creator: "initiator" },
            xml("transport", { xmlns: "urn:xmpp:jingle:transports:ice-udp:1" },
              xml("candidate", {
                component: "1",
                foundation: "1",
                generation: "0",
                id: `cand_${Date.now()}`,
                network: "1",
                priority: "1",
                protocol: "udp",
                type: "host",
                "candidate-sdp": candidate.candidate,
                "sdp-mid": candidate.sdpMid ?? "audio",
                "sdp-mline-index": String(candidate.sdpMLineIndex ?? 0),
              })
            )
          )
        )
      )
    );
  }

  getStatus(): XMPPStatus { return this.status; }
  getJID(): string | null { return this.currentJID; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleStanza(stanza: any) {
    if (stanza.is("message")) {
      const body = stanza.getChildText("body");
      if (!body) return;
      const from = this.bareJID(stanza.attrs.from ?? "");
      const msgId = stanza.attrs.id ?? `msg_${Date.now()}`;
      const delay = stanza.getChild("delay", "urn:xmpp:delay");
      const timestamp = delay?.attrs?.stamp
        ? new Date(delay.attrs.stamp as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      this.messageHandlers.forEach((h) => {
        try { h(from, body, msgId, timestamp); } catch (e) { console.warn("[XMPP] Msg handler error:", e); }
      });
    } else if (stanza.is("iq")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jingle = stanza.getChild("jingle", "urn:ietf:params:xml:ns:jingle") as any;
      if (jingle) {
        const action = jingle.attrs.action as JingleAction;
        const sid = jingle.attrs.sid as string;
        const from = this.bareJID(stanza.attrs.from ?? "");
        // Send IQ result ack
        if (stanza.attrs.type === "set") {
          this.client?.send(xml("iq", { type: "result", to: stanza.attrs.from, id: stanza.attrs.id })).catch(() => {});
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const content = jingle.getChild("content") as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transport = content?.getChild("transport") as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fingerprint = transport?.getChild("fingerprint") as any;
        const sdp = fingerprint?.text();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const candidateEl = transport?.getChild("candidate") as any;
        const candidate = candidateEl ? {
          candidate: candidateEl.attrs["candidate-sdp"] ?? "",
          sdpMid: candidateEl.attrs["sdp-mid"] ?? null,
          sdpMLineIndex: candidateEl.attrs["sdp-mline-index"] != null ? Number(candidateEl.attrs["sdp-mline-index"]) : null,
        } : undefined;
        this.jingleHandlers.forEach((h) => {
          try { h({ action, from, sid, sdp, candidate }); } catch (e) { console.warn("[XMPP] Jingle handler error:", e); }
        });
      }
    } else if (stanza.is("presence")) {
      const from = this.bareJID(stanza.attrs.from ?? "");
      if (!from) return;
      const type = (stanza.attrs.type as string) ?? "available";

      if (type === "subscribe") {
        console.log("[XMPP] Subscription request from", from);
        // Emit subscription_request event
        this.subscriptionHandlers.forEach((h) => {
          try { h(from); } catch (e) { console.warn("[XMPP] Subscription handler error:", e); }
        });
        // Auto-accept if enabled
        if (this.autoAcceptEnabled && this.client) {
          console.log("[XMPP] Auto-accepting subscription from", from);
          this.client.send(xml("presence", { type: "subscribed", to: from })).catch((e: Error) => {
            console.warn("[XMPP] Auto-accept send error:", e);
          });
          // Also send mutual subscribe back
          this.client.send(xml("presence", { type: "subscribe", to: from })).catch((e: Error) => {
            console.warn("[XMPP] Mutual subscribe error:", e);
          });
        }
        return; // Don't forward to presence handlers
      }

      this.presenceHandlers.forEach((h) => {
        try { h(from, type); } catch (e) { console.warn("[XMPP] Presence handler error:", e); }
      });
    }
  }
}

export const xmppService = new XMPPService();