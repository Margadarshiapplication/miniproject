import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Layout from "@/components/layout/Layout";
import Index from "./pages/Index";
import Discover from "./pages/Discover";
import Coach from "./pages/Coach";
import Trips from "./pages/Trips";
import Profile from "./pages/Profile";
import SearchPage from "./pages/Search";
import Notifications from "./pages/Notifications";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import PlanTrip from "./pages/PlanTrip";
import Itinerary from "./pages/Itinerary";
import Destination from "./pages/Destination";
import Prepare from "./pages/Prepare";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public screens */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Onboarding (requires auth but no onboarding check) */}
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

            {/* Protected app with layout */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Index />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/coach" element={<Coach />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/plan" element={<PlanTrip />} />
              <Route path="/itinerary/:id" element={<Itinerary />} />
              <Route path="/destination/:id" element={<Destination />} />
              <Route path="/prepare/:tripId" element={<Prepare />} />
              <Route path="/support" element={<Support />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
