import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

/** Site-wide offline indicator. Shown when user loses internet connection. */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 bg-amber-500 text-amber-950 px-4 py-2 text-sm font-medium shadow-md"
      role="alert"
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>You're offline — cached data available. Connect for latest prayer times & maps.</span>
    </div>
  );
}
