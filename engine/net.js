/**
 * Impact2D Engine - Networking (Serverless)
 * BroadcastChannel for local multiplayer (same machine, multiple tabs)
 */

export class NetworkAdapter {
  constructor(channelName = 'impact2d-game') {
    this.channelName = channelName;
    this.channel = null;
    this.connected = false;
    this.handlers = new Map();
    this.playerId = this.generateId();
  }

  generateId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  connect() {
    if (this.connected) return;

    try {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = event => this.handleMessage(event);
      this.connected = true;
      return true;
    } catch (e) {
      console.error('[net] Failed to create BroadcastChannel:', e);
      return false;
    }
  }

  disconnect() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.connected = false;
  }

  send(type, payload) {
    if (!this.connected || !this.channel) return false;

    try {
      this.channel.postMessage({
        type,
        payload,
        senderId: this.playerId,
        timestamp: Date.now()
      });
      return true;
    } catch (e) {
      console.error('[net] Failed to send message:', e);
      return false;
    }
  }

  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
  }

  off(type, handler) {
    if (!this.handlers.has(type)) return;
    const handlers = this.handlers.get(type);
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  handleMessage(event) {
    const { type, payload, senderId, timestamp } = event.data;

    // Ignore own messages
    if (senderId === this.playerId) return;

    // Call registered handlers
    if (this.handlers.has(type)) {
      const handlers = this.handlers.get(type);
      for (const handler of handlers) {
        handler({ type, payload, senderId, timestamp });
      }
    }

    // Call wildcard handlers
    if (this.handlers.has('*')) {
      const handlers = this.handlers.get('*');
      for (const handler of handlers) {
        handler({ type, payload, senderId, timestamp });
      }
    }
  }

  broadcast(eventType, data) {
    this.send(eventType, data);
  }

  getPlayerId() {
    return this.playerId;
  }
}

/**
 * WebRTC adapter interface (disabled by default)
 * This is a commented stub showing how to integrate WebRTC for true P2P networking
 */
/*
export class WebRTCAdapter {
  constructor(signalingServer) {
    this.signalingServer = signalingServer;
    this.peers = new Map();
    this.localId = this.generateId();
    this.onMessage = null;
  }

  generateId() {
    return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async connect(peerId) {
    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    const peer = new RTCPeerConnection(config);
    const channel = peer.createDataChannel('game');

    channel.onmessage = event => {
      if (this.onMessage) {
        this.onMessage(JSON.parse(event.data));
      }
    };

    // Handle ICE candidates, offers, answers through signaling server
    // (Implementation depends on signaling mechanism)

    this.peers.set(peerId, { peer, channel });
  }

  send(peerId, data) {
    const peerData = this.peers.get(peerId);
    if (peerData && peerData.channel.readyState === 'open') {
      peerData.channel.send(JSON.stringify(data));
    }
  }

  disconnect(peerId) {
    const peerData = this.peers.get(peerId);
    if (peerData) {
      peerData.peer.close();
      this.peers.delete(peerId);
    }
  }
}
*/

// Global singleton instance
export const net = new NetworkAdapter();
