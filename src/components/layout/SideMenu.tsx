import React from "react";

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
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
          <a className="hover:text-cyan-300" href="/arcade-survival">
            <span className="inline-block">Morph Chain: </span>
            <span className="inline-block bg-gradient-to-r from-[#FF6B35] to-[#F7931E] bg-clip-text text-transparent font-bold" style={{ 
              fontFamily: 'Impact, "Arial Black", sans-serif',
              letterSpacing: '0.05em'
            }}>ARCADE</span>
          </a>
          <a className="hover:text-cyan-300" href="/rush">Morph Rush</a>
          <a className="hover:text-cyan-300" href="/prism">Morph Prism</a>
        </nav>
      </aside>
    </div>
  );
}
