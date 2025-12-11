import { useState } from "react";
import { format, subDays, isBefore, isAfter, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Launch date - earliest date available in archive
const LAUNCH_DATE = new Date("2024-01-01");

interface ArchiveDatePickerProps {
  onSelectDate: (date: Date) => void;
  onBack: () => void;
  game: "chain" | "grid";
}

export const ArchiveDatePicker = ({ onSelectDate, onBack, game }: ArchiveDatePickerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const yesterday = subDays(startOfDay(new Date()), 1);
  
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

  const cssVarPrefix = game === "chain" ? "chain" : "grid";

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
            }}
          />
        </div>

        {selectedDate && (
          <div className="text-center space-y-4">
            <p style={{ color: `hsl(var(--${cssVarPrefix}-text-secondary))` }}>
              Selected: <span className="font-semibold">{format(selectedDate, "MMMM d, yyyy")}</span>
            </p>
            <Button
              onClick={handlePlay}
              className="px-8"
              style={{ 
                background: `hsl(var(--${cssVarPrefix}-accent))`,
                color: 'white'
              }}
            >
              Play This Puzzle
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
