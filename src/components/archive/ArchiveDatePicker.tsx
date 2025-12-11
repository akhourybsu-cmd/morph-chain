import { useState, useEffect, useMemo } from "react";
import { format, subDays, isBefore, isAfter, startOfDay, eachDayOfInterval, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// Launch date - earliest date available in archive
const LAUNCH_DATE = new Date("2024-01-01");

interface ArchiveProgress {
  completed: Date[];
  inProgress: Date[];
}

// Scan localStorage for archive progress
const getArchiveProgress = (game: "chain" | "grid"): ArchiveProgress => {
  const completed: Date[] = [];
  const inProgress: Date[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      if (game === "chain" && key.startsWith("morphchain_archive_")) {
        // Format: morphchain_archive_YYYY-MM-DD_4 or morphchain_archive_YYYY-MM-DD_5
        const match = key.match(/morphchain_archive_(\d{4}-\d{2}-\d{2})_\d/);
        if (match) {
          const dateStr = match[1];
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const state = JSON.parse(stored);
              const date = parseISO(dateStr);
              if (state.completed || state.won) {
                completed.push(date);
              } else if (state.moves && state.moves.length > 0) {
                inProgress.push(date);
              }
            } catch {}
          }
        }
      } else if (game === "grid" && key.startsWith("morphgrid_archive_")) {
        // Format: morphgrid_archive_YYYY-MM-DD
        const match = key.match(/morphgrid_archive_(\d{4}-\d{2}-\d{2})/);
        if (match) {
          const dateStr = match[1];
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const state = JSON.parse(stored);
              const date = parseISO(dateStr);
              if (state.isEnded) {
                completed.push(date);
              } else if (state.moves > 0 || state.submittedWords?.length > 0) {
                inProgress.push(date);
              }
            } catch {}
          }
        }
      }
    }
  } catch (error) {
    console.error("Error scanning archive progress:", error);
  }
  
  return { completed, inProgress };
};

interface ArchiveDatePickerProps {
  onSelectDate: (date: Date) => void;
  onBack: () => void;
  game: "chain" | "grid";
}

export const ArchiveDatePicker = ({ onSelectDate, onBack, game }: ArchiveDatePickerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [progress, setProgress] = useState<ArchiveProgress>({ completed: [], inProgress: [] });
  const yesterday = subDays(startOfDay(new Date()), 1);
  
  // Scan localStorage for progress on mount
  useEffect(() => {
    setProgress(getArchiveProgress(game));
  }, [game]);
  
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  const handlePlay = () => {
    if (selectedDate) {
      onSelectDate(selectedDate);
    }
  };
  
  // Disable future dates, today, and dates before launch
  const isDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    return isAfter(date, yesterday) || isBefore(date, LAUNCH_DATE);
  };

  // Check if a date matches any date in the array (by day)
  const matchesDate = (date: Date, dates: Date[]) => {
    return dates.some(d => 
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    );
  };

  // Get status for selected date
  const selectedStatus = useMemo(() => {
    if (!selectedDate) return null;
    if (matchesDate(selectedDate, progress.completed)) return "completed";
    if (matchesDate(selectedDate, progress.inProgress)) return "in-progress";
    return null;
  }, [selectedDate, progress]);

  const cssVarPrefix = game === "chain" ? "chain" : "grid";

  // Custom day content renderer
  const DayContent = ({ date, displayMonth }: { date: Date; displayMonth: Date }) => {
    const isCompleted = matchesDate(date, progress.completed);
    const isInProgress = matchesDate(date, progress.inProgress);
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{date.getDate()}</span>
        {isCompleted && (
          <div 
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2"
            style={{ color: `hsl(var(--${cssVarPrefix}-accent))` }}
          >
            <Check className="w-3 h-3" strokeWidth={3} />
          </div>
        )}
        {isInProgress && !isCompleted && (
          <div 
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2"
            style={{ color: `hsl(var(--${cssVarPrefix}-text-muted))` }}
          >
            <Circle className="w-2 h-2 fill-current" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="min-h-dvh flex flex-col"
      style={{ background: `hsl(var(--${cssVarPrefix}-page-bg))` }}
    >
      {/* Header */}
      <header 
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ 
          background: `hsl(var(--${cssVarPrefix}-card-bg))`,
          borderColor: `hsl(var(--${cssVarPrefix}-card-border))` 
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9"
          style={{ color: `hsl(var(--${cssVarPrefix}-text-secondary))` }}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 
          className="font-serif text-lg font-semibold"
          style={{ color: `hsl(var(--${cssVarPrefix}-text-primary))` }}
        >
          Puzzle Archive
        </h1>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div 
          className="text-center space-y-2"
          style={{ color: `hsl(var(--${cssVarPrefix}-text-primary))` }}
        >
          <h2 className="font-serif text-xl">Select a Date</h2>
          <p 
            className="text-sm"
            style={{ color: `hsl(var(--${cssVarPrefix}-text-muted))` }}
          >
            Play any past daily puzzle
          </p>
        </div>

        <div 
          className="rounded-xl p-4 border"
          style={{ 
            background: `hsl(var(--${cssVarPrefix}-card-bg))`,
            borderColor: `hsl(var(--${cssVarPrefix}-card-border))` 
          }}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={isDisabled}
            defaultMonth={yesterday}
            className={cn("pointer-events-auto")}
            classNames={{
              day_selected: `bg-[hsl(var(--${cssVarPrefix}-accent))] text-white hover:bg-[hsl(var(--${cssVarPrefix}-accent))]`,
              day_today: `bg-[hsl(var(--${cssVarPrefix}-pill-bg))] text-[hsl(var(--${cssVarPrefix}-text-primary))]`,
              day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 relative",
              cell: "h-10 w-10 text-center text-sm p-0 relative",
            }}
            components={{
              DayContent: DayContent,
            }}
          />
        </div>

        {/* Legend */}
        <div 
          className="flex items-center gap-4 text-xs"
          style={{ color: `hsl(var(--${cssVarPrefix}-text-muted))` }}
        >
          <div className="flex items-center gap-1.5">
            <Check className="w-3 h-3" style={{ color: `hsl(var(--${cssVarPrefix}-accent))` }} strokeWidth={3} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="w-2 h-2 fill-current" />
            <span>In Progress</span>
          </div>
        </div>

        {selectedDate && (
          <div className="text-center space-y-3">
            <div>
              <p style={{ color: `hsl(var(--${cssVarPrefix}-text-secondary))` }}>
                Selected: <span className="font-semibold">{format(selectedDate, "MMMM d, yyyy")}</span>
              </p>
              {selectedStatus && (
                <p 
                  className="text-sm mt-1"
                  style={{ color: selectedStatus === "completed" ? `hsl(var(--${cssVarPrefix}-accent))` : `hsl(var(--${cssVarPrefix}-text-muted))` }}
                >
                  {selectedStatus === "completed" ? "✓ Already completed" : "○ In progress"}
                </p>
              )}
            </div>
            <Button
              onClick={handlePlay}
              className="px-8"
              style={{ 
                background: `hsl(var(--${cssVarPrefix}-accent))`,
                color: 'white'
              }}
            >
              {selectedStatus === "completed" ? "Replay This Puzzle" : selectedStatus === "in-progress" ? "Continue This Puzzle" : "Play This Puzzle"}
            </Button>
          </div>
        )}

        <p 
          className="text-xs text-center max-w-xs mt-4"
          style={{ color: `hsl(var(--${cssVarPrefix}-text-muted))` }}
        >
          Archive puzzles don't affect your stats, streaks, or achievements.
        </p>
      </div>
    </div>
  );
};
