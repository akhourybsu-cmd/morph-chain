import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDailyPuzzle } from "@/lib/gameLogic";
import { formatInTimeZone } from "date-fns-tz";
import { MorphHeader } from "@/components/MorphHeader";
import { MorphPrismTitle } from "@/components/GameTitles";
import { hasCompletedFirstDailyAttempt } from "@/lib/rushStorage";
import { Facebook, Instagram, Linkedin, MessageSquare, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const GameSelector = () => {
  const navigate = useNavigate();
  const puzzle = getDailyPuzzle(4);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const timezone = "America/New_York";
  const formattedDate = formatInTimeZone(new Date(), timezone, 'MMMM d, yyyy');
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    getUser();
  }, []);
  
  const isPrismAccessGranted = userEmail === "akhourybsu@gmail.com";
  
  return (
    <div className="min-h-screen flex flex-col">
      <MorphHeader />
      
      <main className="flex-1 container mx-auto px-4 max-w-6xl">
        {/* Hero Section - Mobile Optimized */}
        <section className="py-3 md:py-8 mb-8 md:mb-12">
          <div className="space-y-1 md:space-y-3">
            <h1 className="font-outfit font-bold text-2xl md:text-4xl tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                MORPH GAMES
              </span>
            </h1>
            <p className="text-base md:text-lg text-foreground font-medium">
              A letter changes everything.
            </p>
            <div className="flex items-center gap-2 text-sm md:text-base text-muted-foreground font-medium pt-2">
              <span>{formattedDate}</span>
              <span>•</span>
              <span>Puzzle #{puzzle.puzzleIndex}</span>
            </div>
          </div>
        </section>

        {/* Game Cards Grid - 2x2 Layout (Mobile & Desktop) */}
        <section className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-3 md:gap-6">
            {/* Top Row */}
            <GameCard
              title="Morph Chain"
              description="Change one letter each step to reach today's goal"
              mode="Word ladder"
              difficulty="Moderate"
              avgTime="3-5 min"
              accent="chain"
              motif="chain-links"
              onClick={() => navigate('/chain')}
            />
            
            <GameCard
              title="Morph Rush"
              description="Make as many 4-letter morphs as you can in 2 minutes"
              mode="Score dash"
              difficulty="Fast-paced"
              avgTime="2 min"
              accent="rush"
              motif="motion"
              onClick={() => navigate('/rush?mode=daily')}
              secondaryAction={hasCompletedFirstDailyAttempt() ? {
                label: "Practice Mode",
                onClick: () => navigate('/rush?mode=practice')
              } : undefined}
            />
            
            {/* Bottom Row */}
            <GameCard
              title="Morph Prism"
              description="Decode the word through chromatic color clues"
              mode="Color puzzle"
              difficulty="Challenging"
              avgTime="4-6 min"
              accent="prism"
              motif="spectrum"
              comingSoon={!isPrismAccessGranted}
              onClick={() => navigate('/prism')}
            />

            <ShareCard />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2025 Morph Games</span>
          <div className="flex gap-4">
            <button onClick={() => navigate('/rules')} className="hover:text-foreground transition-colors">
              Rules
            </button>
            <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">
              Privacy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface GameCardProps {
  title: string;
  description: string;
  mode: string;
  difficulty: string;
  avgTime: string;
  accent: 'chain' | 'prism' | 'rush';
  motif: 'chain-links' | 'spectrum' | 'motion';
  comingSoon?: boolean;
  onClick: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const GameCard = ({ 
  title, 
  description, 
  mode, 
  difficulty, 
  avgTime, 
  accent, 
  motif,
  comingSoon,
  onClick, 
  secondaryAction 
}: GameCardProps) => {
  const navigate = useNavigate();
  const accentClasses = {
    chain: "border-chain/30 hover:border-chain hover:shadow-lg hover:shadow-chain/20",
    prism: "border-primary/30 hover:border-primary hover:shadow-lg hover:shadow-primary/20",
    rush: "border-rush-start/30 hover:border-rush-start hover:shadow-lg hover:shadow-rush-start/20"
  };

  const motifPatterns = {
    'chain-links': (
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="50" cy="20" r="15" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="35" cy="50" r="15" stroke="currentColor" strokeWidth="3" fill="none" />
        </svg>
      </div>
    ),
    'spectrum': (
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-prism" style={{ 
          background: 'linear-gradient(135deg, hsl(var(--prism-accent-start)), hsl(var(--prism-accent-mid)), hsl(var(--prism-accent-end)))'
        }} />
      </div>
    ),
    'motion': (
      <div className="absolute top-4 right-4 opacity-10">
        <svg width="80" height="40" viewBox="0 0 80 40">
          <line x1="0" y1="10" x2="60" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="10" y1="20" x2="70" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="5" y1="30" x2="65" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    )
  };

  return (
    <Card 
      className={`relative p-3 md:p-6 border-2 transition-all group overflow-hidden ${accentClasses[accent]} ${comingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`} 
      onClick={comingSoon ? undefined : onClick}
    >
      {comingSoon && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20 px-2 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 rounded-md text-xs font-semibold">
          Coming Soon
        </div>
      )}
      {motifPatterns[motif]}
      
      <div className="relative z-10 space-y-2 md:space-y-4">
        <div className="space-y-1 md:space-y-2">
          {accent === 'chain' && (
            <h2 className="font-outfit font-bold text-base md:text-2xl tracking-tight bg-gradient-to-r from-chain to-chain bg-clip-text text-transparent">
              MORPH CHAIN
            </h2>
          )}
          {accent === 'prism' && (
            <h2 className="font-outfit font-bold text-base md:text-2xl tracking-tight bg-gradient-to-r from-[hsl(var(--prism-accent-start))] via-[hsl(var(--prism-accent-mid))] to-[hsl(var(--prism-accent-end))] bg-clip-text text-transparent">
              MORPH PRISM
            </h2>
          )}
          {accent === 'rush' && (
            <h2 className="font-outfit font-bold text-base md:text-2xl tracking-tight bg-gradient-rush bg-clip-text text-transparent" style={{ fontStyle: 'italic' }}>
              MORPH RUSH
            </h2>
          )}
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed hidden md:block">
            {description}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-1 md:gap-2">
          <span className="px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-medium bg-muted rounded-md">
            {mode}
          </span>
          <span className="px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-medium bg-muted rounded-md hidden md:inline-block">
            {avgTime}
          </span>
          <span className="px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-medium bg-muted rounded-md hidden md:inline-block">
            {difficulty}
          </span>
        </div>

        <div className="flex gap-2 pt-1 md:pt-2">
          <Button 
            className="flex-1 h-8 md:h-10 text-xs md:text-sm"
            disabled={comingSoon}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <span className="md:hidden">Play</span>
            <span className="hidden md:inline">Play Today</span>
          </Button>
        </div>

        {secondaryAction && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-7 md:h-9 text-xs"
            disabled={comingSoon}
            onClick={(e) => {
              e.stopPropagation();
              secondaryAction.onClick();
            }}
          >
            <span className="md:hidden">Practice</span>
            <span className="hidden md:inline">{secondaryAction.label}</span>
          </Button>
        )}

        <button 
          className="text-[10px] md:text-xs text-muted-foreground hover:text-foreground transition-colors underline disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={comingSoon}
          onClick={(e) => {
            e.stopPropagation();
            navigate('/rules');
          }}
        >
          <span className="md:hidden">Rules</span>
          <span className="hidden md:inline">How to play</span>
        </button>
      </div>
    </Card>
  );
};

