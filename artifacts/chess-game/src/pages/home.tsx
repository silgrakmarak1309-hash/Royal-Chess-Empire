import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Coins, Heart, Play, Users, UserCircle, Plus, ShieldAlert } from 'lucide-react';
import { AdModal } from '@/components/ad-modal';
import { useWatchAd, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showAd, setShowAd] = useState(false);
  
  const watchAdMutation = useWatchAd();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleWatchAd = () => {
    setShowAd(true);
  };

  const handleAdComplete = () => {
    setShowAd(false);
    watchAdMutation.mutate(undefined, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Rewards Claimed", description: `You earned ${res.coinsAdded} coins!` });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  if (isLoading || !user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

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
          <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full border border-border">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span className="text-foreground font-bold font-sans">{user.lives}</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-muted pl-3 pr-1 py-1.5 rounded-full border border-border">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-foreground font-bold font-sans mr-2">{user.coins}</span>
            <Button size="icon" variant="ghost" className="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 text-primary" onClick={handleWatchAd}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setLocation('/profile')} className="ml-2 rounded-full bg-muted border border-border">
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
           <Button onClick={() => setLocation('/admin')} variant="outline" className="mt-8 border-red-500/30 text-red-600 hover:bg-red-500/10">
             <ShieldAlert className="w-4 h-4 mr-2" />
             Admin Panel
           </Button>
        )}
      </main>

      <AdModal open={showAd} onComplete={handleAdComplete} title="Watch Ad for Coins" />
    </div>
  );
}
