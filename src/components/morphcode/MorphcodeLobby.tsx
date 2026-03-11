import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link2, Loader2, Swords } from 'lucide-react';
import { createMatch, joinMatchByCode, joinQueue, leaveQueue } from '@/lib/morphcode/matchService';
import { toast } from 'sonner';

interface MorphcodeLobbyProps {
  onMatchFound: (matchId: string) => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  existingInviteCode?: string | null;
}

export const MorphcodeLobby = ({ onMatchFound, isLoggedIn, onLoginRequired, existingInviteCode }: MorphcodeLobbyProps) => {
  const [inviteCode, setInviteCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [queuing, setQueuing] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(existingInviteCode || null);

  const displayCode = createdCode || existingInviteCode;

  const handleCreate = async () => {
    if (!isLoggedIn) { onLoginRequired(); return; }
    setCreating(true);
    const result = await createMatch();
    setCreating(false);
    if (result) {
      setCreatedCode(result.inviteCode);
      toast.success('Match created! Share the code with a friend.');
    } else {
      toast.error('Failed to create match');
    }
  };

  const handleJoin = async () => {
    if (!isLoggedIn) { onLoginRequired(); return; }
    if (!inviteCode.trim()) return;
    setJoining(true);
    const matchId = await joinMatchByCode(inviteCode.trim());
    setJoining(false);
    if (matchId) {
      onMatchFound(matchId);
    } else {
      toast.error('Match not found or already full');
    }
  };

  const handleQueue = async () => {
    if (!isLoggedIn) { onLoginRequired(); return; }
    setQueuing(true);
    await joinQueue();
  };

  const handleLeaveQueue = async () => {
    await leaveQueue();
    setQueuing(false);
  };

  const copyCode = () => {
    if (displayCode) {
      navigator.clipboard.writeText(displayCode);
      toast.success('Code copied!');
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-8 max-w-sm mx-auto">
      {/* Title */}
      <div className="text-center">
        <h1
          className="font-playfair text-2xl font-bold tracking-tight mb-2"
          style={{ color: 'hsl(var(--code-text-primary))' }}
        >
          MORPH CODE
        </h1>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'hsl(var(--code-text-secondary))' }}
        >
          Build a hidden sequence. Crack your opponent's. Fewest guesses wins.
        </p>
      </div>

      {/* Created match - waiting */}
      {displayCode && (
        <div
          className="w-full p-5 rounded-xl text-center space-y-3"
          style={{
            background: 'hsl(var(--code-card-bg))',
            border: '1px solid hsl(var(--code-card-border))',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          }}
        >
          <p className="text-sm" style={{ color: 'hsl(var(--code-text-secondary))' }}>
            Share this code with a friend:
          </p>
          <button
            onClick={copyCode}
            className="text-3xl font-mono font-bold tracking-[0.3em] transition-transform active:scale-95"
            style={{ color: 'hsl(var(--code-accent))' }}
          >
            {displayCode}
          </button>
          <p className="text-xs" style={{ color: 'hsl(var(--code-text-muted))' }}>
            Tap to copy • Waiting for opponent...
          </p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: 'hsl(var(--code-accent))' }} />
        </div>
      )}

      {!displayCode && !queuing && (
        <>
          {/* Create match */}
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full h-14 text-base gap-2 font-inter"
            style={{
              background: 'hsl(var(--code-accent))',
              color: '#fff',
            }}
            size="lg"
          >
            {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
            Create Private Match
          </Button>

          {/* Join by code */}
          <div className="w-full space-y-2">
            <div className="flex gap-2">
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter code..."
                className="font-mono text-center text-lg tracking-widest uppercase bg-[hsl(var(--code-card-bg))] border-[hsl(var(--code-card-border))] text-[hsl(var(--code-text-primary))]"
                maxLength={6}
              />
              <Button
                onClick={handleJoin}
                disabled={joining || !inviteCode.trim()}
                size="default"
                variant="outline"
                className="border-[hsl(var(--code-card-border))] text-[hsl(var(--code-text-primary))]"
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px" style={{ background: 'hsl(var(--code-divider))' }} />
            <span className="text-xs" style={{ color: 'hsl(var(--code-text-muted))' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'hsl(var(--code-divider))' }} />
          </div>

          {/* Random match */}
          <Button
            onClick={handleQueue}
            variant="outline"
            className="w-full h-14 text-base gap-2 font-inter border-[hsl(var(--code-card-border))] text-[hsl(var(--code-text-primary))] hover:bg-[hsl(var(--code-pill-bg))]"
            size="lg"
          >
            <Swords className="w-5 h-5" />
            Find Random Opponent
          </Button>
        </>
      )}

      {/* Queuing state */}
      {queuing && (
        <div
          className="w-full p-5 rounded-xl text-center space-y-3"
          style={{
            background: 'hsl(var(--code-card-bg))',
            border: '1px solid hsl(var(--code-card-border))',
          }}
        >
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: 'hsl(var(--code-accent))' }} />
          <p className="text-sm" style={{ color: 'hsl(var(--code-text-secondary))' }}>
            Searching for an opponent...
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveQueue}
            className="text-[hsl(var(--code-text-muted))]"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
