import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface SubmitConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  submitting: boolean;
  result: number | null;
}

export function SubmitConfirmation({
  open,
  onOpenChange,
  onConfirm,
  submitting,
  result,
}: SubmitConfirmationProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-measured-card border-measured-card-border max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-measured-text-primary">
            Lock in your guess?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-measured-text-secondary">
            You get one submission per day. Your answer of <strong className="text-measured-accent">{result}</strong> will be final.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={submitting}
            className="border-measured-card-border text-measured-text-secondary"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={submitting}
            className="bg-measured-accent hover:bg-measured-accent/90"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
