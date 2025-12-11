import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type FinalCheckDialogProps = {
  open: boolean;
  result?: string;
  submitBusy?: boolean;
  hasId?: boolean;
  onClose: () => void;
  onProceed: () => void | Promise<void>;
};

export function FinalCheckDialog({
  open,
  result,
  submitBusy,
  hasId,
  onClose,
  onProceed,
}: FinalCheckDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(dialogOpen) => {
        if (!dialogOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Final project validity check</DialogTitle>
          <DialogDescription>
            Review the AI feedback on the consistency and achievability of your
            project before creating it.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/40 mt-3 max-h-[360px] overflow-y-auto rounded-md border p-3 text-sm whitespace-pre-wrap">
          {result || "No feedback available."}
        </div>

        <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={submitBusy}>
            Back and edit
          </Button>
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={onProceed}
            disabled={submitBusy}
          >
            {hasId ? "Proceed and save changes" : "Proceed and create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
