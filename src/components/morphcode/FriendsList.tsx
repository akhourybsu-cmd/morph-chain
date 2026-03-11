import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus, Check, X, Swords, Copy, Loader2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { Friend, getFriends, sendFriendRequest, acceptFriendRequest, removeFriend, getMyFriendCode, updatePresence } from '@/lib/morphcode/friendsService';
import { createMatch } from '@/lib/morphcode/matchService';
import { toast } from 'sonner';

interface FriendsListProps {
  isLoggedIn: boolean;
  onChallengeMatch: (matchId: string) => void;
}

export const FriendsList = ({ isLoggedIn, onChallengeMatch }: FriendsListProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [addCode, setAddCode] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const loadFriends = useCallback(async () => {
    if (!isLoggedIn) return;
    const [friendsList, code] = await Promise.all([getFriends(), getMyFriendCode()]);
    setFriends(friendsList);
    setMyCode(code);
    setLoading(false);
  }, [isLoggedIn]);

  useEffect(() => {
    loadFriends();
    if (isLoggedIn) {
      updatePresence();
      const interval = setInterval(updatePresence, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, loadFriends]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(loadFriends, 15000);
    return () => clearInterval(interval);
  }, [isLoggedIn, loadFriends]);

  const handleSendRequest = async () => {
    if (!addCode.trim()) return;
    setSending(true);
    const result = await sendFriendRequest(addCode.trim());
    setSending(false);
    if (result.success) {
      toast.success('Friend request sent!');
      setAddCode('');
      loadFriends();
    } else {
      toast.error(result.error || 'Failed');
    }
  };

  const handleAccept = async (id: string) => {
    await acceptFriendRequest(id);
    toast.success('Friend accepted!');
    loadFriends();
  };

  const handleRemove = async (id: string) => {
    await removeFriend(id);
    loadFriends();
  };

  const handleChallenge = async (friendUserId: string) => {
    const result = await createMatch();
    if (result) {
      toast.success('Match created! Share the code with your friend.');
      onChallengeMatch(result.matchId);
    }
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

  const hasContent = friends.length > 0 || !loading;
  const hasOnline = onlineFriends.length > 0;

  // Auto-expand if there are online friends or pending requests
  const shouldAutoExpand = hasOnline || pendingReceived.length > 0;

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
          <p
            className="text-[10px] font-inter uppercase tracking-widest"
            style={{ color: 'hsl(var(--code-text-muted))' }}
          >
            Your friend code
          </p>
          <p
            className="font-mono font-bold text-xl tracking-[0.2em] mt-0.5"
            style={{ color: 'hsl(var(--code-accent))' }}
          >
            {myCode || '···'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyMyCode}
            className="h-8 w-8 p-0 text-[hsl(var(--code-text-muted))] hover:text-[hsl(var(--code-accent))]"
          >
            <Copy className="w-4 h-4" />
          </Button>
          {hasContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0 text-[hsl(var(--code-text-muted))]"
            >
              {(expanded || shouldAutoExpand) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Expandable content */}
      {(expanded || shouldAutoExpand) && (
        <div
          className="px-4 pb-4 space-y-4"
          style={{ borderTop: '1px solid hsl(var(--code-divider))' }}
        >
          {/* Add friend */}
          <div className="flex gap-2 pt-3">
            <Input
              value={addCode}
              onChange={(e) => setAddCode(e.target.value.toUpperCase())}
              placeholder="Enter friend code…"
              className="font-mono text-center tracking-widest uppercase bg-[hsl(var(--code-page-bg))] border-[hsl(var(--code-card-border))] text-[hsl(var(--code-text-primary))] placeholder:text-[hsl(var(--code-text-muted))]"
              maxLength={6}
            />
            <Button
              onClick={handleSendRequest}
              disabled={sending || !addCode.trim()}
              size="sm"
              className="px-3"
              style={{ background: 'hsl(var(--code-accent))', color: '#fff' }}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            </Button>
          </div>

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
                    <span
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ background: 'hsl(var(--code-success))' }}
                    />
                    <span className="text-sm font-inter" style={{ color: 'hsl(var(--code-text-primary))' }}>
                      {f.displayName || f.friendCode || 'Player'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChallenge(f.friendUserId)}
                    className="h-7 text-xs gap-1 text-[hsl(var(--code-accent))]"
                  >
                    <Swords className="w-3 h-3" />
                    Challenge
                  </Button>
                </div>
              ))}
            </FriendsSection>
          )}

          {/* Offline friends */}
          {offlineFriends.length > 0 && (
            <FriendsSection label="Friends">
              {offlineFriends.map(f => (
                <div key={f.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'hsl(var(--code-divider))' }}
                    />
                    <span className="text-sm font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
                      {f.displayName || f.friendCode || 'Player'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(f.id)}
                    className="h-7 w-7 p-0 text-[hsl(var(--code-text-muted))]"
                  >
                    <X className="w-3 h-3" />
                  </Button>
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

          {!loading && friends.length === 0 && (
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
    <p
      className="text-[10px] font-inter font-semibold uppercase tracking-widest mb-2"
      style={{ color: 'hsl(var(--code-text-muted))' }}
    >
      {label}
    </p>
    {children}
  </div>
);
