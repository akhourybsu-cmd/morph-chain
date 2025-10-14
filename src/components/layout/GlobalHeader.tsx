import React from "react";

export function GlobalHeader({
  onOpenMenu,
  onOpenHelp,
}: {
  onOpenMenu: () => void;
  onOpenHelp: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border">
      <div className="max-w-screen-sm mx-auto px-4 h-14 flex items-center justify-between">
        <button
          aria-label="Open menu"
          onClick={onOpenMenu}
          className="p-2 rounded-md text-muted-foreground hover:bg-muted"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        <a href="/" className="font-outfit font-black tracking-tight text-foreground">
          MORPH CHAIN
          <span className="ml-2 px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs font-extrabold">
            ARCADE
          </span>
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHelp}
            className="px-2 py-1 rounded-md text-muted-foreground hover:bg-muted text-sm"
          >
            How to Play
          </button>
          <a
            href="/login"
            className="px-3 py-1 rounded-md bg-muted text-foreground text-sm hover:bg-muted/80"
          >
            Log in
          </a>
        </div>
      </div>
    </header>
  );
}
