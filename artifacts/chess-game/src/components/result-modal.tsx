import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, HeartCrack, Trophy } from 'lucide-react';
import { Link } from 'wouter';

interface ResultModalProps {
  open: boolean;
  status: 'win' | 'lose' | 'draw';
  coinsAwarded?: number;
  isPassAndPlay?: boolean;
}

export function ResultModal({ open, status, coinsAwarded = 0, isPassAndPlay = false }: ResultModalProps) {
  let title = 'Game Over';
  let icon = null;
  let message = '';

  if (status === 'win') {
    title = 'Victory!';
    icon = <Trophy className="w-16 h-16 text-yellow-500 mb-4" />;
    message = isPassAndPlay ? 'White wins the match!' : 'You defeated the AI!';
  } else if (status === 'lose') {
    title = 'Defeat';
    icon = <HeartCrack className="w-16 h-16 text-red-500 mb-4" />;
    message = isPassAndPlay ? 'Black wins the match!' : 'The AI outsmarted you.';
  } else {
    title = 'Draw';
    message = 'The game ended in a draw.';
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 p-8">
        <DialogHeader className="w-full text-center">
          <DialogTitle className="text-3xl font-serif text-center font-bold tracking-wide">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          {icon}
          <p className="text-zinc-300 text-center font-sans mb-6">
            {message}
          </p>

          {!isPassAndPlay && status === 'win' && coinsAwarded > 0 && (
            <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20 mb-6">
              <span className="text-yellow-500 font-sans font-medium">Earned</span>
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-500 font-bold font-sans">+{coinsAwarded}</span>
            </div>
          )}
          
          {!isPassAndPlay && status === 'lose' && (
             <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 mb-6">
               <span className="text-red-500 font-sans font-medium">Lost 1 Life</span>
             </div>
          )}
          
          <div className="flex gap-4 w-full justify-center">
            <Link href="/home" className="w-full">
              <Button className="w-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700 font-sans">
                Main Menu
              </Button>
            </Link>
            {!isPassAndPlay && (
              <Link href="/campaign" className="w-full">
                <Button className="w-full bg-[#4A2C0A] hover:bg-[#3A2208] text-[#E6CBA8] font-sans border border-[#2A1703]">
                  Campaign
                </Button>
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
