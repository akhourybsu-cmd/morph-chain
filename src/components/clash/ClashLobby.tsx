import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn, Swords, Users } from 'lucide-react';
import { challengeFriend, getPendingChallenges, joinClashMatchById, cancelClashMatch } from '@/lib/clash/matchService';
import { getFriends, type Friend } from '@/lib/social/friendsService';
import { toast } from 'sonner';

interface ClashLobbyProps {
  onMatchFound: (matchId: string) => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
  onMatchCancelled?: () => void;
  onMatchCreated?: (matchId: string) => void;
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
  onMatchCancelled, onMatchCreated,
}: ClashLobbyProps) => {
  const [joining, setJoining] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<PendingChallenge[]>([]);
  const [challengingId, setChallengingId] = useState<string | null>(null);

  // Load friends and pending challenges
  useEffect(() => {
    if (!isLoggedIn) return;
    getFriends().then(setFriends);
    getPendingChallenges().then(setChallenges);
  }, [isLoggedIn]);

  const handleChallengeFriend = async (friendId: string) => {
    setChallengingId(friendId);
    const result = await challengeFriend(friendId);
    setChallengingId(null);
    if (result) {
      toast.success('Challenge sent!');
      onMatchCreated?.(result.matchId);
    } else {
      toast.error('Failed to create challenge');
    }
  };

  const handleAcceptChallenge = async (challenge: PendingChallenge) => {
    setJoining(true);
    const matchId = await joinClashMatchById(challenge.matchId);
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
    <div className="flex flex-col items-center gap-5 px-4 max-w-sm mx-auto py-6">
      {/* Masthead */}
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

      {/* Pending Challenges */}
      {isLoggedIn && challenges.length > 0 && (
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
      {isLoggedIn && onlineFriends.length > 0 && (
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
                onClick={() => handleChallengeFriend(f.friendUserId)}
                disabled={challengingId === f.friendUserId}
                className="text-xs font-inter px-3"
                style={{ background: 'hsl(var(--clash-accent) / 0.15)', color: 'hsl(var(--clash-accent))' }}
              >
                {challengingId === f.friendUserId ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Challenge'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state when logged in but no friends online and no challenges */}
      {isLoggedIn && onlineFriends.length === 0 && challenges.length === 0 && (
        <div
          className="w-full rounded-xl p-6 text-center"
          style={{
            background: 'hsl(var(--clash-card-bg))',
            border: '1px solid hsl(var(--clash-card-border))',
          }}
        >
          <Users className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(var(--clash-text-muted))' }} />
          <p className="font-playfair text-sm font-semibold mb-1" style={{ color: 'hsl(var(--clash-text-primary))' }}>
            No friends online
          </p>
          <p className="text-xs font-inter" style={{ color: 'hsl(var(--clash-text-muted))' }}>
            Add friends from your profile to challenge them
          </p>
        </div>
      )}
    </div>
  );
};
