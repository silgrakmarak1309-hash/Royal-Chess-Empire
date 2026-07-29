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
    onError: () => {
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      showAd().finally(() => {
        onClose();
      });
    }
  }, [isOpen]);

  return null; // Fake/Simulated ad popup screen ko completely disable kar diya
}
