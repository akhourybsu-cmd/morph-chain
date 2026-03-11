import { useState, useEffect } from 'react';
import { Users, UserPlus, Copy, Check, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  getMyFriendCode,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getFriends,
  Friend,
} from '@/lib/social/friendsService';
import { useToast } from '@/hooks/use-toast';

interface FriendsPanelProps {
  /** CSS variable for accent color, e.g. "--home-accent" */
  accentVar?: string;
}

export const FriendsPanel = ({ accentVar = '--home-accent' }: FriendsPanelProps) => {
  const { toast } = useToast();
  const [friendCode, setFriendCode] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [addCode, setAddCode] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    const [code, list] = await Promise.all([getMyFriendCode(), getFriends()]);
    setFriendCode(code);
    setFriends(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCopy = () => {
    if (!friendCode) return;
    navigator.clipboard.writeText(friendCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (!addCode.trim()) return;
    setSending(true);
    const result = await sendFriendRequest(addCode.trim());
    setSending(false);
    if (result.success) {
      toast({ title: 'Friend request sent!' });
      setAddCode('');
      load();
    } else {
      toast({ title: result.error || 'Failed', variant: 'destructive' });
    }
  };

  const handleAccept = async (id: string) => {
    await acceptFriendRequest(id);
    load();
  };

  const handleRemove = async (id: string) => {
    await removeFriend(id);
    load();
  };

  const accepted = friends.filter(f => f.status === 'accepted');
  const pendingIncoming = friends.filter(f => f.status === 'pending' && !f.isSentByMe);
  const pendingOutgoing = friends.filter(f => f.status === 'pending' && f.isSentByMe);
  const accent = `hsl(var(${accentVar}))`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: accent }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Your friend code */}
      {friendCode && (
        <div
          className="rounded-xl p-4 text-center"
          style={{
            background: 'hsl(var(--home-card-bg))',
            border: '1px solid hsl(var(--home-card-border))',
          }}
        >
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--home-text-muted))' }}>
            Your Friend Code
          </p>
          <button
            onClick={handleCopy}
            className="text-2xl font-mono font-bold tracking-[0.3em] transition-transform active:scale-95"
            style={{ color: accent }}
          >
            {friendCode}
          </button>
          <div className="flex items-center justify-center gap-1 mt-2">
            {copied ? (
              <><Check className="w-3 h-3" style={{ color: accent }} /><span className="text-xs" style={{ color: accent }}>Copied!</span></>
            ) : (
              <><Copy className="w-3 h-3" style={{ color: 'hsl(var(--home-text-muted))' }} /><span className="text-xs" style={{ color: 'hsl(var(--home-text-muted))' }}>Tap to copy</span></>
            )}
          </div>
        </div>
      )}

      {/* Add friend */}
      <div className="flex gap-2">
        <Input
          value={addCode}
          onChange={e => setAddCode(e.target.value.toUpperCase())}
          placeholder="Enter friend code"
          maxLength={6}
          className="font-mono text-center tracking-widest uppercase"
          style={{
            background: 'hsl(var(--home-page-bg))',
            borderColor: 'hsl(var(--home-divider))',
            color: 'hsl(var(--home-text-primary))',
          }}
        />
        <Button onClick={handleSend} disabled={sending || !addCode.trim()} size="icon">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        </Button>
      </div>

      {/* Pending incoming */}
      {pendingIncoming.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider mb-2 px-1" style={{ color: 'hsl(var(--home-text-muted))' }}>
            Pending Requests
          </p>
          {pendingIncoming.map(f => (
            <div key={f.id} className="flex items-center justify-between py-2 px-1">
              <span className="text-sm" style={{ color: 'hsl(var(--home-text-primary))' }}>
                {f.displayName || f.friendCode || 'Unknown'}
              </span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => handleAccept(f.id)}>
                  <Check className="w-4 h-4" style={{ color: accent }} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleRemove(f.id)}>
                  <X className="w-4 h-4" style={{ color: 'hsl(var(--home-text-muted))' }} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends list */}
      {accepted.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider mb-2 px-1" style={{ color: 'hsl(var(--home-text-muted))' }}>
            Friends ({accepted.length})
          </p>
          {accepted.map(f => (
            <div key={f.id} className="flex items-center justify-between py-2 px-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${f.isOnline ? 'animate-pulse' : ''}`}
                  style={{ background: f.isOnline ? 'hsl(142 76% 36%)' : 'hsl(var(--home-divider))' }}
                />
                <span className="text-sm" style={{ color: 'hsl(var(--home-text-primary))' }}>
                  {f.displayName || f.friendCode || 'Player'}
                </span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleRemove(f.id)} className="opacity-50 hover:opacity-100">
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Pending outgoing */}
      {pendingOutgoing.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider mb-2 px-1" style={{ color: 'hsl(var(--home-text-muted))' }}>
            Sent Requests
          </p>
          {pendingOutgoing.map(f => (
            <div key={f.id} className="flex items-center justify-between py-2 px-1">
              <span className="text-sm" style={{ color: 'hsl(var(--home-text-muted))' }}>
                {f.displayName || f.friendCode || 'Unknown'}
              </span>
              <span className="text-xs" style={{ color: 'hsl(var(--home-text-muted))' }}>Pending</span>
            </div>
          ))}
        </div>
      )}

      {accepted.length === 0 && pendingIncoming.length === 0 && (
        <div className="text-center py-4">
          <Users className="w-8 h-8 mx-auto mb-2" style={{ color: 'hsl(var(--home-divider))' }} />
          <p className="text-sm" style={{ color: 'hsl(var(--home-text-muted))' }}>
            Add friends using their friend code
          </p>
        </div>
      )}
    </div>
  );
};