const ShareCard = () => {
  const shareUrl = window.location.origin;
  const shareText = "Check out Morph Games - A letter changes everything!";

  const handleShare = (platform: string) => {
    let url = "";
    
    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case "instagram":
        toast.info("Copy the link and share it on Instagram!");
        navigator.clipboard.writeText(shareUrl);
        return;
      case "sms":
        url = `sms:?&body=${encodeURIComponent(shareText + " " + shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, "_blank", "width=600,height=400");
    }
  };

  const socialIcons = [
    { name: "Facebook", icon: Facebook, platform: "facebook", color: "hover:text-[#1877F2]" },
    { name: "X/Twitter", icon: Share2, platform: "twitter", color: "hover:text-[#1DA1F2]" },
    { name: "LinkedIn", icon: Linkedin, platform: "linkedin", color: "hover:text-[#0A66C2]" },
    { name: "Instagram", icon: Instagram, platform: "instagram", color: "hover:text-[#E4405F]" },
    { name: "Text/SMS", icon: MessageSquare, platform: "sms", color: "hover:text-accent" },
  ];

  return (
    <Card className="relative p-3 md:p-6 border-2 transition-all group overflow-hidden border-primary/30 hover:border-primary hover:shadow-lg hover:shadow-primary/20">
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-gradient-to-br from-primary via-accent to-secondary" />
      </div>
      
      <div className="relative z-10 h-full flex flex-col">
        <div className="space-y-1 md:space-y-2 mb-3 md:mb-6">
          <h2 className="font-outfit font-bold text-base md:text-2xl tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            SHARE
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed hidden md:block">
            Spread the word about Morph Games
          </p>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-2 md:gap-4 w-full">
            {socialIcons.map((social) => {
              const Icon = social.icon;
              return (
                <button
                  key={social.platform}
                  onClick={() => handleShare(social.platform)}
                  className={`flex flex-col items-center gap-1 md:gap-2 p-1.5 md:p-3 rounded-lg hover:bg-accent/10 transition-all group/icon ${social.color}`}
                >
                  <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center group-hover/icon:scale-110 transition-transform">
                    <Icon className="w-3.5 h-3.5 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[9px] md:text-xs font-medium text-center leading-tight">
                    {social.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GameSelector;
