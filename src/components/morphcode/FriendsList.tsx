import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus, Check, X, Swords, Copy, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Friend, getFriends, sendFriendRequest, acceptFriendRequest, removeFriend, getMyFriendCode, updatePresence } from '@/lib/morphcode/friendsService';
import { challengeFriend, joinMatchById, getIncomingChallenges, declineChallenge, IncomingChallenge } from '@/lib/morphcode/matchService';
import { toast } from 'sonner';
import { playChallengeReceived } from '@/lib/morphcode/audioManager';
import { supabase } from '@/integrations/supabase/client';

interface FriendsListProps {
  isLoggedIn: boolean;
  onChallengeMatch: (matchId: string) => void;
}

export const FriendsList = ({ isLoggedIn, onChallengeMatch }: FriendsListProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<IncomingChallenge[]>([]);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [addCode, setAddCode] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const challengeCountRef = useRef(0);

  const loadData = useCallback(async () => {
    if (!isLoggedIn) return;
    const [friendsList, code, incomingChallenges] = await Promise.all([
      getFriends(),
      getMyFriendCode(),
      getIncomingChallenges(),
    ]);
    setFriends(friendsList);
    setMyCode(code);
    if (incomingChallenges.length > challengeCountRef.current) {
      playChallengeReceived();
    }
    challengeCountRef.current = incomingChallenges.length;
    setChallenges(incomingChallenges);
    setLoading(false);
  }, [isLoggedIn]);

  useEffect(() => {
    loadData();
    if (isLoggedIn) {
      updatePresence();
      const interval = setInterval(updatePresence, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, loadData]);

  // Realtime subscription for challenge notifications instead of 10s polling
  useEffect(() => {
    if (!isLoggedIn) return;
    // Poll friends list on a longer interval (30s)
    const friendsPoll = setInterval(loadData, 30000);

    // Realtime subscription for new challenge activities
    const channel = supabase
      .channel('friends-challenges')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'app_activity',
      }, (payload) => {
        const row = payload.new as any;
        if (row?.activity_type === 'challenge') {
          // Reload to check if it's targeted at us
          loadData();
        }
      })
      .subscribe();

    return () => {
      clearInterval(friendsPoll);
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, loadData]);

  const handleSendRequest = async () => {
    if (!addCode.trim()) return;
    setSending(true);
    const result = await sendFriendRequest(addCode.trim());
    setSending(false);
    if (result.success) {
      toast.success('Friend request sent!');
      setAddCode('');
      loadData();
    } else {
      toast.error(result.error || 'Failed');
    }
  };

  const handleAccept = async (id: string) => {
    await acceptFriendRequest(id);
    toast.success('Friend accepted!');
    loadData();
  };

  const handleRemove = async (id: string) => {
    await removeFriend(id);
    loadData();
  };

  const handleChallenge = async (friendUserId: string) => {
    const result = await challengeFriend(friendUserId);
    if (result) {
      toast.success('Challenge sent!');
      onChallengeMatch(result.matchId);
    } else {
      toast.error('Failed to create challenge');
    }
  };

  const handleAcceptChallenge = async (challenge: IncomingChallenge) => {
    setAcceptingId(challenge.matchId);
    const matchId = await joinMatchById(challenge.matchId);
    setAcceptingId(null);
    if (matchId) {
      toast.success('Challenge accepted!');
      onChallengeMatch(matchId);
    } else {
      toast.error('Challenge expired or already accepted');
      loadData();
    }
  };

  const handleDeclineChallenge = async (challenge: IncomingChallenge) => {
    await declineChallenge(challenge.matchId);
    toast('Challenge declined');
    loadData();
  };

  const copyMyCode = () => {
    if (myCode) {
      navigator.clipboard.writeText(myCode);
      toast.success('Friend code copied!');
    }
  };

  if (!isLoggedIn) return null;

  const accepted = friends.filter(f => f.status === 'accepted');
  const pendingReceived = friends.filter(f => f.status === 'pending' && !f.isSentByMe);
  const pendingSent = friends.filter(f => f.status === 'pending' && f.isSentByMe);
  const onlineFriends = accepted.filter(f => f.isOnline);
  const offlineFriends = accepted.filter(f => !f.isOnline);

  const shouldAutoExpand = onlineFriends.length > 0 || pendingReceived.length > 0 || challenges.length > 0;

  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{
        background: 'hsl(var(--code-card-bg))',
        border: '1px solid hsl(var(--code-card-border))',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      {/* My friend code — always visible */}
      <div className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-inter uppercase tracking-widest" style={{ color: 'hsl(var(--code-text-muted))' }}>
            Your friend code
          </p>
          <p className="font-mono font-bold text-xl tracking-[0.2em] mt-0.5" style={{ color: 'hsl(var(--code-accent))' }}>
            {myCode || '···'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={copyMyCode} className="h-8 w-8 p-0 text-[hsl(var(--code-text-muted))] hover:text-[hsl(var(--code-accent))]">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="h-8 w-8 p-0 text-[hsl(var(--code-text-muted))]">
            {(expanded || shouldAutoExpand) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {(expanded || shouldAutoExpand) && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid hsl(var(--code-divider))' }}>
          {/* Add friend */}
          <div className="flex gap-2 pt-3">
            <Input
              value={addCode}
              onChange={(e) => setAddCode(e.target.value.toUpperCase())}
              placeholder="Enter friend code…"
              className="font-mono text-center tracking-widest uppercase bg-[hsl(var(--code-page-bg))] border-[hsl(var(--code-card-border))] text-[hsl(var(--code-text-primary))] placeholder:text-[hsl(var(--code-text-muted))]"
              maxLength={6}
            />
            <Button onClick={handleSendRequest} disabled={sending || !addCode.trim()} size="sm" className="px-3" style={{ background: 'hsl(var(--code-accent))', color: '#fff' }}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            </Button>
          </div>

          {/* Incoming challenges */}
          {challenges.length > 0 && (
            <FriendsSection label="⚔ Challenges">
              {challenges.map(c => (
                <div key={c.activityId} className="flex items-center justify-between py-2 px-2 md:px-3 rounded-lg animate-fade-in" style={{ background: 'hsl(var(--code-accent) / 0.08)', border: '1px solid hsl(var(--code-accent) / 0.2)' }}>
                  <div className="flex items-center gap-2">
                    <Swords className="w-4 h-4" style={{ color: 'hsl(var(--code-accent))' }} />
                    <span className="text-sm font-inter font-medium" style={{ color: 'hsl(var(--code-text-primary))' }}>
                      {c.challengerName}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAcceptChallenge(c)}
                      disabled={acceptingId === c.matchId}
                      className="h-7 px-3 text-xs font-semibold"
                      style={{ background: 'hsl(var(--code-accent))', color: '#fff' }}
                    >
                      {acceptingId === c.matchId ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Accept'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeclineChallenge(c)} className="h-7 w-7 p-0 text-[hsl(var(--code-error))]">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </FriendsSection>
          )}

          {/* Pending received */}
          {pendingReceived.length > 0 && (
            <FriendsSection label="Requests">
              {pendingReceived.map(f => (
                <div key={f.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm font-inter" style={{ color: 'hsl(var(--code-text-primary))' }}>
                    {f.displayName || f.friendCode || 'Player'}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleAccept(f.id)} className="h-7 w-7 p-0 text-[hsl(var(--code-success))]">
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(f.id)} className="h-7 w-7 p-0 text-[hsl(var(--code-error))]">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </FriendsSection>
          )}

          {/* Online friends */}
          {onlineFriends.length > 0 && (
            <FriendsSection label="Online Now">
              {onlineFriends.map(f => (
                <div key={f.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'hsl(var(--code-success))' }} />
                    <span className="text-sm font-inter" style={{ color: 'hsl(var(--code-text-primary))' }}>
                      {f.displayName || f.friendCode || 'Player'}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleChallenge(f.friendUserId)} className="h-7 text-xs gap-1 px-2 md:px-3 text-[hsl(var(--code-accent))]">
                    <Swords className="w-3 h-3" />
                    <span className="hidden md:inline">Challenge</span>
                  </Button>
                </div>
              ))}
            </FriendsSection>
          )}

          {/* Offline friends */}
          {offlineFriends.length > 0 && (
            <FriendsSection label="Offline">
              {offlineFriends.map(f => (
                <div key={f.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--code-divider))' }} />
                    <span className="text-sm font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
                      {f.displayName || f.friendCode || 'Player'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleChallenge(f.friendUserId)} className="h-7 text-xs gap-1 px-2 md:px-3 text-[hsl(var(--code-accent))] opacity-70">
                      <Swords className="w-3 h-3" />
                      <span className="hidden md:inline">Challenge</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(f.id)} className="h-7 w-7 p-0 text-[hsl(var(--code-text-muted))]">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </FriendsSection>
          )}

          {/* Pending sent */}
          {pendingSent.length > 0 && (
            <FriendsSection label="Sent">
              {pendingSent.map(f => (
                <div key={f.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
                    {f.displayName || f.friendCode || 'Player'}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: 'hsl(var(--code-text-muted))' }}>Pending</span>
                </div>
              ))}
            </FriendsSection>
          )}

          {loading && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'hsl(var(--code-text-muted))' }} />
            </div>
          )}

          {!loading && friends.length === 0 && challenges.length === 0 && (
            <p className="text-xs text-center py-2 font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
              Share your code to add friends
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const FriendsSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-[10px] font-inter font-semibold uppercase tracking-widest mb-2" style={{ color: 'hsl(var(--code-text-muted))' }}>
      {label}
    </p>
    {children}
  </div>
);
