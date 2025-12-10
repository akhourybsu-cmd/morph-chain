import { useNavigate } from "react-router-dom";
import { getDailyPuzzle } from "@/lib/gameLogic";
import { formatInTimeZone } from "date-fns-tz";
import { Facebook, Instagram, Linkedin, MessageSquare, Share2, Link2, Zap, Grid3X3, Menu } from "lucide-react";
import { toast } from "sonner";
import morphIcon from "@/assets/morph-icon.png";
import { SideMenu } from "@/components/layout/SideMenu";
import { useState } from "react";

const GameSelector = () => {
  const navigate = useNavigate();
  const puzzle = getDailyPuzzle(4);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const timezone = "America/New_York";
  const formattedDate = formatInTimeZone(new Date(), timezone, 'MMMM d, yyyy');
  
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ background: 'hsl(var(--home-page-bg))' }}
    >
      <main className="flex-1 container mx-auto px-4 py-6 md:py-10 max-w-lg">
        {/* Masthead Card */}
        <div 
          className="rounded-xl p-4 md:p-6 mb-6"
          style={{ 
            background: 'hsl(var(--home-card-bg))',
            border: '1px solid hsl(var(--home-card-border))',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            {/* Logo */}
            <img src={morphIcon} alt="Morph" className="w-8 h-8" />
            
            {/* Title */}
            <h1 
              className="text-xl md:text-2xl font-bold tracking-wide"
              style={{ 
                fontFamily: "'Playfair Display', Georgia, serif",
                color: 'hsl(var(--home-text-primary))'
              }}
            >
              MORPH GAMES
            </h1>
            
            {/* Menu */}
            <button 
              onClick={() => setMenuOpen(true)}
              className="p-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Menu 
                className="w-5 h-5" 
                style={{ color: 'hsl(var(--home-text-muted))' }} 
              />
            </button>
          </div>
          
          {/* Tagline & Meta */}
          <div className="text-center">
            <p 
              className="text-sm md:text-base"
              style={{ color: 'hsl(var(--home-text-secondary))' }}
            >
              A letter changes everything.
            </p>
            <p 
              className="text-xs mt-1"
              style={{ color: 'hsl(var(--home-text-muted))' }}
            >
              {formattedDate} · Puzzle #{puzzle.puzzleIndex}
            </p>
          </div>
        </div>

        {/* Section Label */}
        <h2 
          className="text-xs font-semibold uppercase tracking-widest mb-3 px-1"
          style={{ color: 'hsl(var(--home-text-muted))' }}
        >
          Today's Puzzles
        </h2>

        {/* Games List */}
        <div className="space-y-3">
          <GameCard
            icon={Link2}
            name="Morph Chain"
            description="Transform words one letter at a time"
            onClick={() => navigate('/chain')}
          />
          
          <GameCard
            icon={Grid3X3}
            name="Morph Grid"
            description="Color-changing daily 5×5 word puzzle"
            onClick={() => navigate('/grid')}
          />
          
          <GameCard
            icon={Zap}
            name="Morph Rush"
            description="Fast-paced morphing under pressure"
            onClick={() => navigate('/rush?mode=daily')}
          />
        </div>

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
  onClick: () => void;
}

const GameCard = ({ icon: Icon, name, description, onClick }: GameCardProps) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 md:p-5 rounded-xl text-left transition-all duration-200 group"
      style={{ 
        background: 'hsl(var(--home-card-bg))',
        border: '1px solid hsl(var(--home-card-border))',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--home-accent))';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--home-card-border))';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)';
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h3 
            className="font-semibold text-base md:text-lg"
            style={{ 
              fontFamily: "Inter, system-ui, sans-serif",
              color: 'hsl(var(--home-text-primary))'
            }}
          >
            {name}
          </h3>
          <p 
            className="text-sm mt-0.5"
            style={{ color: 'hsl(var(--home-text-secondary))' }}
          >
            {description}
          </p>
        </div>
        
        {/* Icon */}
        <Icon 
          className="w-5 h-5 flex-shrink-0" 
          style={{ color: 'hsl(var(--home-text-muted))' }}
        />
        
        {/* Play arrow */}
        <span 
          className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'hsl(var(--home-accent))' }}
        >
          Play →
        </span>
      </div>
    </button>
  );
};

const ShareFooter = () => {
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
    <div 
      className="mt-6 rounded-xl p-4 md:p-5"
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
          const Icon = social.icon;
          return (
            <button
              key={social.platform}
              onClick={() => handleShare(social.platform)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
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
              <Icon 
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
