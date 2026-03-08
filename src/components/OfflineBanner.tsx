import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, X } from "lucide-react";

/** Site-wide offline indicator with retry and dismiss. */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); setDismissed(false); };
    const handleOffline = () => { setIsOnline(false); setDismissed(false); };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await fetch("/favicon.ico", { cache: "no-store" });
      setIsOnline(true);
    } catch {
      // still offline
    }
    setRetrying(false);
  };

  if (isOnline || dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-amber-500 text-amber-950 px-4 py-2 text-sm font-medium shadow-md"
      role="alert"
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>You're offline — cached data available.</span>
      <button
        onClick={handleRetry}
        className="ml-1 px-2 py-0.5 rounded bg-amber-600/30 hover:bg-amber-600/50 transition-colors text-xs font-semibold inline-flex items-center gap-1"
        disabled={retrying}
      >
        <RefreshCw className={`w-3 h-3 ${retrying ? "animate-spin" : ""}`} />
        Retry
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="ml-1 p-0.5 rounded hover:bg-amber-600/30 transition-colors"
        aria-label="Dismiss offline banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
