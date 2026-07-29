import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Coins, Heart, Play, Users, UserCircle, Plus, ShieldAlert } from 'lucide-react';
import { GetMoreCoinsModal } from '@/components/get-more-coins-modal';

export function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showCoinsModal, setShowCoinsModal] = useState(false);

  if (isLoading || !user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  // dailyAdsWatched is returned by the server but not in the generated type yet
  const dailyAdsWatched = (user as typeof user & { dailyAdsWatched?: number }).dailyAdsWatched ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full p-4 flex justify-between items-center bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-xl text-primary-foreground font-serif leading-none">♞</span>
          </div>
          <span className="font-serif font-bold text-lg hidden sm:inline-block text-foreground">Royal Chess Club</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Lives pill */}
          <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full border border-border">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span className="text-foreground font-bold font-sans">{user.lives}</span>
          </div>

          {/* Coins pill — + opens Get More Coins modal */}
          <button
            onClick={() => setShowCoinsModal(true)}
            className="flex items-center gap-1.5 bg-muted pl-3 pr-1 py-1.5 rounded-full border border-border hover:border-yellow-500/50 transition-colors group"
            aria-label="Get more coins"
          >
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-foreground font-bold font-sans mr-1">{user.coins}</span>
            <span className="w-6 h-6 rounded-full bg-yellow-500/15 group-hover:bg-yellow-500/30 flex items-center justify-center transition-colors">
              <Plus className="w-3.5 h-3.5 text-yellow-500" />
            </span>
          </button>

          {/* Profile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/profile')}
            className="ml-1 rounded-full bg-muted border border-border"
          >
            <UserCircle className="w-5 h-5 text-foreground" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col items-center justify-center gap-6">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-8 text-center">
          Choose Your Mode
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div
            onClick={() => setLocation('/campaign')}
            className="group cursor-pointer bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col items-center text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Play className="w-10 h-10 ml-1" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Campaign Mode</h2>
            <p className="text-muted-foreground font-sans">
              Face off against 100 levels of escalating AI difficulty. Earn coins for every victory.
            </p>
          </div>

          <div
            onClick={() => setLocation('/game/passplay')}
            className="group cursor-pointer bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden flex flex-col items-center text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 bg-secondary/10 text-secondary-foreground rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Pass & Play</h2>
            <p className="text-muted-foreground font-sans">
              Play locally with a friend on the same device. Pure chess, no interruptions.
            </p>
          </div>
        </div>

        {user.isAdmin && (
          <Button
            onClick={() => setLocation('/admin')}
            variant="outline"
            className="mt-8 border-red-500/30 text-red-600 hover:bg-red-500/10"
          >
            <ShieldAlert className="w-4 h-4 mr-2" />
            Admin Panel
          </Button>
        )}
      </main>

      <GetMoreCoinsModal
        open={showCoinsModal}
        onClose={() => setShowCoinsModal(false)}
        coins={user.coins}
        lives={user.lives}
        dailyBonusDay={user.dailyBonusDay ?? 0}
        lastDailyBonusDate={user.lastDailyBonusDate}
        dailyAdsWatched={dailyAdsWatched}
      />
    </div>
  );
}
