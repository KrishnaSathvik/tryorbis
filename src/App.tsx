import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { OnboardingTour } from "@/components/OnboardingTour";
import { ScrollToTop } from "@/components/ScrollToTop";
import React, { Suspense } from "react";

const Landing = React.lazy(() => import("./pages/Landing"));
const Auth = React.lazy(() => import("./pages/Auth"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const GenerateIdeas = React.lazy(() => import("./pages/GenerateIdeas"));
const ValidateIdea = React.lazy(() => import("./pages/ValidateIdea"));
const Backlog = React.lazy(() => import("./pages/Backlog"));
const Reports = React.lazy(() => import("./pages/Reports"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const OrbisChat = React.lazy(() => import("./pages/OrbisChat"));
const Features = React.lazy(() => import("./pages/Features"));
const Community = React.lazy(() => import("./pages/Community"));
const Examples = React.lazy(() => import("./pages/Examples"));
const Changelog = React.lazy(() => import("./pages/Changelog"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <ScrollToTop />
    <OnboardingTour />
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/features" element={<Features />} />
      <Route path="/community" element={<Community />} />
      <Route path="/examples" element={<Examples />} />
      <Route path="/changelog" element={<Changelog />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/try" element={<Navigate to="/auth?mode=guest" replace />} />
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
  </Suspense>
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
