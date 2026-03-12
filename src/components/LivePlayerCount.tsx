import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function LivePlayerCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: c, error } = await supabase
        .from("active_sessions")
        .select("*", { count: "exact", head: true })
        .gte("last_activity_at", fiveMinAgo);

      if (mounted && !error && c !== null) {
        setCount(c);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (count === null || count === 0) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs"
      style={{ color: "hsl(var(--home-text-muted))" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: "hsl(142 70% 45%)" }}
      />
      {count} playing now
    </span>
  );
}
