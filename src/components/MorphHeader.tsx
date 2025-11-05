import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, ChevronDown, Check, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { MorphChainTitle, MorphPrismTitle, MorphRushTitle, MorphGridTitle } from "@/components/GameTitles";
import morphIcon from "@/assets/morph-icon.png";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { ThemeToggle } from "@/components/ThemeToggle";

export const MorphHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const { hasBetaAccess } = useUserRole();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const isOnChain = location.pathname === '/chain';
  const isOnGrid = location.pathname === '/grid';
  const isOnPrism = location.pathname === '/prism';
  const isOnRush = location.pathname.startsWith('/rush');

  const games = [
    { 
      name: <MorphChainTitle className="text-sm" />,
      path: "/chain", 
      description: "Word ladder",
      active: isOnChain,
      locked: false
    },
    { 
      name: <MorphGridTitle className="text-sm" />,
      path: "/grid", 
      description: "Daily 5×5 puzzle",
      active: isOnGrid,
      locked: false
    },
    { 
      name: <MorphRushTitle className="text-sm" />,
      path: "/rush?mode=daily", 
      description: "Score dash",
      active: isOnRush,
      locked: false
    },
    { 
      name: <MorphPrismTitle className="text-sm" />,
      path: "/prism", 
      description: hasBetaAccess ? "Color puzzle" : "Coming soon",
      active: isOnPrism,
      locked: !hasBetaAccess
    },
  ];

  const utilityLinks = [
    { name: "What's New", path: "/whats-new" },
    { name: "Rules", path: "/rules" },
  ];

  const currentGame = games.find(game => game.active);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 md:h-18 items-center justify-between px-4 md:px-6">
        {/* Brand Wordmark with Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 md:gap-3 group transition-all duration-300"
        >
          <img 
            src={morphIcon}
            alt="" 
            aria-hidden="true"
            className="w-7 h-7 md:w-8 md:h-8 object-contain morph-gradient-animated rounded-sm"
            style={{
              animation: 'pulse-gradient 3s ease-in-out infinite'
            }}
          />
          <span 
            className="font-outfit font-bold text-lg md:text-xl tracking-tight morph-text-gradient-animated whitespace-nowrap"
            style={{ letterSpacing: '-0.02em' }}
          >
            MORPH GAMES
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {/* Games Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1">
                Games
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64 bg-popover z-50">
              {games.map((game) => (
                <DropdownMenuItem
                  key={game.path}
                  onClick={() => !game.locked && navigate(game.path)}
                  disabled={game.locked}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      {game.name}
                      {game.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {game.description}
                    </span>
                  </div>
                  {game.active && !game.locked && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Utility Links */}
          {utilityLinks.map((link) => (
            <Button
              key={link.path}
              variant="ghost"
              onClick={() => navigate(link.path)}
              className="text-sm"
            >
              {link.name}
            </Button>
          ))}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Auth Button */}
          {session ? (
            <Button
              onClick={() => navigate('/profile')}
              className="bg-[hsl(var(--morph-magenta))] hover:bg-[hsl(var(--morph-orange))] text-white rounded-2xl font-medium transition-all duration-300"
            >
              View Profile
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/login')}
              className="bg-[hsl(var(--morph-magenta))] hover:bg-[hsl(var(--morph-orange))] text-white rounded-2xl font-medium transition-all duration-300"
            >
              Log In
            </Button>
          )}
        </nav>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <nav className="flex flex-col gap-4 mt-8">
              {/* Games Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground px-2">
                  GAMES
                </h3>
                {games.map((game) => (
                  <button
                    key={game.path}
                    onClick={() => {
                      if (!game.locked) {
                        navigate(game.path);
                        setMobileMenuOpen(false);
                      }
                    }}
                    disabled={game.locked}
                    className="w-full text-left px-2 py-3 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          {game.name}
                          {game.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {game.description}
                        </span>
                      </div>
                      {game.active && !game.locked && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Utility Links Section */}
              <div className="space-y-2 pt-4 border-t border-border">
                {utilityLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => {
                      navigate(link.path);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
                  >
                    {link.name}
                  </button>
                ))}
              </div>

              {/* Theme Toggle */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex items-center justify-between px-2 py-3">
                  <span className="font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </div>

              {/* Auth Section */}
              <div className="space-y-2 pt-4 border-t border-border">
                {session ? (
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
                  >
                    View Profile
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-2 py-3 rounded-lg hover:bg-muted transition-colors font-medium"
                  >
                    Log In
                  </button>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
