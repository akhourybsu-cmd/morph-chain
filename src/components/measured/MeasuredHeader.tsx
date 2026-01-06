import { HelpCircle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatInTimeZone } from 'date-fns-tz';
import { useNavigate } from 'react-router-dom';

interface MeasuredHeaderProps {
  onHelpClick: () => void;
}

export function MeasuredHeader({ onHelpClick }: MeasuredHeaderProps) {
  const navigate = useNavigate();
  const today = formatInTimeZone(new Date(), 'America/New_York', 'MMMM d, yyyy');

  return (
    <header className="sticky top-0 z-50 bg-measured-page/95 backdrop-blur-sm border-b border-measured-card-border">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-measured-text-secondary hover:text-measured-text-primary"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-measured-text-primary tracking-tight">
            Measured
          </h1>
          <p className="text-xs text-measured-text-muted">{today}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onHelpClick}
          className="text-measured-text-secondary hover:text-measured-text-primary"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
