import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const AddToHomeScreen = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Android: Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS: Check if it's iOS and not installed
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode) {
      setShowButton(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowButton(false);
      }
      
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || !showButton) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="gap-2 border-[hsl(var(--chain-card-border))] text-[hsl(var(--chain-text-secondary))] hover:bg-[hsl(var(--chain-pill-bg))]"
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>

      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent 
          className="sm:max-w-md bg-[hsl(var(--chain-card-bg))] border-[hsl(var(--chain-card-border))]"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
        >
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl text-[hsl(var(--chain-text-primary))]">
              Add to Home Screen
            </DialogTitle>
            <DialogDescription className="text-[hsl(var(--chain-text-secondary))]">
              Install Morph Chain for quick access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--chain-accent))]/10">
                <span className="text-lg font-semibold text-[hsl(var(--chain-accent))]">1</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[hsl(var(--chain-text-primary))]">Tap the Share button</p>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--chain-text-muted))]">
                  <Share className="h-4 w-4" />
                  <span>in your browser's toolbar</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--chain-accent))]/10">
                <span className="text-lg font-semibold text-[hsl(var(--chain-accent))]">2</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[hsl(var(--chain-text-primary))]">Select "Add to Home Screen"</p>
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--chain-text-muted))]">
                  <Download className="h-4 w-4" />
                  <span>from the menu</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--chain-accent))]/10">
                <span className="text-lg font-semibold text-[hsl(var(--chain-accent))]">3</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[hsl(var(--chain-text-primary))]">Tap "Add"</p>
                <p className="text-sm text-[hsl(var(--chain-text-muted))]">
                  The app will appear on your home screen
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={() => setShowIOSInstructions(false)} 
            className="w-full bg-[hsl(var(--chain-accent))] hover:bg-[hsl(var(--chain-accent))]/90 text-white"
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
