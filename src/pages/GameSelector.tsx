import { useNavigate } from "react-router-dom";
import { getDailyPuzzle } from "@/lib/gameLogic";
import { formatInTimeZone } from "date-fns-tz";
import { Facebook, Instagram, Linkedin, MessageSquare, Share2, Link2, Zap, Grid3X3, Search, Menu, ChevronRight, User, Snowflake, Gift, Target, Swords } from "lucide-react";
import { toast } from "sonner";
import { SideMenu } from "@/components/layout/SideMenu";
import { useState, useEffect } from "react";
import { PrestigeThemeToggle } from "@/components/shared/PrestigeThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { isChristmas } from "@/lib/seasonal/christmas";
import { DailyProgressTracker } from "@/components/DailyProgressTracker";


// Per-game accent colors (HSL values match CSS variables)
const gameAccents = {
  chain: "187 94% 48%",  // cyan
  grid: "186 68% 36%",   // teal  
  rush: "24 78% 57%",    // orange
  alibi: "40 75% 50%",   // gold
  measured: "220 70% 50%", // blue
};

// Christmas accent colors
const christmasAccents = {
  chain: "142 70% 45%",  // green
  grid: "0 75% 50%",     // red
  rush: "45 90% 50%",    // gold
  alibi: "142 70% 45%",  // green
  measured: "220 70% 50%", // blue (same)
};

