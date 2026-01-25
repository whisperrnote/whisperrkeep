/**
 * Whisperr Ecosystem Mesh Protocol
 * Defines the communication and state synchronization between distributed nodes.
 */

export type NodeType = 'control' | 'data' | 'secure' | 'logic' | 'message';

export interface NodeIdentity {
  id: string;
  type: NodeType;
  subdomain: string;
  version: string;
  status: 'online' | 'degraded' | 'offline';
  capabilities: string[];
}

export interface MeshMessage<T = any> {
  id: string;
  sourceNode: string;
  targetNode: string | 'all';
  type: 'RPC_REQUEST' | 'RPC_RESPONSE' | 'STATE_SYNC' | 'PULSE' | 'COMMAND';
  payload: T;
  timestamp: number;
  signature?: string;
}

// Optimization: Static registry of frames and channel
let activeChannel: BroadcastChannel | null = null;
const seenMessages = new Set<string>();

function getChannel() {
  if (typeof window === 'undefined') return null;
  if (!activeChannel) {
    activeChannel = new BroadcastChannel('whisperr_mesh_v2_core');
  }
  return activeChannel;
}

// Cleanup seen messages periodically
if (typeof window !== 'undefined') {
  setInterval(() => seenMessages.clear(), 60000);
}

export const MeshProtocol = {
  getNodes: (): NodeIdentity[] => [
    { id: 'id', type: 'control', subdomain: 'id', version: '1.5.0', status: 'online', capabilities: ['auth', 'identity', 'quota'] },
    { id: 'note', type: 'data', subdomain: 'note', version: '1.5.0', status: 'online', capabilities: ['knowledge_graph', 'ai_search'] },
    { id: 'keep', type: 'secure', subdomain: 'keep', version: '1.5.0', status: 'online', capabilities: ['vault', 'encryption', 'passkeys'] },
    { id: 'flow', type: 'logic', subdomain: 'flow', version: '1.5.0', status: 'online', capabilities: ['task_orchestration', 'events'] },
    { id: 'connect', type: 'message', subdomain: 'connect', version: '1.5.0', status: 'online', capabilities: ['realtime_comm', 'p2p_relay'] },
  ],

  getPremiumIcon: (nodeId: string) => {
    switch (nodeId) {
      case 'id': return 'Fingerprint';
      case 'note': return 'FileText';
      case 'keep': return 'Shield';
      case 'flow': return 'Waypoints';
      case 'connect': return 'Zap';
      default: return 'Layers';
    }
  },

  broadcast: (message: Omit<MeshMessage, 'id' | 'timestamp' | 'sourceNode'>, sourceId: string) => {
    const msgId = crypto.randomUUID();
    const fullMessage: MeshMessage = {
      ...message,
      id: msgId,
      sourceNode: sourceId,
      timestamp: Date.now()
    };

    seenMessages.add(msgId);

    if (typeof window !== 'undefined') {
      // 1. Unified Broadcaster
      getChannel()?.postMessage(fullMessage);

      // 2. Optimized Cross-Origin Relay
      const parent = window.parent !== window ? window.parent : null;
      if (parent) {
        parent.postMessage(fullMessage, '*');
      }

      // 3. Selective Frame Discovery (exclude common non-app iframes)
      const frames = document.getElementsByTagName('iframe');
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        if (frame.src.includes('.whisperr.app') || frame.src.includes('localhost')) {
          frame.contentWindow?.postMessage(fullMessage, '*');
        }
      }
    }

    return fullMessage;
  },

  subscribe: (handler: (msg: MeshMessage) => void) => {
    if (typeof window === 'undefined') return () => { };

    const bc = getChannel();
    const handleIncoming = (msg: MeshMessage) => {
      if (!msg.id || seenMessages.has(msg.id)) return;
      seenMessages.add(msg.id);
      handler(msg);
    };

    const bcHandler = (e: MessageEvent) => handleIncoming(e.data);
    bc?.addEventListener('message', bcHandler);

    const winHandler = (e: MessageEvent) => {
      const data = e.data;
      if (data && typeof data === 'object' && data.id && data.sourceNode && data.type) {
        handleIncoming(data as MeshMessage);
      }
    };
    window.addEventListener('message', winHandler);

    return () => {
      bc?.removeEventListener('message', bcHandler);
      window.removeEventListener('message', winHandler);
    };
  }
};
