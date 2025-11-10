/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type BusyContextType = {
  begin: () => void;
  end: () => void;
  isBusy: boolean;
};

const BusyContext = createContext<BusyContextType | null>(null);

export function BusyOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(0);

  const begin = useCallback(() => setCount((c) => c + 1), []);
  const end = useCallback(() => setCount((c) => (c > 0 ? c - 1 : 0)), []);

  const isBusy = count > 0;

  const value = useMemo(() => ({ begin, end, isBusy }), [begin, end, isBusy]);

  return (
    <BusyContext.Provider value={value}>
      {children}
      {isBusy && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-xl dark:bg-neutral-900">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-transparent" />
            <p className="text-sm text-gray-700 dark:text-gray-200">
              Processing... please wait
            </p>
          </div>
        </div>
      )}
    </BusyContext.Provider>
  );
}

export function useBusyOverlay() {
  const ctx = useContext(BusyContext);
  if (!ctx)
    throw new Error("useBusyOverlay must be used within BusyOverlayProvider");
  return ctx;
}
