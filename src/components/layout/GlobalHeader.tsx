import React from "react";

export function GlobalHeader({
  onOpenMenu,
  onOpenHelp,
  titleRightBadge,
}: {
  onOpenMenu: () => void;
  onOpenHelp: () => void;
  titleRightBadge?: string;
}) {
  return (
    <header className="sticky top-0 z-40 bg-[#0B1E26]/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-screen-sm mx-auto px-4 h-14 flex items-center justify-between">
        <button
          aria-label="Open menu"
          onClick={onOpenMenu}
          className="p-2 rounded-md text-slate-300 hover:bg-slate-800"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        <a href="/" className="font-black tracking-wide text-slate-100">
          MORPH CHAIN
          {titleRightBadge && (
            <span className="ml-2 px-2 py-0.5 rounded bg-cyan-400 text-slate-900 text-xs font-extrabold">
              {titleRightBadge}
            </span>
          )}
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHelp}
            className="px-2 py-1 rounded-md text-slate-300 hover:bg-slate-800 text-sm"
          >
            How to Play
          </button>
          <a
            href="/login"
            className="px-3 py-1 rounded-md bg-slate-800 text-slate-100 text-sm hover:ring-1 hover:ring-slate-700"
          >
            Log in
          </a>
        </div>
      </div>
    </header>
  );
}
