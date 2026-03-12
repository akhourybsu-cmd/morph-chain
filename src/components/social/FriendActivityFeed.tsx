import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFriendActivity, ActivityItem } from '@/lib/social/activityService';
import { Users } from 'lucide-react';

const gameRoutes: Record<string, string> = {
  chain: '/chain',
  grid: '/grid',
  rush: '/rush',
  morphcode: '/morphcode',
  clash: '/clash',
};

const gameLabels: Record<string, string> = {
  chain: 'Chain',
  grid: 'Grid',
  rush: 'Rush',
  morphcode: 'Code',
  clash: 'Clash',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatActivity(item: ActivityItem): string {
  const name = item.displayName || 'A friend';
  const p = item.payload;

  switch (item.game) {
    case 'chain':
      return p.won
        ? `${name} solved Chain in ${p.moves} moves`
        : `${name} attempted Chain`;
    case 'grid':
      return p.won
        ? `${name} completed Grid in ${p.moves} moves`
        : `${name} scored ${p.purpleCount}/25 on Grid`;
    case 'rush':
      return `${name} scored ${p.score?.toLocaleString() ?? '?'} on Rush`;
    case 'morphcode':
      return p.result === 'win'
        ? `${name} won a Code match`
        : `${name} played a Code match`;
    default:
      return `${name} played ${gameLabels[item.game] || item.game}`;
  }
}

export const FriendActivityFeed = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFriendActivity(5).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div
      className="mt-6 rounded-xl p-4 max-w-[640px] mx-auto"
      style={{
        background: 'hsl(var(--home-card-bg))',
        border: '1px solid hsl(var(--home-card-border))',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4" style={{ color: 'hsl(var(--home-accent))' }} />
        <h3
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'hsl(var(--home-text-muted))' }}
        >
          Friend Activity
        </h3>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(gameRoutes[item.game] || '/')}
            className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <p
              className="text-sm truncate flex-1"
              style={{ color: 'hsl(var(--home-text-secondary))' }}
            >
              {formatActivity(item)}
            </p>
            <span
              className="text-[10px] flex-shrink-0"
              style={{ color: 'hsl(var(--home-text-muted))' }}
            >
              {timeAgo(item.createdAt)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
