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
import MorphRush from "./pages/MorphRush";
import GridArchive from "./pages/GridArchive";
import MorphGrid from "./pages/MorphGrid";
import MorphAlibi from "./pages/MorphAlibi";
import Measured from "./pages/Measured";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PuzzleCenter from "./pages/admin/PuzzleCenter";
import PuzzleVault from "./pages/admin/PuzzleVault";
import PuzzleValidator from "./pages/admin/PuzzleValidator";
import Dictionary from "./pages/admin/Dictionary";
import WordFeedback from "./pages/admin/WordFeedback";
import PlayerSessions from "./pages/admin/PlayerSessions";
import Analytics from "./pages/admin/Analytics";
import MorphArchive from "./pages/admin/MorphArchive";
import MeasuredIntake from "./pages/admin/MeasuredIntake";
import MeasuredFactBank from "./pages/admin/MeasuredFactBank";
import MeasuredPuzzles from "./pages/admin/MeasuredPuzzles";
import MeasuredReview from "./pages/admin/MeasuredReview";
import MeasuredBatchReview from "./pages/admin/MeasuredBatchReview";
import Rules from "./pages/Rules";
import Kids from "./pages/Kids";
import Press from "./pages/Press";
import Privacy from "./pages/Privacy";
import ProfilePage from "./pages/ProfilePage";
import MorphCode from "./pages/MorphCode";
import MorphClash from "./pages/MorphClash";
import WhatsNew from "./pages/WhatsNew";
import { useVersionCheck } from "./hooks/useVersionCheck";
import { SnowfallOverlay } from "./components/seasonal/SnowfallOverlay";
import { PageTransition } from "./components/PageTransition";

const queryClient = new QueryClient();

const App = () => {
  useVersionCheck();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="morph-ui-theme">
        <TooltipProvider>
          <SnowfallOverlay />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<GameSelector />} />
              <Route path="/chain" element={<PageTransition><Index /></PageTransition>} />
              <Route path="/chain/archive" element={<PageTransition><ChainArchive /></PageTransition>} />
              <Route path="/grid" element={<PageTransition><MorphGrid /></PageTransition>} />
              <Route path="/grid/archive" element={<PageTransition><GridArchive /></PageTransition>} />
              <Route path="/rush" element={<PageTransition><MorphRush /></PageTransition>} />
              <Route path="/alibi" element={<PageTransition><MorphAlibi /></PageTransition>} />
              <Route path="/measured" element={<PageTransition><Measured /></PageTransition>} />
              <Route path="/morphcode" element={<PageTransition><MorphCode /></PageTransition>} />
              <Route path="/clash" element={<PageTransition><MorphClash /></PageTransition>} />
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
                <Route path="puzzles" element={<PuzzleCenter />} />
                <Route path="vault" element={<PuzzleVault />} />
                <Route path="validator" element={<PuzzleValidator />} />
                <Route path="dictionary" element={<Dictionary />} />
                <Route path="feedback" element={<WordFeedback />} />
                <Route path="sessions" element={<PlayerSessions />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="archive" element={<MorphArchive />} />
                <Route path="measured-intake" element={<MeasuredIntake />} />
                <Route path="measured-facts" element={<MeasuredFactBank />} />
                <Route path="measured-puzzles" element={<MeasuredPuzzles />} />
                <Route path="measured-review" element={<MeasuredReview />} />
                <Route path="measured-batch" element={<MeasuredBatchReview />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;