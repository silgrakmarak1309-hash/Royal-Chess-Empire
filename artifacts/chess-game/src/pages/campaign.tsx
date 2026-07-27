import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lock, Star } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function Campaign() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading || !user) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  const totalLevels = 100;
  const unlocked = user.unlockedLevel || 1;

  const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full p-4 flex items-center bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/home')} className="mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-serif font-bold text-foreground">Campaign</h1>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">The Grandmaster's Path</h2>
          <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
            Defeat the AI at each level to progress. Higher levels offer greater challenges and richer rewards.
          </p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3 sm:gap-4">
          {levels.map(level => {
            const isUnlocked = level <= unlocked;
            const isCurrent = level === unlocked;
            const isCompleted = level < unlocked;

            return (
              <button
                key={level}
                disabled={!isUnlocked}
                onClick={() => setLocation(`/game/campaign/${level}`)}
                className={twMerge(
                  "aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200 border-2",
                  !isUnlocked && "bg-muted border-transparent opacity-60 cursor-not-allowed",
                  isCompleted && "bg-primary border-primary text-primary-foreground hover:bg-primary/90",
                  isCurrent && "bg-card border-secondary text-foreground shadow-md hover:scale-105",
                  isUnlocked && "cursor-pointer"
                )}
              >
                {!isUnlocked ? (
                  <Lock className="w-5 h-5 text-muted-foreground mb-1" />
                ) : isCompleted ? (
                  <Star className="w-5 h-5 fill-current mb-1" />
                ) : null}
                <span className={twMerge(
                  "font-serif font-bold",
                  isCurrent ? "text-2xl text-secondary" : "text-xl",
                  !isUnlocked && "text-muted-foreground"
                )}>
                  {level}
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
