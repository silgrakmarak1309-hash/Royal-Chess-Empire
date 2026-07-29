import React, { useEffect } from 'react';
import { useAdMob } from '@/hooks/use-admob';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReward?: () => void;
}

export function AdModal({ isOpen, onClose, onReward }: AdModalProps) {
  const { showAd } = useAdMob({
    onRewarded: () => {
      if (onReward) onReward();
      onClose();
    },
    onError: (err) => {
      console.warn('[AdMob] Interstitial/Rewarded failed:', err);
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      showAd().then(() => {
        onClose();
      }).catch(() => {
        onClose();
      });
    }
  }, [isOpen]);

  return null; // Simulated web ad modal popup ko poori tarah remove kar diya!
}