const GameSelector = () => {
  const navigate = useNavigate();
  const puzzle = getDailyPuzzle(4);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const christmas = isChristmas();
  
  // Use Christmas colors on Dec 25
  const accents = christmas ? christmasAccents : gameAccents;
  
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  const timezone = "America/New_York";
  const formattedDate = formatInTimeZone(new Date(), timezone, 'MMMM d, yyyy');
  
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ background: 'hsl(var(--home-page-bg))' }}
    >
      {/* Header Bar */}
      <header 
        className="h-14 flex items-center justify-between px-4"
        style={{ borderBottom: '1px solid hsl(var(--home-divider))' }}
      >
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setMenuOpen(true)}
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Menu 
              className="w-5 h-5" 
              style={{ color: 'hsl(var(--home-text-muted))' }} 
            />
          </button>
          <PrestigeThemeToggle colorVar="--home-text-muted" />
        </div>
        <div className="flex-1" /> {/* Center spacer */}
        <button 
          onClick={() => navigate(isLoggedIn ? '/profile' : '/login')}
          className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          title={isLoggedIn ? 'My Account' : 'Sign In'}
        >
          <User 
            className="w-5 h-5" 
            style={{ color: 'hsl(var(--home-text-muted))' }} 
          />
        </button>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-10 max-w-xl">
        {/* Christmas Banner */}
        {christmas && (
          <div 
            className="mb-6 py-3 px-4 rounded-xl text-center animate-fade-in"
            style={{
              background: 'linear-gradient(135deg, hsl(0 75% 50% / 0.15), hsl(142 70% 45% / 0.15))',
              border: '1px solid hsl(0 75% 50% / 0.3)',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Snowflake className="w-4 h-4 text-[hsl(187,94%,48%)]" />
              <span 
                className="font-playfair text-lg font-semibold"
                style={{ 
                  background: 'linear-gradient(90deg, hsl(0,75%,50%), hsl(142,70%,45%), hsl(45,90%,50%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Merry Christmas!
              </span>
              <Gift className="w-4 h-4 text-[hsl(0,75%,50%)]" />
            </div>
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--home-text-muted))' }}>
              Enjoy today's festive puzzles 🎄
            </p>
          </div>
        )}

        {/* Centered Masthead */}
        <div className="text-center mb-8">
          <h1 
            className="font-playfair text-3xl md:text-4xl font-bold tracking-tight mb-3"
            style={{ letterSpacing: '-0.02em' }}
          >
            <span style={{ color: 'hsl(var(--home-text-primary))' }}>
              MORPH
            </span>
            {' '}
            <span 
              style={{ 
                background: christmas 
                  ? 'linear-gradient(90deg, hsl(0,75%,50%), hsl(142,70%,45%), hsl(45,90%,50%))'
                  : 'linear-gradient(90deg, hsl(var(--accent-chain)), hsl(var(--accent-grid)), hsl(var(--accent-rush)))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              GAMES
            </span>
          </h1>
          
          <p 
            className="text-base md:text-lg italic"
            style={{ 
              color: 'hsl(var(--home-text-secondary))',
              fontFamily: "'Playfair Display', Georgia, serif"
            }}
          >
            {christmas ? "Joy to the morphs!" : "A letter changes everything."}
          </p>
          
          <p 
            className="text-xs mt-2"
            style={{ color: 'hsl(var(--home-text-muted))' }}
          >
            {formattedDate} · Puzzle #{puzzle.puzzleIndex}
          </p>
        </div>

        {/* Section Label */}
        <h2 
          className="text-xs font-semibold uppercase tracking-widest mb-3 px-1 max-w-[640px] mx-auto"
          style={{ color: 'hsl(var(--home-text-muted))' }}
        >
          {christmas ? "🎁 Today's Festive Puzzles" : "Today's Puzzles"}
        </h2>

        {/* Games List */}
        <div className="space-y-3 max-w-[640px] mx-auto">
          <GameCard
            icon={Link2}
            name="Morph Chain"
            description="Transform words one letter at a time"
            accent={accents.chain}
            onClick={() => navigate('/chain')}
            christmas={christmas}
          />
          
          <GameCard
            icon={Grid3X3}
            name="Morph Grid"
            description="Color-changing daily 5×5 word puzzle"
            accent={accents.grid}
            onClick={() => navigate('/grid')}
            christmas={christmas}
          />
          
          <GameCard
            icon={Zap}
            name="Morph Rush"
            description="Fast-paced morphing under pressure"
            accent={accents.rush}
            onClick={() => navigate('/rush?mode=daily')}
            christmas={christmas}
          />
          
          {/* Alibi - Public with Beta tag */}
          <GameCard
            icon={Search}
            name="Morph Alibi"
            description="Daily logic mystery puzzle"
            accent={accents.alibi}
            onClick={() => navigate('/alibi')}
            badge="Beta"
            christmas={christmas}
          />
          
          {/* Measured - New */}
          <GameCard
            icon={Target}
            name="Measured"
            description="Match real-world numbers"
            accent={accents.measured}
            onClick={() => navigate('/measured')}
            badge="New"
            christmas={christmas}
          />
        </div>

        {/* Daily Progress Tracker */}
        <DailyProgressTracker />

        {/* Share Footer */}
        <ShareFooter />
      </main>

      {/* Footer */}
      <footer 
        className="py-6 mt-auto"
        style={{ borderTop: '1px solid hsl(var(--home-divider))' }}
      >
        <div 
          className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm"
          style={{ color: 'hsl(var(--home-text-muted))' }}
        >
          <span>© 2025 Morph Games</span>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/rules')} 
              className="transition-colors"
              style={{ color: 'hsl(var(--home-text-muted))' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--home-text-primary))'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--home-text-muted))'}
            >
              Rules
            </button>
            <button 
              onClick={() => navigate('/privacy')} 
              className="transition-colors"
              style={{ color: 'hsl(var(--home-text-muted))' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'hsl(var(--home-text-primary))'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'hsl(var(--home-text-muted))'}
            >
              Privacy
            </button>
          </div>
        </div>
      </footer>

      {/* Side Menu */}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

interface GameCardProps {
  icon: React.ElementType;
  name: string;
  description: string;
  accent: string;
  onClick: () => void;
  badge?: string;
  christmas?: boolean;
}

const GameCard = ({ icon: Icon, name, description, accent, onClick, badge, christmas }: GameCardProps) => {
  // Extract the game word (e.g., "Chain" from "Morph Chain")
  const gameWord = name.replace('Morph ', '');
  
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl text-left transition-all duration-200 group overflow-hidden relative ${christmas ? 'animate-christmas-card-glow' : ''}`}
      style={{ 
        background: 'hsl(var(--home-card-bg))',
        border: christmas ? '1px solid hsl(0 75% 50% / 0.4)' : '1px solid hsl(var(--home-card-border))',
        boxShadow: christmas 
          ? '0 4px 12px rgba(0, 0, 0, 0.04), 0 0 20px hsl(0 75% 50% / 0.1)'
          : '0 4px 12px rgba(0, 0, 0, 0.04)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `hsl(${accent})`;
        e.currentTarget.style.boxShadow = christmas 
          ? `0 6px 16px rgba(0, 0, 0, 0.08), 0 0 24px hsl(${accent} / 0.3)`
          : '0 6px 16px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = christmas ? 'hsl(0 75% 50% / 0.4)' : 'hsl(var(--home-card-border))';
        e.currentTarget.style.boxShadow = christmas 
          ? '0 4px 12px rgba(0, 0, 0, 0.04), 0 0 20px hsl(0 75% 50% / 0.1)'
          : '0 4px 12px rgba(0, 0, 0, 0.04)';
      }}
    >
      {/* Left accent strip - alternating red/green for Christmas */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ 
          background: christmas 
            ? 'linear-gradient(to bottom, hsl(0, 75%, 50%), hsl(142, 70%, 45%))'
            : `hsl(${accent})`,
          opacity: christmas ? 1 : 'var(--accent-strip-opacity, 0.15)'
        }}
      />
      
      <div className="flex items-center gap-3 p-4 md:p-5 pl-5 md:pl-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 
              className="font-playfair font-semibold text-lg md:text-xl tracking-tight flex items-center gap-2"
              style={{ letterSpacing: '-0.01em' }}
            >
              <span>
                <span style={{ color: 'hsl(var(--home-text-primary))' }}>
                  Morph
                </span>
                {' '}
                <span style={{ color: `hsl(${accent})` }}>
                  {gameWord}
                </span>
              </span>
              {badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  {badge}
                </span>
              )}
            </h3>
          </div>
          <p 
            className="text-sm truncate mt-0.5"
            style={{ color: 'hsl(var(--home-text-secondary))' }}
          >
            {description}
          </p>
        </div>
        
        {/* Icon chip */}
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
          style={{ 
            background: `hsl(${accent} / 0.1)`,
          }}
        >
          <Icon 
            className="w-4 h-4" 
            style={{ color: `hsl(${accent})` }}
          />
        </div>
        
        {/* Chevron */}
        <ChevronRight 
          className="w-4 h-4 flex-shrink-0 opacity-40 group-hover:opacity-70 transition-opacity" 
          style={{ color: 'hsl(var(--home-text-muted))' }}
        />
      </div>
    </button>
  );
};

const ShareFooter = () => {
  const shareUrl = "https://morphchaingame.com";
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
    <div 
      className="mt-6 rounded-xl p-4 md:p-5 max-w-[640px] mx-auto"
      style={{ 
        background: 'hsl(var(--home-card-bg))',
        border: '1px solid hsl(var(--home-card-border))',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div className="text-center mb-4">
        <h3 
          className="font-semibold text-base"
          style={{ color: 'hsl(var(--home-text-primary))' }}
        >
          Share the Morph.
        </h3>
        <p 
          className="text-xs mt-1"
          style={{ color: 'hsl(var(--home-text-muted))' }}
        >
          Spread the word about Morph Games
        </p>
      </div>
      
      {/* Circular outline icons */}
      <div className="flex justify-center gap-3">
        {socialIcons.map((social) => {
          const SocialIcon = social.icon;
          return (
            <button
              key={social.platform}
              onClick={() => handleShare(social.platform)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ 
                border: '1px solid hsl(var(--home-divider))'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--home-accent))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--home-divider))';
              }}
              title={social.name}
            >
              <SocialIcon 
                className="w-4 h-4" 
                style={{ color: 'hsl(var(--home-text-secondary))' }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GameSelector;
