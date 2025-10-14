import { useNavigate } from "react-router-dom";
import { getDailyPuzzle } from "@/lib/gameLogic";
import { formatInTimeZone } from "date-fns-tz";
import { MorphHeader } from "@/components/MorphHeader";
import { MorphChainTitle, MorphPrismTitle, MorphRushTitle, MorphArcadeTitle } from "@/components/GameTitles";
import { Facebook, Instagram, Linkedin, MessageSquare, Share2, Link2, Palette, Zap, Gamepad2 } from "lucide-react";
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
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* Hero Section */}
        <section className="text-center mb-12 md:mb-16">
          <h1 className="font-outfit font-bold text-3xl md:text-5xl tracking-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              MORPH GAMES
            </span>
          </h1>
          <p className="text-lg md:text-xl text-foreground font-medium mb-2">
            A letter changes everything.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm md:text-base text-muted-foreground font-medium">
            <span>{formattedDate}</span>
            <span>•</span>
            <span>Puzzle #{puzzle.puzzleIndex}</span>
          </div>
        </section>

        {/* Full-Width Game Banners */}
        <section className="space-y-4 md:space-y-6">
          <GameBanner
            game="chain"
            title={<MorphChainTitle className="text-2xl md:text-4xl" />}
            description="Transform words one letter at a time"
            onClick={() => navigate('/chain')}
          />
          
          <GameBanner
            game="arcade"
            title={<MorphArcadeTitle className="text-2xl md:text-4xl" />}
            description="Survival mode - manage your chain stability"
            onClick={() => navigate('/arcade-survival')}
          />
          
          <GameBanner
            game="rush"
            title={<MorphRushTitle className="text-2xl md:text-4xl px-4" />}
            description="Fast-paced morphing under pressure"
            onClick={() => navigate('/rush?mode=daily')}
          />
          
          <GameBanner
            game="prism"
            title={<MorphPrismTitle className="text-2xl md:text-4xl" />}
            description="Decode words through chromatic clues"
            onClick={() => navigate('/prism')}
            comingSoon={!isPrismAccessGranted}
          />

          <ShareBanner />
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

interface GameBannerProps {
  game: 'chain' | 'prism' | 'rush' | 'arcade';
  title: React.ReactNode;
  description: string;
  onClick: () => void;
  comingSoon?: boolean;
}

const GameBanner = ({ game, title, description, onClick, comingSoon }: GameBannerProps) => {
  const gradientClasses = {
    chain: "from-[hsl(var(--chain-accent)_/_0.15)] to-[hsl(var(--chain-accent)_/_0.05)]",
    arcade: "from-[#FF6B35]/15 to-[#F7931E]/15",
    prism: "from-[hsl(var(--prism-accent-start)_/_0.15)] via-[hsl(var(--prism-accent-mid)_/_0.10)] to-[hsl(var(--prism-accent-end)_/_0.15)]",
    rush: "from-[hsl(var(--rush-accent-start)_/_0.15)] to-[hsl(var(--rush-accent-end)_/_0.15)]"
  };

  const glowClasses = {
    chain: "hover:shadow-[0_0_40px_hsl(var(--chain-accent)_/_0.3),0_0_80px_hsl(var(--chain-accent)_/_0.15)]",
    arcade: "hover:shadow-[0_0_40px_rgba(255,107,53,0.3),0_0_80px_rgba(255,107,53,0.15)]",
    prism: "hover:shadow-[0_0_40px_hsl(var(--prism-accent-mid)_/_0.3),0_0_80px_hsl(var(--prism-accent-mid)_/_0.15)]",
    rush: "hover:shadow-[0_0_40px_hsl(var(--rush-accent-start)_/_0.3),0_0_80px_hsl(var(--rush-accent-start)_/_0.15)]"
  };

  const borderClasses = {
    chain: "border-[hsl(var(--chain-accent)_/_0.3)] hover:border-[hsl(var(--chain-accent)_/_0.6)]",
    arcade: "border-[#FF6B35]/30 hover:border-[#FF6B35]/60",
    prism: "border-[hsl(var(--prism-accent-mid)_/_0.3)] hover:border-[hsl(var(--prism-accent-mid)_/_0.6)]",
    rush: "border-[hsl(var(--rush-accent-start)_/_0.3)] hover:border-[hsl(var(--rush-accent-start)_/_0.6)]"
  };

  const iconConfig = {
    chain: { Icon: Link2, color: "hsl(var(--chain))" },
    arcade: { Icon: Gamepad2, color: "#FF6B35" },
    prism: { Icon: Palette, color: "hsl(var(--prism))" },
    rush: { Icon: Zap, color: "hsl(var(--rush))" }
  };

  const { Icon, color } = iconConfig[game];

  return (
    <button
      onClick={comingSoon ? undefined : onClick}
      disabled={comingSoon}
      className={`
        relative w-full py-6 md:py-8 px-6 md:px-12 
        rounded-xl border-2 
        bg-gradient-to-r ${gradientClasses[game]}
        ${borderClasses[game]}
        shadow-lg hover:shadow-xl
        transition-all duration-300 ease-out
        group
        overflow-hidden
        ${comingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01]'}
      `}
    >
      {/* Background Icon */}
      <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
        <Icon 
          className="w-24 h-24 md:w-32 md:h-32" 
          style={{ color }}
          strokeWidth={1.5}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-2 md:gap-3">
        {comingSoon && (
          <div className="absolute -top-8 md:-top-10 px-4 py-1.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 rounded-full text-xs md:text-sm font-semibold">
            Coming Soon
          </div>
        )}
        
        <div className="text-center w-full">
          {title}
        </div>
        
        <p className="text-sm md:text-base text-muted-foreground font-medium max-w-2xl">
          {description}
        </p>
      </div>
    </button>
  );
};

const ShareBanner = () => {
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
    { name: "Facebook", icon: Facebook, platform: "facebook" },
    { name: "X", icon: Share2, platform: "twitter" },
    { name: "LinkedIn", icon: Linkedin, platform: "linkedin" },
    { name: "Instagram", icon: Instagram, platform: "instagram" },
    { name: "Text", icon: MessageSquare, platform: "sms" },
  ];

  return (
    <div className="relative w-full py-6 md:py-8 px-6 md:px-12 rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 overflow-hidden hover:border-primary/60 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="relative z-10 flex flex-col items-center justify-center gap-4 md:gap-5">
        <div className="text-center">
          <h2 className="font-outfit font-bold text-2xl md:text-4xl tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2" style={{ letterSpacing: '-0.02em' }}>
            Share the Morph.
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            Spread the word about Morph Games
          </p>
        </div>
        
        <div className="flex gap-4 md:gap-6 flex-wrap justify-center">
          {socialIcons.map((social) => {
            const Icon = social.icon;
            return (
              <button
                key={social.platform}
                onClick={() => handleShare(social.platform)}
                className="flex flex-col items-center gap-2 group/icon"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center hover:bg-primary/30 hover:border-primary/50 hover:scale-110 transition-all duration-200">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover/icon:text-foreground transition-colors">
                  {social.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameSelector;
