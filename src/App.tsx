import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import TermsOfService from "./pages/TermsOfService";
import MorphPrism from "./pages/MorphPrism";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TodaysPuzzle from "./pages/admin/TodaysPuzzle";
import Scheduler from "./pages/admin/Scheduler";
import PuzzleVault from "./pages/admin/PuzzleVault";
import Dictionary from "./pages/admin/Dictionary";
import PlayerSessions from "./pages/admin/PlayerSessions";
import Analytics from "./pages/admin/Analytics";
import FeatureFlags from "./pages/admin/FeatureFlags";
import AuditLog from "./pages/admin/AuditLog";
import Configuration from "./pages/admin/Configuration";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/prism" element={<MorphPrism />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="puzzle" element={<TodaysPuzzle />} />
            <Route path="scheduler" element={<Scheduler />} />
            <Route path="vault" element={<PuzzleVault />} />
            <Route path="dictionary" element={<Dictionary />} />
            <Route path="sessions" element={<PlayerSessions />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="flags" element={<FeatureFlags />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="config" element={<Configuration />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
