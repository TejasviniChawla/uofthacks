const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': getUserId(),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

function getUserId(): string {
  if (typeof window === 'undefined') return '';
  
  let userId = localStorage.getItem('sentinella_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('sentinella_user_id', userId);
  }
  return userId;
}

// ==================== STREAMER API ====================

export interface StreamStatus {
  isLive: boolean;
  startedAt: number | null;
  totalDetections: number;
  currentTensionLevel: number;
}

export interface Detection {
  id: string;
  type: string;
  confidence: number;
  timestamp: number;
  autoBlurred: boolean;
  wasWhitelisted: boolean;
}

export interface WhitelistEntry {
  id: string;
  piiType: string;
  valueHash: string;
  description: string;
  createdAt: string;
}

export async function getStreamStatus(): Promise<StreamStatus> {
  return api('/api/v1/streamer/status');
}

export async function getRecentDetections(limit = 10): Promise<Detection[]> {
  return api(`/api/v1/streamer/recent-detections?limit=${limit}`);
}

export async function getWhitelist(): Promise<WhitelistEntry[]> {
  return api('/api/v1/streamer/whitelist');
}

export async function addToWhitelist(data: {
  piiType: string;
  value: string;
  description: string;
}): Promise<WhitelistEntry> {
  return api('/api/v1/streamer/whitelist', {
    method: 'POST',
    body: data,
  });
}

export async function removeFromWhitelist(id: string): Promise<void> {
  await api(`/api/v1/streamer/whitelist/${id}`, {
    method: 'DELETE',
  });
}

export interface SafetyReport {
  streamId: string;
  totalPIIDetected: number;
  piiDetections: Detection[];
  nearMisses: Array<{
    type: string;
    timestamp: number;
    description: string;
    thumbnailUrl?: string;
  }>;
  recommendations: string[];
}

export async function getStreamReport(streamId: string): Promise<SafetyReport> {
  return api(`/api/v1/streamer/report/${streamId}`);
}

// ==================== WEBSOCKET ====================

export function createWebSocket(onMessage: (data: any) => void): WebSocket {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
  const ws = new WebSocket(`${wsUrl}/ws/realtime`);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket closed');
    // Auto-reconnect after 3 seconds
    setTimeout(() => createWebSocket(onMessage), 3000);
  };

  return ws;
}

