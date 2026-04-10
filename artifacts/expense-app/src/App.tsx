import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import Expenses from "@/pages/expenses";
import Budgets from "@/pages/budgets";
import Categories from "@/pages/categories";
import Reports from "@/pages/reports";
import Notifications from "@/pages/notifications";
import { AppLayout } from "@/components/layout/AppLayout";
import { PreferencesProvider } from "@/hooks/use-preferences";

const queryClient = new QueryClient();

// Auth wrapper to handle redirects for public routes
function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return null;

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={() => <PublicRoute component={Login} />} />
      <Route path="/register" component={() => <PublicRoute component={Register} />} />
      
      <Route path="/dashboard">
        <AppLayout><Dashboard /></AppLayout>
      </Route>
      <Route path="/expenses">
        <AppLayout><Expenses /></AppLayout>
      </Route>
      <Route path="/budgets">
        <AppLayout><Budgets /></AppLayout>
      </Route>
      <Route path="/categories">
        <AppLayout><Categories /></AppLayout>
      </Route>
      <Route path="/reports">
        <AppLayout><Reports /></AppLayout>
      </Route>
      <Route path="/notifications">
        <AppLayout><Notifications /></AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout><Settings /></AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <PreferencesProvider>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </PreferencesProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
