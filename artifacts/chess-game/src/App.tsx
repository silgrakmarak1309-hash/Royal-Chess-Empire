import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

// Pages
import { Landing } from '@/pages/landing';
import { AuthPage } from '@/pages/auth';
import { Home } from '@/pages/home';
import { Campaign } from '@/pages/campaign';
import { CampaignGame } from '@/pages/campaign-game';
import { PassPlayGame } from '@/pages/pass-play-game';
import { Profile } from '@/pages/profile';
import { AdminPanel } from '@/pages/admin';

const queryClient = new QueryClient();

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { token, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!token) {
    // If not authenticated, let useEffect redirect
    setTimeout(() => setLocation('/login'), 0);
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login">
        <AuthPage mode="login" />
      </Route>
      <Route path="/register">
        <AuthPage mode="register" />
      </Route>
      
      <Route path="/home">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/campaign">
        <ProtectedRoute component={Campaign} />
      </Route>
      <Route path="/game/campaign/:level">
        <ProtectedRoute component={CampaignGame} />
      </Route>
      <Route path="/game/passplay">
        <ProtectedRoute component={PassPlayGame} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminPanel} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
