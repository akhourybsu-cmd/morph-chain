import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link2, Loader2, X, LogIn, Share2, Swords, Users } from 'lucide-react';
import { createClashMatch, joinClashByCode, cancelClashMatch, challengeFriend, getPendingChallenges } from '@/lib/clash/matchService';
import { getFriends, type Friend } from '@/lib/social/friendsService';
import { toast } from 'sonner';

interface ClashLobbyProps {
  onMatchFound: (matchId: string) => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  existingInviteCode?: string | null;
  existingMatchId?: string | null;
  onMatchCancelled?: () => void;
  initialJoinCode?: string | null;
}

interface PendingChallenge {
  activityId: string;
  fromUserId: string;
  fromName: string;
  matchId: string;
  inviteCode: string;
  createdAt: string;
}

export const ClashLobby = ({
  onMatchFound, isLoggedIn, onLoginRequired,
  existingInviteCode, existingMatchId, onMatchCancelled,
  initialJoinCode,
}: ClashLobbyProps) => {
  const [inviteCode, setInviteCode] = useState(initialJoinCode || '');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<PendingChallenge[]>([]);
  const [challengingId, setChallengingId] = useState<string | null>(null);

  const displayCode = createdCode || existingInviteCode;
  const activeMatchId = createdMatchId || existingMatchId;

  // Load friends and pending challenges
  useEffect(() => {
    if (!isLoggedIn) return;
    getFriends().then(setFriends);
    getPendingChallenges().then(setChallenges);
  }, [isLoggedIn]);

  // Auto-join if initialJoinCode provided
  useEffect(() => {
    if (initialJoinCode && isLoggedIn && !displayCode) {
      handleJoinWithCode(initialJoinCode);
    }
  }, [initialJoinCode, isLoggedIn]);

  const handleCreate = async () => {
    if (!isLoggedIn) { onLoginRequired(); return; }
    setCreating(true);
    const result = await createClashMatch();
    setCreating(false);
    if (result) {
      setCreatedCode(result.inviteCode);
      setCreatedMatchId(result.matchId);
      toast.success('Match created! Share the code.');
    } else {
      toast.error('Failed to create match');
    }
  };

  const handleJoinWithCode = async (code: string) => {
    if (!isLoggedIn) { onLoginRequired(); return; }
    if (!code.trim()) return;
    setJoining(true);
    const matchId = await joinClashByCode(code.trim());
    setJoining(false);
    if (matchId) {
      onMatchFound(matchId);
    } else {
      toast.error('Match not found or already full');
    }
  };

  const handleJoin = () => handleJoinWithCode(inviteCode);

  const handleCancel = async () => {
    if (!activeMatchId) return;
    setCancelling(true);
    const success = await cancelClashMatch(activeMatchId);
    setCancelling(false);
    if (success) {
      setCreatedCode(null);
      setCreatedMatchId(null);
      onMatchCancelled?.();
      toast('Match cancelled');
    }
  };

  const handleShare = async () => {
    if (!displayCode) return;
    const url = `https://morph-games.lovable.app/clash?join=${displayCode}`;
    const shareData = {
      title: 'Morph Clash Challenge',
      text: `I challenge you to a game of Morph Clash! Join with code: ${displayCode}`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const copyCode = () => {
    if (displayCode) {
      navigator.clipboard.writeText(displayCode);
      toast.success('Code copied!');
    }
  };

  const handleChallengeFriend = async (friendId: string) => {
    setChallengingId(friendId);
    const result = await challengeFriend(friendId);
    setChallengingId(null);
    if (result) {
      setCreatedCode(result.inviteCode);
      setCreatedMatchId(result.matchId);
      toast.success('Challenge sent!');
    } else {
      toast.error('Failed to create challenge');
    }
  };

  const handleAcceptChallenge = async (challenge: PendingChallenge) => {
    setJoining(true);
    const matchId = await joinClashByCode(challenge.inviteCode);
    setJoining(false);
    if (matchId) {
      onMatchFound(matchId);
    } else {
      toast.error('Challenge expired or already accepted');
      setChallenges(prev => prev.filter(c => c.activityId !== challenge.activityId));
    }
  };

  const handleDeclineChallenge = async (challenge: PendingChallenge) => {
    await cancelClashMatch(challenge.matchId);
    setChallenges(prev => prev.filter(c => c.activityId !== challenge.activityId));
    toast('Challenge declined');
  };

  const onlineFriends = friends.filter(f => f.isOnline);

  return (
    <div className={`flex flex-col items-center gap-5 px-4 max-w-sm mx-auto ${displayCode ? 'min-h-[calc(100vh-3.5rem)] justify-center' : 'py-6'}`}>
      {/* Masthead */}
      {!displayCode && (
        <div className="text-center space-y-2 mb-1">
          <p
            className="font-playfair italic text-base tracking-wide"
            style={{ color: 'hsl(var(--clash-text-secondary))' }}
          >
            Claim territory. Outsmart your rival.
          </p>
          <p className="text-xs" style={{ color: 'hsl(var(--clash-text-muted))' }}>
            Async · 24h turns · 12 moves each
          </p>
        </div>
      )}

      {/* Sign-in prompt */}
      {!isLoggedIn && (
        <button
          onClick={onLoginRequired}
          className="w-full rounded-xl p-5 text-center transition-all hover:shadow-md"
          style={{
            background: 'hsl(var(--clash-card-bg))',
            border: '1px solid hsl(var(--clash-card-border))',
          }}
        >
          <LogIn className="w-6 h-6 mx-auto mb-3" style={{ color: 'hsl(var(--clash-accent))' }} />
          <p className="font-playfair text-lg font-semibold mb-1" style={{ color: 'hsl(var(--clash-text-primary))' }}>
            Sign in to play
          </p>
          <p className="text-xs font-inter" style={{ color: 'hsl(var(--clash-text-muted))' }}>
            Create an account or log in to challenge friends
          </p>
        </button>
      )}

      {/* Waiting for opponent */}
      {displayCode && (
        <div
          className="w-full rounded-xl p-6 text-center space-y-4 animate-in fade-in-0 slide-in-from-bottom-2"
          style={{
            background: 'hsl(var(--clash-card-bg))',
            border: '1px solid hsl(var(--clash-accent) / 0.3)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          }}
        >
          <p className="text-xs font-inter uppercase tracking-widest" style={{ color: 'hsl(var(--clash-text-muted))' }}>
            Share this code
          </p>
          <button
            onClick={copyCode}
            className="text-4xl font-mono font-bold tracking-[0.35em] transition-transform active:scale-95"
            style={{ color: 'hsl(var(--clash-accent))' }}
          >
            {displayCode}
          </button>
          <p className="text-xs" style={{ color: 'hsl(var(--clash-text-muted))' }}>Tap to copy</p>

          {/* Share button */}
          <Button
            onClick={handleShare}
            size="sm"
            className="gap-2 font-inter"
            style={{ background: 'hsl(var(--clash-accent))', color: '#fff' }}
          >
            <Share2 className="w-4 h-4" />
            Share Invite
          </Button>

          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(var(--clash-accent))' }} />
            <span className="text-xs font-inter" style={{ color: 'hsl(var(--clash-text-secondary))' }}>
              Waiting for opponent…
            </span>
          </div>
          <Button
            variant="ghost" size="sm" onClick={handleCancel} disabled={cancelling}
            className="gap-1 text-[hsl(var(--clash-text-muted))] hover:text-[hsl(var(--clash-error))]"
          >
            {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            Cancel
          </Button>
        </div>
      )}

      {/* Pending Challenges */}
      {!displayCode && isLoggedIn && challenges.length > 0 && (
        <div
          className="w-full rounded-xl p-4 space-y-3 animate-in fade-in-0"
          style={{
            background: 'hsl(var(--clash-card-bg))',
            border: '1px solid hsl(var(--clash-accent) / 0.4)',
          }}
        >
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4" style={{ color: 'hsl(var(--clash-accent))' }} />
            <p className="text-xs font-inter font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--clash-text-muted))' }}>
              Challenges
            </p>
          </div>
          {challenges.map(ch => (
            <div
              key={ch.activityId}
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg"
              style={{ background: 'hsl(var(--clash-page-bg))' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-inter font-medium truncate" style={{ color: 'hsl(var(--clash-text-primary))' }}>
                  {ch.fromName}
                </p>
                <p className="text-[10px]" style={{ color: 'hsl(var(--clash-text-muted))' }}>wants to play!</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAcceptChallenge(ch)}
                  disabled={joining}
                  className="text-xs font-inter px-3"
                  style={{ background: 'hsl(var(--clash-accent))', color: '#fff' }}
                >
                  Accept
                </Button>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => handleDeclineChallenge(ch)}
                  className="text-xs text-[hsl(var(--clash-text-muted))]"
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Online Friends */}
      {!displayCode && isLoggedIn && onlineFriends.length > 0 && (
        <div
          className="w-full rounded-xl p-4 space-y-3"
          style={{
            background: 'hsl(var(--clash-card-bg))',
            border: '1px solid hsl(var(--clash-card-border))',
          }}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: 'hsl(var(--clash-text-muted))' }} />
            <p className="text-xs font-inter font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--clash-text-muted))' }}>
              Online Friends
            </p>
          </div>
          {onlineFriends.map(f => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
              style={{ background: 'hsl(var(--clash-page-bg))' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
                <p className="text-sm font-inter truncate" style={{ color: 'hsl(var(--clash-text-primary))' }}>
                  {f.displayName || 'Friend'}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleChallengeFriend(f.userId)}
                disabled={challengingId === f.userId}
                className="text-xs font-inter px-3"
                style={{ background: 'hsl(var(--clash-accent) / 0.15)', color: 'hsl(var(--clash-accent))' }}
              >
                {challengingId === f.userId ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Challenge'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create / Join */}
      {!displayCode && isLoggedIn && (
        <>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full rounded-xl p-5 text-left transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            style={{
              background: 'hsl(var(--clash-card-bg))',
              border: '1px solid hsl(var(--clash-card-border))',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--clash-accent) / 0.1)' }}>
                {creating
                  ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(var(--clash-accent))' }} />
                  : <Link2 className="w-5 h-5" style={{ color: 'hsl(var(--clash-accent))' }} />
                }
              </div>
              <div>
                <p className="font-playfair font-semibold text-[15px]" style={{ color: 'hsl(var(--clash-text-primary))' }}>
                  Create Match
                </p>
                <p className="text-xs font-inter mt-0.5" style={{ color: 'hsl(var(--clash-text-muted))' }}>
                  Get a code to share with a friend
                </p>
              </div>
            </div>
          </button>

          <div
            className="w-full rounded-xl p-5 space-y-3"
            style={{
              background: 'hsl(var(--clash-card-bg))',
              border: '1px solid hsl(var(--clash-card-border))',
            }}
          >
            <p className="text-xs font-inter uppercase tracking-widest" style={{ color: 'hsl(var(--clash-text-muted))' }}>
              Join a match
            </p>
            <div className="flex gap-2">
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter code…"
                className="font-mono text-center text-lg tracking-widest uppercase bg-[hsl(var(--clash-page-bg))] border-[hsl(var(--clash-card-border))] text-[hsl(var(--clash-text-primary))] placeholder:text-[hsl(var(--clash-text-muted))]"
                maxLength={6}
              />
              <Button
                onClick={handleJoin}
                disabled={joining || !inviteCode.trim()}
                size="default"
                className="px-5 font-inter"
                style={{
                  background: inviteCode.trim() ? 'hsl(var(--clash-accent))' : 'hsl(var(--clash-pill-bg))',
                  color: inviteCode.trim() ? '#fff' : 'hsl(var(--clash-text-muted))',
                }}
              >
                {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
