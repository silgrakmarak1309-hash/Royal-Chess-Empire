import React from 'react';
import { Heart, Coins, RotateCcw, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { twMerge } from 'tailwind-merge';

interface GameHeaderProps {
  lives?: number;
  coins?: number;
  onUndo?: () => void;
  onHint?: () => void;
  isPassAndPlay?: boolean;
}

export function GameHeader({ lives = 3, coins = 0, onUndo, onHint, isPassAndPlay = false }: GameHeaderProps) {
  return (
    <div className="w-full flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 shadow-sm">
      {!isPassAndPlay ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span className="text-zinc-100 font-bold font-sans">{lives}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-zinc-100 font-bold font-sans">{coins}</span>
          </div>
        </div>
      ) : (
        <div className="font-serif text-zinc-100 text-lg font-medium tracking-wide">
          Pass & Play
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onUndo}
          className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white font-sans"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Takeback
        </Button>
        {!isPassAndPlay && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onHint}
            className="bg-zinc-800 border-zinc-700 text-yellow-500 hover:bg-zinc-700 hover:text-yellow-400 font-sans"
          >
            <Lightbulb className="w-4 h-4 mr-1.5" />
            Hint (50)
          </Button>
        )}
      </div>
    </div>
  );
}
