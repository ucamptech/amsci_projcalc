import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";
import { createPortal } from "react-dom";

type BusyOverlayContextValue = {
  isBusy: boolean;
  message: string;
  showBusy: (message?: string) => void;
  hideBusy: () => void;
  withBusy: <T>(work: () => Promise<T> | T, message?: string) => Promise<T>;
};

const BusyOverlayContext = createContext<BusyOverlayContextValue | undefined>(
  undefined,
);

export function BusyOverlayProvider({ children }: { children: ReactNode }) {
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("Processing...");

  const showBusy = useCallback((nextMessage?: string) => {
    setMessage(nextMessage?.trim() || "Processing...");
    setIsBusy(true);
  }, []);

  const hideBusy = useCallback(() => {
    setIsBusy(false);
    setMessage("Processing...");
  }, []);

  const withBusy = useCallback(
    async <T,>(work: () => Promise<T> | T, busyMessage?: string) => {
      showBusy(busyMessage);
      try {
        return await work();
      } finally {
        hideBusy();
      }
    },
    [hideBusy, showBusy],
  );

  const value = useMemo(
    () => ({
      isBusy,
      message,
      showBusy,
      hideBusy,
      withBusy,
    }),
    [hideBusy, isBusy, message, showBusy, withBusy],
  );

  return (
    <BusyOverlayContext.Provider value={value}>
      {children}
      <BusyOverlay isBusy={isBusy} message={message} />
    </BusyOverlayContext.Provider>
  );
}

function BusyOverlay({
  isBusy,
  message,
}: {
  isBusy: boolean;
  message: string;
}) {
  if (!isBusy || typeof document === "undefined") return null;

  return createPortal(
    <div className="bg-background/80 fixed inset-0 z-9999 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-card text-card-foreground border-border flex max-w-sm flex-col items-center gap-3 rounded-xl border px-6 py-5 shadow-lg">
        <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold">Please wait</div>
          <div className="text-muted-foreground text-sm">{message}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBusyOverlay() {
  const ctx = useContext(BusyOverlayContext);
  if (!ctx) {
    throw new Error("useBusyOverlay must be used within a BusyOverlayProvider");
  }
  return ctx;
}
