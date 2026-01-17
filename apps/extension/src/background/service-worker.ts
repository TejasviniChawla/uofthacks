/// <reference lib="webworker" />

// Background service worker for Sentinella extension

// Keep service worker alive
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Sentinella] Extension installed');
  
  // Set up alarm for keeping service worker alive
  if (chrome.alarms) {
    chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_TAB_INFO':
      handleGetTabInfo(sender.tab, sendResponse);
      return true;

    case 'TRACK_EVENT':
      handleTrackEvent(message.payload);
      sendResponse({ success: true });
      break;

    case 'GET_USER_ID':
      handleGetUserId().then(sendResponse);
      return true;

    case 'UPDATE_BADGE':
      handleUpdateBadge(message.payload, sender.tab?.id);
      sendResponse({ success: true });
      break;

    default:
      console.log('[Sentinella] Unknown message type:', message.type);
  }
});

// Handle tab updates to detect navigation to streaming sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isStreamingSite = 
      tab.url.includes('twitch.tv') || 
      tab.url.includes('youtube.com');

    if (isStreamingSite) {
      // Update badge to show extension is active
      chrome.action.setBadgeBackgroundColor({ color: '#22c55e', tabId });
      chrome.action.setBadgeText({ text: '●', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }
});

// Handle clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  // This fires if there's no popup - but we have a popup, so this won't fire
  // Keeping for potential future use
});

// ==================== MESSAGE HANDLERS ====================

function handleGetTabInfo(
  tab: chrome.tabs.Tab | undefined,
  sendResponse: (response: any) => void
) {
  if (!tab?.url) {
    sendResponse({ platform: null, isActive: false });
    return;
  }

  const url = new URL(tab.url);
  let platform: 'twitch' | 'youtube' | null = null;

  if (url.hostname.includes('twitch.tv')) {
    platform = 'twitch';
  } else if (url.hostname.includes('youtube.com')) {
    platform = 'youtube';
  }

  sendResponse({
    platform,
    isActive: platform !== null,
    url: tab.url,
    hostname: url.hostname,
  });
}

async function handleGetUserId(): Promise<string> {
  const result = await chrome.storage.local.get('sentinella_user_id');
  
  if (result.sentinella_user_id) {
    return result.sentinella_user_id;
  }

  // Generate new user ID
  const newId = generateUUID();
  await chrome.storage.local.set({ sentinella_user_id: newId });
  return newId;
}

function handleTrackEvent(payload: {
  eventType: string;
  eventProperties: Record<string, any>;
}) {
  // In production, this would send to Amplitude's batch endpoint
  console.log('[Sentinella] Track event:', payload.eventType, payload.eventProperties);
}

function handleUpdateBadge(
  payload: { count: number; color?: string },
  tabId?: number
) {
  const options: chrome.action.SetBadgeTextDetails = {
    text: payload.count > 0 ? String(payload.count) : '',
  };

  if (tabId) {
    options.tabId = tabId;
  }

  chrome.action.setBadgeText(options);

  if (payload.color) {
    chrome.action.setBadgeBackgroundColor({
      color: payload.color,
      ...(tabId && { tabId }),
    });
  }
}

// ==================== UTILITY FUNCTIONS ====================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Alarm listener for periodic tasks
if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') {
      // Keep service worker alive
      console.log('[Sentinella] Service worker heartbeat');
    }
  });
}

