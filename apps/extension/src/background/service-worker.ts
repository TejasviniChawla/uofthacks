// Service Worker for Sentinella Extension
// Handles extension lifecycle, message passing, and state management

import { initializeAmplitude } from '../lib/amplitude';

let amplitudeClient: any = null;

// Initialize on extension install/startup
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First install - set default preferences
    await chrome.storage.local.set({
      preferences: {
        profileName: 'Default',
        isDefault: true,
        filters: {
          profanity: { level: 'MEDIUM', enabled: true, threshold: 0.7 },
          violence: { level: 'LOW', enabled: true, threshold: 0.9 },
          sexual: { level: 'HIGH', enabled: true, threshold: 0.5 },
          jumpscares: { level: 'HIGH', enabled: true, threshold: 0.5 },
          flashing: { level: 'HIGH', enabled: true, threshold: 0.5 },
          spoilers: { level: 'OFF', enabled: false, threshold: 1.0 },
          loud_audio: { level: 'MEDIUM', enabled: true, threshold: 0.7 },
          hate_speech: { level: 'HIGH', enabled: true, threshold: 0.5 }
        }
      },
      sessionStats: {
        itemsFiltered: 0,
        itemsByCategory: {},
        itemsRevealed: 0,
        overrides: 0,
        sessionStart: Date.now()
      }
    });
  }

  // Initialize Amplitude
  amplitudeClient = await initializeAmplitude();
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PREFERENCES') {
    chrome.storage.local.get(['preferences']).then(({ preferences }) => {
      sendResponse({ preferences });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'UPDATE_PREFERENCES') {
    chrome.storage.local.set({ preferences: message.preferences }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'TRACK_EVENT' && amplitudeClient) {
    // Forward events to Amplitude
    amplitudeClient.track(message.eventName, message.properties);
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_SESSION_STATS') {
    chrome.storage.local.get(['sessionStats']).then(({ sessionStats }) => {
      sendResponse({ stats: sessionStats });
    });
    return true;
  }

  if (message.type === 'UPDATE_SESSION_STATS') {
    chrome.storage.local.set({ sessionStats: message.stats }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Track tab changes to detect platform
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    if (url.hostname.includes('twitch.tv') || url.hostname.includes('youtube.com')) {
      // Notify content script that extension is active
      chrome.tabs.sendMessage(tabId, { type: 'EXTENSION_ACTIVE' }).catch(() => {
        // Content script might not be ready yet, ignore
      });
    }
  }
});

export {};
