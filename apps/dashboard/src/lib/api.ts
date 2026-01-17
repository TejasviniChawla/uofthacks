// API client for streamer dashboard

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getStreamReport(streamId: string) {
  const response = await fetch(`${API_URL}/api/v1/streamer/report/${streamId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch stream report');
  }
  return response.json();
}

export async function getWhitelist() {
  // In production, fetch from API
  return [];
}

export async function addToWhitelist(item: { type: string; value: string; description: string }) {
  // In production, POST to API
  return { success: true };
}

export async function removeFromWhitelist(id: string) {
  // In production, DELETE from API
  return { success: true };
}
