import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { OnboardingTour } from "@/components/OnboardingTour";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import GenerateIdeas from "./pages/GenerateIdeas";
import ValidateIdea from "./pages/ValidateIdea";
import Backlog from "./pages/Backlog";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import OrbisChat from "./pages/OrbisChat";
import Examples from "./pages/Examples";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <>
    <OnboardingTour />
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/examples" element={<Examples />} />
      <Route path="/auth" element={<Auth />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<OrbisChat />} />
        <Route path="/generate" element={<GenerateIdeas />} />
        <Route path="/validate" element={<ValidateIdea />} />
        <Route path="/ideas" element={<Backlog />} />
        <Route path="/history" element={<Reports />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
