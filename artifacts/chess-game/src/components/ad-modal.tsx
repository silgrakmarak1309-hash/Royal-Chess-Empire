import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface AdModalProps {
  open: boolean;
  onComplete: () => void;
  title?: string;
}

export function AdModal({ open, onComplete, title = "Advertisement" }: AdModalProps) {
  const [timeLeft, setTimeLeft] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!open) {
      setTimeLeft(5);
      setCanSkip(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 flex flex-col items-center justify-center p-8 min-h-[300px]">
        <DialogHeader className="w-full text-center">
          <DialogTitle className="text-xl font-sans text-zinc-400 font-medium tracking-widest uppercase">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col items-center justify-center space-y-6 w-full py-8">
          <div className="w-16 h-16 rounded-full border-4 border-zinc-700 border-t-yellow-500 animate-spin"></div>
          <p className="text-zinc-300 font-sans">
            Please wait while we show a simulated ad...
          </p>
          <div className="w-full max-w-[200px] space-y-2 text-center">
            <Progress value={(5 - timeLeft) * 20} className="h-2 bg-zinc-800" />
            <p className="text-xs text-zinc-500 font-mono text-center block">
              {timeLeft > 0 ? `00:0${timeLeft}` : 'Completed'}
            </p>
          </div>
        </div>

        <div className="w-full flex justify-end">
          <Button 
            onClick={handleSkip} 
            disabled={!canSkip}
            variant="secondary"
            className="font-sans font-medium"
          >
            {canSkip ? 'Skip Ad' : `Skip in ${timeLeft}s`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
