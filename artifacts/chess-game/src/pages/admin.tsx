import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { 
  useAdminGetStats, 
  useAdminGetWithdrawals, 
  useAdminApproveWithdrawal, 
  useAdminRejectWithdrawal,
  getAdminGetWithdrawalsQueryKey,
  getAdminGetStatsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, Users, DollarSign, Clock, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { twMerge } from 'tailwind-merge';

export function AdminPanel() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useAdminGetStats({
    query: { enabled: !!user?.isAdmin }
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useAdminGetWithdrawals({
    query: { enabled: !!user?.isAdmin }
  });

  const approveMutation = useAdminApproveWithdrawal();
  const rejectMutation = useAdminRejectWithdrawal();

  // Redirect if not admin
  React.useEffect(() => {
    if (!authLoading && user && !user.isAdmin) {
      setLocation('/home');
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || !user || !user.isAdmin) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Approved", description: "Withdrawal marked as paid." });
        queryClient.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Rejected", description: "Withdrawal rejected, coins refunded." });
        queryClient.invalidateQueries({ queryKey: getAdminGetWithdrawalsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full p-4 flex items-center bg-card border-b border-border sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/home')} className="mr-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <LayoutDashboard className="w-5 h-5 mr-2 text-primary" />
        <h1 className="text-xl font-serif font-bold text-foreground">Admin Dashboard</h1>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-sans text-muted-foreground font-medium">Total Users</p>
              <p className="text-2xl font-bold font-sans text-foreground">{statsLoading ? '-' : stats?.totalUsers}</p>
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-sans text-muted-foreground font-medium">Total Coins</p>
              <p className="text-2xl font-bold font-sans text-foreground">{statsLoading ? '-' : stats?.totalCoinsInSystem}</p>
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-sans text-muted-foreground font-medium">Total Withdrawals</p>
              <p className="text-2xl font-bold font-sans text-foreground">{statsLoading ? '-' : stats?.totalWithdrawals}</p>
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-sans text-muted-foreground font-medium">Pending Requests</p>
              <p className="text-2xl font-bold font-sans text-foreground">{statsLoading ? '-' : stats?.pendingWithdrawals}</p>
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-xl font-serif font-bold text-foreground">Withdrawal Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">User Email</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Coins</th>
                  <th className="p-4 font-medium">UPI ID</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawalsLoading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : withdrawals?.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground italic">No requests found.</td></tr>
                ) : (
                  withdrawals?.map(w => (
                    <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 whitespace-nowrap text-sm">{format(new Date(w.createdAt), 'PP p')}</td>
                      <td className="p-4 whitespace-nowrap text-sm font-medium">{w.userEmail}</td>
                      <td className="p-4 whitespace-nowrap font-bold text-green-600">₹{w.amount}</td>
                      <td className="p-4 whitespace-nowrap text-sm text-yellow-600">{w.coinsDeducted}</td>
                      <td className="p-4 whitespace-nowrap text-sm font-mono">{w.upiId}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={twMerge(
                          "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          w.status === 'PENDING' ? "bg-orange-500/10 text-orange-600" :
                          w.status === 'PAID' ? "bg-green-500/10 text-green-600" :
                          "bg-red-500/10 text-red-600"
                        )}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {w.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApprove(w.id)} disabled={approveMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white h-8">
                              <Check className="w-4 h-4 mr-1" /> Paid
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(w.id)} disabled={rejectMutation.isPending} className="border-red-200 text-red-600 hover:bg-red-50 h-8">
                              <X className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
