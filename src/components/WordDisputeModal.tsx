import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { AlertCircle } from "lucide-react";

interface WordDisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  word?: string;
  onSubmitDispute: (word: string, reason: string) => void;
}

export const WordDisputeModal = ({ 
  open, 
  onOpenChange, 
  word,
  onSubmitDispute 
}: WordDisputeModalProps) => {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (word && reason.trim()) {
      onSubmitDispute(word, reason.trim());
      setReason("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Report Word Issue</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/30 border border-muted rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Word Quality Standards</p>
                <p className="text-xs text-muted-foreground">
                  We only use standard, modern American English. No archaic, dialect, brand, or slang terms.
                  If this word wouldn't appear in a contemporary newspaper, we won't use it.
                </p>
              </div>
            </div>
          </div>

          {word && (
            <div>
              <p className="text-sm font-medium mb-2">Disputed Word:</p>
              <div className="bg-card border border-primary/20 rounded-lg p-3">
                <p className="text-lg font-mono font-bold uppercase tracking-wider text-primary">
                  {word}
                </p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="dispute-reason" className="text-sm font-medium block mb-2">
              Why is this word problematic? <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Example: This is an archaic term not used in modern English..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reason.length}/500 characters
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!reason.trim()}
              className="flex-1"
            >
              Submit Report
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Reports help us maintain high-quality word lists. Thank you!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
