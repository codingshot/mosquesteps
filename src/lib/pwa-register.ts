/**
 * Registers the PWA service worker and handles update/offline prompts.
 * Must be called from the app entry (main.tsx) so React and toast are available.
 */
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

export function registerPWA() {
  const updateSW = registerSW({
    onNeedRefresh() {
      toast("New version available", {
        description: "Reload to get the latest features and fixes.",
        action: {
          label: "Reload",
          onClick: () => updateSW(true),
        },
      });
    },
    onOfflineReady() {
      toast.success("Ready to work offline", {
        description: "MosqueSteps works without internet. Your data is cached.",
      });
    },
  });
}
