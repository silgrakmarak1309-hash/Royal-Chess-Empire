import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

export function Landing() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full p-6 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md">
            <span className="text-2xl text-primary-foreground font-serif leading-none">♞</span>
          </div>
          <span className="font-serif font-bold text-xl tracking-wide text-foreground">Royal Chess Club</span>
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => setLocation('/login')} className="font-sans font-medium text-foreground">Log In</Button>
          <Button onClick={() => setLocation('/register')} className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans font-medium">Join Now</Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto w-full">
        <div className="chess-board-outer w-48 h-48 sm:w-64 sm:h-64 mb-12 transform rotate-3 hover:rotate-0 transition-transform duration-500">
           <div className="chess-board-inner w-full h-full bg-[#4A2C0A] p-2 flex items-center justify-center">
             <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
               <div className="bg-[#D4A97F]"></div>
               <div className="bg-[#8B5E3C] flex items-center justify-center text-5xl chess-piece-white font-serif">♔</div>
               <div className="bg-[#8B5E3C] flex items-center justify-center text-5xl chess-piece-black font-serif">♞</div>
               <div className="bg-[#D4A97F]"></div>
             </div>
           </div>
        </div>

        <h1 className="text-5xl sm:text-7xl font-serif font-bold text-foreground leading-tight mb-6">
          Master the Game.<br/>Earn the Glory.
        </h1>
        <p className="text-xl text-muted-foreground font-sans max-w-2xl mb-10 leading-relaxed">
          Step into a premium chess experience. Challenge our escalating AI campaign, play with friends locally, and earn real rewards for your strategic brilliance.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button onClick={() => setLocation('/register')} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-lg h-14 px-8 w-full sm:w-auto">
            Play Now for Free
          </Button>
          <Button variant="outline" size="lg" onClick={() => setLocation('/login')} className="font-sans text-lg h-14 px-8 w-full sm:w-auto border-border bg-card">
            Returning Member
          </Button>
        </div>
      </main>
    </div>
  );
}
