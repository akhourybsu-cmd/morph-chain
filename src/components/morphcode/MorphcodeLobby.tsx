import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Swords, LogIn, Bot, UserPlus } from 'lucide-react';
import { joinQueue, leaveQueue, createBotMatch } from '@/lib/morphcode/matchService';
import { FriendsList } from './FriendsList';
import { toast } from 'sonner';

interface MorphcodeLobbyProps {
  onMatchFound: (matchId?: string) => void;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
}

export const MorphcodeLobby = ({
  onMatchFound, isLoggedIn, onLoginRequired,
}: MorphcodeLobbyProps) => {
  const navigate = useNavigate();
  const [queuing, setQueuing] = useState(false);
  const [creatingBot, setCreatingBot] = useState(false);

  const handlePlayBot = async () => {
    if (!isLoggedIn) { onLoginRequired(); return; }
    setCreatingBot(true);
    const matchId = await createBotMatch();
    setCreatingBot(false);
    if (matchId) {
      onMatchFound(matchId);
    } else {
      toast.error('Failed to create bot match');
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

  return (
    <div className={`flex flex-col items-center gap-6 px-4 max-w-sm mx-auto ${queuing ? 'min-h-[calc(100vh-3.5rem)] justify-center' : 'py-8'}`}>
      {/* Prestige Masthead */}
      {!queuing && (
        <div className="text-center space-y-2 mb-2">
          <p
            className="font-playfair italic text-base tracking-wide"
            style={{ color: 'hsl(var(--code-text-secondary))' }}
          >
            Crack the code. Outsmart your rival.
          </p>
        </div>
      )}

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

      {/* Friends section */}
      {isLoggedIn && !queuing && (
        <FriendsList isLoggedIn={isLoggedIn} onChallengeMatch={onMatchFound} />
      )}

      {!queuing && isLoggedIn && (
        <>
          {/* Play vs Bot */}
          <button
            onClick={handlePlayBot}
            disabled={creatingBot}
            className="w-full rounded-xl p-5 text-left transition-all hover:shadow-md active:scale-[0.98]"
            style={{
              background: 'hsl(var(--code-card-bg))',
              border: '1px solid hsl(var(--code-accent) / 0.3)',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'hsl(var(--code-accent) / 0.12)' }}
              >
                {creatingBot ? (
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'hsl(var(--code-accent))' }} />
                ) : (
                  <Bot className="w-5 h-5" style={{ color: 'hsl(var(--code-accent))' }} />
                )}
              </div>
              <div>
                <p className="font-playfair font-semibold text-[15px]" style={{ color: 'hsl(var(--code-text-primary))' }}>
                  Play vs Bot
                </p>
                <p className="text-xs font-inter mt-0.5" style={{ color: 'hsl(var(--code-text-muted))' }}>
                  Practice against an AI opponent
                </p>
              </div>
            </div>
          </button>

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

          {/* Random match */}
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
