import { useCallback, useEffect, useRef } from 'react';
import { amplitude } from '../../lib/amplitude';
import { getUserId } from '../../lib/storage';
import type { FilterCategory } from '../../types';

export function useAmplitude() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initAmplitude();
      initialized.current = true;
    }
  }, []);

  const initAmplitude = async () => {
    const userId = await getUserId();
    amplitude.init(userId);
  };

  const trackFilterTriggered = useCallback((
    category: FilterCategory,
    subcategory: string | undefined,
    confidence: number,
    platform: 'twitch' | 'youtube'
  ) => {
    amplitude.trackFilterTriggered(category, subcategory, confidence, platform);
  }, []);

  const trackFilterOverride = useCallback((
    category: FilterCategory,
    subcategory: string | undefined,
    overrideType: string,
    sessionCount: number
  ) => {
    amplitude.trackFilterOverride(category, subcategory, overrideType, sessionCount);
  }, []);

  const trackAdjustmentResponse = useCallback((
    category: FilterCategory,
    accepted: boolean,
    responseType: string
  ) => {
    amplitude.trackAdjustmentResponse(category, accepted, responseType);
  }, []);

  const trackProfileSwitch = useCallback((
    fromProfile: string,
    toProfile: string
  ) => {
    amplitude.trackProfileSwitch(fromProfile, toProfile);
  }, []);

  const trackSessionStart = useCallback((
    platform: string,
    profile: string,
    enabledFilters: number
  ) => {
    amplitude.trackSessionStart(platform, profile, enabledFilters);
  }, []);

  const trackSessionEnd = useCallback((
    duration: number,
    totalFiltered: number,
    totalOverridden: number
  ) => {
    amplitude.trackSessionEnd(duration, totalFiltered, totalOverridden);
  }, []);

  const track = useCallback((eventType: string, properties: Record<string, any> = {}) => {
    amplitude.track(eventType, properties);
  }, []);

  return {
    track,
    trackFilterTriggered,
    trackFilterOverride,
    trackAdjustmentResponse,
    trackProfileSwitch,
    trackSessionStart,
    trackSessionEnd,
  };
}
