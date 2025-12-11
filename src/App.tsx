import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import GameSelector from "./pages/GameSelector";
import Index from "./pages/Index";
import ChainArchive from "./pages/ChainArchive";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import TermsOfService from "./pages/TermsOfService";
// MorphPrism removed - hidden from app
import MorphRush from "./pages/MorphRush";
import GridArchive from "./pages/GridArchive";
import MorphGrid from "./pages/MorphGrid";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TodaysPuzzle from "./pages/admin/TodaysPuzzle";
import Scheduler from "./pages/admin/Scheduler";
import PuzzleVault from "./pages/admin/PuzzleVault";
import PuzzleValidator from "./pages/admin/PuzzleValidator";
import Dictionary from "./pages/admin/Dictionary";
import PlayerSessions from "./pages/admin/PlayerSessions";
import Analytics from "./pages/admin/Analytics";
import FeatureFlags from "./pages/admin/FeatureFlags";
import AuditLog from "./pages/admin/AuditLog";
import Configuration from "./pages/admin/Configuration";
import ScheduledPuzzles from "./pages/admin/ScheduledPuzzles";
import MorphArchive from "./pages/admin/MorphArchive";
import Rules from "./pages/Rules";
import Kids from "./pages/Kids";
import Press from "./pages/Press";
import Privacy from "./pages/Privacy";
import ProfilePage from "./pages/ProfilePage";
import WhatsNew from "./pages/WhatsNew";
import { useVersionCheck } from "./hooks/useVersionCheck";

const queryClient = new QueryClient();

const App = () => {
  // Check for version updates every 5 minutes
  useVersionCheck();

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="morph-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<GameSelector />} />
            <Route path="/chain" element={<Index />} />
            <Route path="/chain/archive" element={<ChainArchive />} />
            <Route path="/grid" element={<MorphGrid />} />
            <Route path="/grid/archive" element={<GridArchive />} />
            {/* Prism route removed - hidden from app */}
            <Route path="/rush" element={<MorphRush />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/kids" element={<Kids />} />
            <Route path="/press" element={<Press />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/whats-new" element={<WhatsNew />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="puzzle" element={<TodaysPuzzle />} />
            <Route path="scheduled" element={<ScheduledPuzzles />} />
            <Route path="scheduler" element={<Scheduler />} />
            <Route path="vault" element={<PuzzleVault />} />
            <Route path="validator" element={<PuzzleValidator />} />
            <Route path="dictionary" element={<Dictionary />} />
            <Route path="sessions" element={<PlayerSessions />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="flags" element={<FeatureFlags />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="config" element={<Configuration />} />
            <Route path="archive" element={<MorphArchive />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
