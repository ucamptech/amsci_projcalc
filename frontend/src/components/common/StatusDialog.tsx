import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

type StatusAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "secondary" | "outline";
};

export type StatusModal = {
  type: "error" | "success";
  message: string;
  actions?: StatusAction[];
} | null;

type StatusDialogProps = {
  modal: StatusModal;
  onClose: () => void;
};

export function StatusDialog({ modal, onClose }: StatusDialogProps) {
  const hasActions = Boolean(modal?.actions?.length);

  return (
    <Dialog open={!!modal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {!modal ? null : modal.type === "error" ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span>Error</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Success</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="whitespace-pre-line">
            {modal?.message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {hasActions ? (
              modal?.actions?.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant ?? "default"}
                  onClick={() => {
                    action.onClick();
                    onClose();
                  }}
                >
                  {action.label}
                </Button>
              ))
            ) : (
              <Button onClick={onClose}>Okay</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
