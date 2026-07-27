import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Coins, Heart, LogOut, Gift, History, IndianRupee } from 'lucide-react';
import { AdModal } from '@/components/ad-modal';
import { 
  useClaimDailyBonus, 
  useRequestWithdrawal, 
  useGetMyWithdrawals,
  getGetMeQueryKey,
  getGetMyWithdrawalsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function Profile() {
  const { user, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showDailyAd, setShowDailyAd] = useState(false);
  const [doubleBonus, setDoubleBonus] = useState(false);
  
  const [upiId, setUpiId] = useState('');
  const [amount, setAmount] = useState<10|20|50>(10);

  const claimMutation = useClaimDailyBonus();
  const withdrawMutation = useRequestWithdrawal();
  const { data: withdrawals, isLoading: isLoadingWithdrawals } = useGetMyWithdrawals({
    query: { enabled: !!user, queryKey: getGetMyWithdrawalsQueryKey() }
  });

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const handleDailyBonusClick = (double: boolean) => {
    // Check if can claim today
    if (user.lastDailyBonusDate) {
      const lastDate = new Date(user.lastDailyBonusDate).toDateString();
      const today = new Date().toDateString();
      if (lastDate === today) {
        toast({ title: "Already claimed", description: "Come back tomorrow for your next bonus!" });
        return;
      }
    }
    setDoubleBonus(double);
    setShowDailyAd(true);
  };

  const handleDailyAdComplete = () => {
    setShowDailyAd(false);
    claimMutation.mutate({ data: { doubled: doubleBonus } }, {
      onSuccess: (res) => {
        toast({ title: "Bonus Claimed!", description: `You received ${res.coinsAdded} coins.` });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleWithdraw = () => {
    if (!upiId || upiId.length < 3) {
      toast({ title: "Invalid UPI", description: "Please enter a valid UPI ID.", variant: "destructive" });
      return;
    }
    withdrawMutation.mutate({ data: { amount, upiId } }, {
      onSuccess: () => {
        toast({ title: "Request Submitted", description: "Your withdrawal request has been placed." });
        setUpiId('');
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMyWithdrawalsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Request Failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const streakDays = [
    { day: 1, reward: 20 },
    { day: 2, reward: 30 },
    { day: 3, reward: 40 },
    { day: 4, reward: 50 },
    { day: 5, reward: 60 },
    { day: 6, reward: 70 },
    { day: 7, reward: 100 },
  ];

  const currentStreak = user.dailyBonusDay || 1;
  const canClaimToday = !user.lastDailyBonusDate || new Date(user.lastDailyBonusDate).toDateString() !== new Date().toDateString();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full p-4 flex items-center justify-between bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/home')} className="mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-serif font-bold text-foreground">Profile</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <Coins className="w-10 h-10 text-yellow-500 mb-2" />
            <h3 className="text-sm font-sans text-muted-foreground font-medium uppercase tracking-wider">Balance</h3>
            <p className="text-3xl font-serif font-bold text-foreground">{user.coins}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <Heart className="w-10 h-10 text-red-500 fill-red-500 mb-2" />
            <h3 className="text-sm font-sans text-muted-foreground font-medium uppercase tracking-wider">Lives</h3>
            <p className="text-3xl font-serif font-bold text-foreground">{user.lives}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-4xl text-primary font-serif leading-none mb-2">♚</span>
            <h3 className="text-sm font-sans text-muted-foreground font-medium uppercase tracking-wider">Campaign Level</h3>
            <p className="text-3xl font-serif font-bold text-foreground">{user.unlockedLevel}</p>
          </div>
        </section>

        {/* Daily Bonus */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Gift className="w-6 h-6 text-secondary" />
            <h2 className="text-2xl font-serif font-bold text-foreground">Daily Bonus</h2>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
            {streakDays.map((d) => {
              const isPast = d.day < currentStreak || (d.day === currentStreak && !canClaimToday);
              const isCurrent = d.day === currentStreak && canClaimToday;
              
              return (
                <div key={d.day} className={twMerge(
                  "flex flex-col items-center justify-center p-3 rounded-lg border",
                  isPast && "bg-muted border-border opacity-70",
                  isCurrent && "bg-secondary/10 border-secondary scale-105 shadow-sm",
                  !isPast && !isCurrent && "bg-background border-border"
                )}>
                  <span className="text-xs font-sans text-muted-foreground mb-1">Day {d.day}</span>
                  <Coins className={twMerge("w-5 h-5 mb-1", isPast ? "text-muted-foreground" : "text-yellow-500")} />
                  <span className={twMerge("font-bold font-sans", isCurrent ? "text-secondary" : "text-foreground")}>
                    {d.reward}
                  </span>
                </div>
              );
            })}
          </div>

          {canClaimToday ? (
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button onClick={() => handleDailyBonusClick(false)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans">
                Claim {streakDays[currentStreak - 1].reward} Coins
              </Button>
              <Button onClick={() => handleDailyBonusClick(true)} variant="outline" className="border-secondary text-secondary-foreground hover:bg-secondary/10 font-sans">
                Watch Ad for 2X ({streakDays[currentStreak - 1].reward * 2} Coins)
              </Button>
            </div>
          ) : (
             <div className="text-center p-4 bg-muted rounded-lg font-sans text-muted-foreground">
               You have claimed your bonus for today. Come back tomorrow!
             </div>
          )}
        </section>

        {/* Withdrawal */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <IndianRupee className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-serif font-bold text-foreground">Withdraw Winnings</h2>
          </div>

          <div className="bg-muted p-4 rounded-lg mb-6 text-sm font-sans text-foreground">
            <ul className="space-y-1">
              <li>₹10 = 750 coins</li>
              <li>₹20 = 1500 coins</li>
              <li>₹50 = 3750 coins</li>
              <li className="text-red-500 mt-2 font-medium">Aap din mein sirf ek hi baar withdrawal request laga sakte hain. Kripya kal try karein!</li>
            </ul>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-sans font-medium text-foreground mb-2 block">Select Amount</label>
              <div className="flex gap-4">
                {[10, 20, 50].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant={amount === amt ? 'default' : 'outline'}
                    onClick={() => setAmount(amt as 10|20|50)}
                    className={twMerge("flex-1 h-12 font-sans text-lg", amount === amt ? "bg-primary text-primary-foreground" : "")}
                  >
                    ₹{amt}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-sans font-medium text-foreground mb-2 block">UPI ID</label>
              <Input 
                value={upiId} 
                onChange={e => setUpiId(e.target.value)} 
                placeholder="example@upi" 
                className="bg-background h-12 text-lg"
              />
            </div>

            <Button 
              onClick={handleWithdraw} 
              disabled={withdrawMutation.isPending}
              className="w-full h-12 text-lg font-sans bg-green-600 hover:bg-green-700 text-white"
            >
              {withdrawMutation.isPending ? 'Submitting...' : 'Request Withdrawal'}
            </Button>
          </div>
        </section>

        {/* History */}
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <History className="w-6 h-6 text-muted-foreground" />
            <h2 className="text-2xl font-serif font-bold text-foreground">Withdrawal History</h2>
          </div>

          {isLoadingWithdrawals ? (
            <p className="text-muted-foreground font-sans">Loading history...</p>
          ) : withdrawals && withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawals.map(w => (
                <div key={w.id} className="flex justify-between items-center p-4 bg-background border border-border rounded-lg">
                  <div>
                    <p className="font-bold font-sans text-foreground">₹{w.amount}</p>
                    <p className="text-sm text-muted-foreground font-sans">{w.upiId}</p>
                    <p className="text-xs text-muted-foreground font-sans mt-1">{format(new Date(w.createdAt), 'PP p')}</p>
                  </div>
                  <div className={twMerge(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-sans",
                    w.status === 'PENDING' ? "bg-yellow-500/10 text-yellow-600" :
                    w.status === 'PAID' ? "bg-green-500/10 text-green-600" :
                    "bg-red-500/10 text-red-600"
                  )}>
                    {w.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground font-sans italic">No withdrawals yet.</p>
          )}
        </section>
      </main>

      <AdModal open={showDailyAd} onComplete={handleDailyAdComplete} title="Daily Bonus Ad" />
    </div>
  );
}
