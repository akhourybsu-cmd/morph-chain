import React from "react";
import { MorphArcadeTitle } from "@/components/GameTitles";
import { useUserRole } from "@/hooks/useUserRole";
import { Lock } from "lucide-react";

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { hasBetaAccess } = useUserRole();
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-72 bg-slate-900 border-r border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-slate-100">Morph Games</div>
          <button onClick={onClose} className="p-2 rounded-md text-slate-300 hover:bg-slate-800">
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-2 text-slate-200">
          <a className="hover:text-cyan-300" href="/">Morph Chain (Classic)</a>
          {hasBetaAccess ? (
            <a className="hover:text-cyan-300" href="/arcade-survival">
              <MorphArcadeTitle />
            </a>
          ) : (
            <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
              <MorphArcadeTitle />
              <Lock className="h-3 w-3" />
              <span className="text-xs">(Coming Soon)</span>
            </div>
          )}
          <a className="hover:text-cyan-300" href="/rush">Morph Rush</a>
        </nav>
      </aside>
    </div>
  );
}
