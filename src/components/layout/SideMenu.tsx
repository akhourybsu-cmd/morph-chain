import { X } from "lucide-react";
import { GamesNavigation } from "@/components/shared/GamesNavigation";
import { Separator } from "@/components/ui/separator";

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <aside 
        className="absolute left-0 top-0 h-full w-80 p-4 overflow-y-auto"
        style={{ 
          background: 'hsl(var(--home-card-bg))',
          borderRight: '1px solid hsl(var(--home-card-border))'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="font-serif font-semibold"
            style={{ color: 'hsl(var(--home-text-primary))' }}
          >
            Menu
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'hsl(var(--home-text-muted))' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--home-divider))'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-5">
          <GamesNavigation currentGame="chain" onNavigate={onClose} />
          
          <Separator style={{ background: 'hsl(var(--home-divider))' }} />
          
          <p 
            className="text-xs px-2"
            style={{ color: 'hsl(var(--home-text-muted))' }}
          >
            More features coming soon
          </p>
        </div>
      </aside>
    </div>
  );
}
