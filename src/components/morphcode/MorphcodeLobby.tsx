import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link2, Loader2, Swords, X, LogIn } from 'lucide-react';
import { createMatch, joinMatchByCode, joinQueue, leaveQueue, cancelMatch } from '@/lib/morphcode/matchService';
import { FriendsList } from './FriendsList';
import { toast } from 'sonner';

interface MorphcodeLobbyProps {
  onMatchFound: (matchId?: string) => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  existingInviteCode?: string | null;
  existingMatchId?: string | null;
  onMatchCancelled?: () => void;
}

export const MorphcodeLobby = ({
  onMatchFound, isLoggedIn, onLoginRequired,
  existingInviteCode, existingMatchId, onMatchCancelled,
}: MorphcodeLobbyProps) => {
  const [inviteCode, setInviteCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [queuing, setQueuing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);

  const displayCode = createdCode || existingInviteCode;
  const activeMatchId = createdMatchId || existingMatchId;

  const handleCreate = async () => {
    if (!isLoggedIn) { onLoginRequired(); return; }
    setCreating(true);
    const result = await createMatch();
    setCreating(false);
    if (result) {
      setCreatedCode(result.inviteCode);
      setCreatedMatchId(result.matchId);
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

  const handleCancel = async () => {
    if (!activeMatchId) return;
    setCancelling(true);
    const success = await cancelMatch(activeMatchId);
    setCancelling(false);
    if (success) {
      setCreatedCode(null);
      setCreatedMatchId(null);
      onMatchCancelled?.();
      toast('Match cancelled');
    } else {
      toast.error('Failed to cancel');
    }
  };

  const copyCode = () => {
    if (displayCode) {
      navigator.clipboard.writeText(displayCode);
      toast.success('Code copied!');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-sm mx-auto">
      {/* Prestige Masthead */}
      <div className="text-center space-y-2 mb-2">
        <p
          className="font-playfair italic text-base tracking-wide"
          style={{ color: 'hsl(var(--code-text-secondary))' }}
        >
          Crack the code. Outsmart your rival.
        </p>
      </div>

      {/* Sign-in prompt for logged-out users */}
      {!isLoggedIn && (
        <button
          onClick={onLoginRequired}
          className="w-full rounded-xl p-5 text-center transition-all hover:shadow-md"
          style={{
            background: 'hsl(var(--code-card-bg))',
            border: '1px solid hsl(var(--code-card-border))',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <LogIn
            className="w-6 h-6 mx-auto mb-3"
            style={{ color: 'hsl(var(--code-accent))' }}
          />
          <p
            className="font-playfair text-lg font-semibold mb-1"
            style={{ color: 'hsl(var(--code-text-primary))' }}
          >
            Sign in to play
          </p>
          <p
            className="text-xs font-inter"
            style={{ color: 'hsl(var(--code-text-muted))' }}
          >
            Create an account or log in to challenge friends
          </p>
        </button>
      )}

      {/* Created match - waiting */}
      {displayCode && (
        <div
          className="w-full rounded-xl p-6 text-center space-y-4 animate-in fade-in-0 slide-in-from-bottom-2"
          style={{
            background: 'hsl(var(--code-card-bg))',
            border: '1px solid hsl(var(--code-accent) / 0.3)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          }}
        >
          <p
            className="text-xs font-inter uppercase tracking-widest"
            style={{ color: 'hsl(var(--code-text-muted))' }}
          >
            Share this code
          </p>
          <button
            onClick={copyCode}
            className="text-4xl font-mono font-bold tracking-[0.35em] transition-transform active:scale-95"
            style={{ color: 'hsl(var(--code-accent))' }}
          >
            {displayCode}
          </button>
          <p className="text-xs" style={{ color: 'hsl(var(--code-text-muted))' }}>
            Tap to copy
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(var(--code-accent))' }} />
            <span className="text-xs font-inter" style={{ color: 'hsl(var(--code-text-secondary))' }}>
              Waiting for opponent…
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={cancelling}
            className="gap-1 text-[hsl(var(--code-text-muted))] hover:text-[hsl(var(--code-error))]"
          >
            {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            Cancel
          </Button>
        </div>
      )}

      {/* Friends section */}
      {isLoggedIn && !displayCode && !queuing && (
        <FriendsList isLoggedIn={isLoggedIn} onChallengeMatch={onMatchFound} />
      )}

      {!displayCode && !queuing && isLoggedIn && (
        <>
          {/* Create Private Match — prestige card */}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full rounded-xl p-5 text-left transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            style={{
              background: 'hsl(var(--code-card-bg))',
              border: '1px solid hsl(var(--code-card-border))',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsl(var(--code-accent) / 0.1)' }}
              >
                {creating
                  ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(var(--code-accent))' }} />
                  : <Link2 className="w-5 h-5" style={{ color: 'hsl(var(--code-accent))' }} />
                }
              </div>
              <div>
                <p className="font-playfair font-semibold text-[15px]" style={{ color: 'hsl(var(--code-text-primary))' }}>
                  Create Private Match
                </p>
                <p className="text-xs font-inter mt-0.5" style={{ color: 'hsl(var(--code-text-muted))' }}>
                  Get a code to share with a friend
                </p>
              </div>
            </div>
          </button>

          {/* Join by code — prestige card */}
          <div
            className="w-full rounded-xl p-5 space-y-3"
            style={{
              background: 'hsl(var(--code-card-bg))',
              border: '1px solid hsl(var(--code-card-border))',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <p
              className="text-xs font-inter uppercase tracking-widest"
              style={{ color: 'hsl(var(--code-text-muted))' }}
            >
              Join a match
            </p>
            <div className="flex gap-2">
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter code…"
                className="font-mono text-center text-lg tracking-widest uppercase bg-[hsl(var(--code-page-bg))] border-[hsl(var(--code-card-border))] text-[hsl(var(--code-text-primary))] placeholder:text-[hsl(var(--code-text-muted))]"
                maxLength={6}
              />
              <Button
                onClick={handleJoin}
                disabled={joining || !inviteCode.trim()}
                size="default"
                className="px-5 font-inter"
                style={{
                  background: inviteCode.trim() ? 'hsl(var(--code-accent))' : 'hsl(var(--code-pill-bg))',
                  color: inviteCode.trim() ? '#fff' : 'hsl(var(--code-text-muted))',
                }}
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-px" style={{ background: 'hsl(var(--code-divider))' }} />
            <span
              className="text-[10px] font-inter uppercase tracking-widest"
              style={{ color: 'hsl(var(--code-text-muted))' }}
            >
              or
            </span>
            <div className="flex-1 h-px" style={{ background: 'hsl(var(--code-divider))' }} />
          </div>

          {/* Random match — secondary card */}
          <button
            onClick={handleQueue}
            className="w-full rounded-xl p-5 text-left transition-all hover:shadow-md active:scale-[0.98]"
            style={{
              background: 'hsl(var(--code-page-bg))',
              border: '1px solid hsl(var(--code-card-border))',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsl(var(--code-pill-bg))' }}
              >
                <Swords className="w-5 h-5" style={{ color: 'hsl(var(--code-text-secondary))' }} />
              </div>
              <div>
                <p className="font-playfair font-semibold text-[15px]" style={{ color: 'hsl(var(--code-text-primary))' }}>
                  Find Random Opponent
                </p>
                <p className="text-xs font-inter mt-0.5" style={{ color: 'hsl(var(--code-text-muted))' }}>
                  Match with another player instantly
                </p>
              </div>
            </div>
          </button>
        </>
      )}

      {/* Queuing state */}
      {queuing && (
        <div
          className="w-full rounded-xl p-6 text-center space-y-4 animate-in fade-in-0 slide-in-from-bottom-2"
          style={{
            background: 'hsl(var(--code-card-bg))',
            border: '1px solid hsl(var(--code-card-border))',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          }}
        >
          <Swords className="w-8 h-8 mx-auto" style={{ color: 'hsl(var(--code-accent))' }} />
          <div>
            <p
              className="font-playfair text-lg font-semibold mb-1"
              style={{ color: 'hsl(var(--code-text-primary))' }}
            >
              Searching
            </p>
            <p className="text-xs font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
              Looking for a worthy opponent…
            </p>
          </div>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  background: 'hsl(var(--code-accent))',
                  animationDelay: `${i * 300}ms`,
                }}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveQueue}
            className="text-[hsl(var(--code-text-muted))] hover:text-[hsl(var(--code-error))]"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
