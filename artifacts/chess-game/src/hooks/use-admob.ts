/**
 * useAdMob
 *
 * Abstracts the AdMob rewarded ad lifecycle.
 * - On Android (Capacitor native): loads and shows a real rewarded ad via
 *   @capacitor-community/admob.
 * - On web / browser: falls back to a 5-second simulated ad timer so the
 *   experience still works during development.
 */

import { useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// Rewarded ad unit ID (Android)
const REWARDED_AD_UNIT_ID = 'ca-app-pub-4647188052127146/8272006137';

// Lazily import the AdMob plugin only when running natively to avoid
// bundling issues in the web build.
async function getAdMob() {
  const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');
  return { AdMob, RewardAdPluginEvents };
}

export interface AdMobHookOptions {
  /** Called when the ad has been watched / reward granted. */
  onRewarded: () => void;
  /** Called each second during the simulated web timer countdown. */
  onCountdown?: (secondsLeft: number) => void;
  /** Called if the ad fails to load or show (native only). Falls back to simulated on error. */
  onError?: (err: unknown) => void;
}

export function useAdMob({ onRewarded, onCountdown, onError }: AdMobHookOptions) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listenerHandleRef = useRef<{ remove: () => void } | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      listenerHandleRef.current?.remove();
    };
  }, []);

  const showAd = useCallback(async () => {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      try {
        const { AdMob, RewardAdPluginEvents } = await getAdMob();

        // Initialize AdMob (safe to call multiple times)
        await AdMob.initialize({
          testingDevices: [],
          initializeForTesting: false,
        });

        // Listen for the reward event BEFORE showing the ad
        const handle = await AdMob.addListener(
          RewardAdPluginEvents.Rewarded,
          () => {
            onRewarded();
            handle.remove();
          },
        );
        listenerHandleRef.current = handle;

        // Prepare and show the rewarded ad
        await AdMob.prepareRewardVideoAd({
          adId: REWARDED_AD_UNIT_ID,
          isTesting: false,
        });

        await AdMob.showRewardVideoAd();
      } catch (err) {
        onError?.(err);
        // If native ad fails, fall back to simulated timer
        runSimulatedTimer();
      }
    } else {
      runSimulatedTimer();
    }
  }, [onRewarded, onCountdown, onError]);

  function runSimulatedTimer(duration = 5) {
    let remaining = duration;
    onCountdown?.(remaining);
    timerRef.current = setInterval(() => {
      remaining -= 1;
      onCountdown?.(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        onRewarded();
      }
    }, 1000);
  }

  return { showAd };
}
