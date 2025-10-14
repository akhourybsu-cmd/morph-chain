import React from "react";

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-foreground">Morph Games</div>
          <button onClick={onClose} className="p-2 rounded-md text-muted-foreground hover:bg-muted">
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-2 text-foreground">
          <a className="hover:text-primary transition-colors" href="/chain">
            Morph Chain (Classic)
          </a>
          <a className="hover:text-primary transition-colors" href="/arcade">
            Morph Chain: Arcade (Timed)
          </a>
          <a className="hover:text-primary transition-colors" href="/arcade-survival">
            Morph Chain: Arcade (Survival)
          </a>
          <a className="hover:text-primary transition-colors" href="/rush">
            Morph Rush
          </a>
          <a className="hover:text-primary transition-colors" href="/prism">
            Morph Prism
          </a>
        </nav>
      </aside>
    </div>
  );
}
