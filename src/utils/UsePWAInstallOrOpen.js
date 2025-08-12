import { useEffect, useState } from "react";

export function usePWAInstallOrOpen(appProtocolUrl) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Detect if installed
  useEffect(() => {
    async function checkInstalled() {
      console.log("Checking if app is installed...");
      console.log("User agent:", navigator.userAgent);
      console.log("Display mode:", window.matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser");

      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        return;
      }
      if (navigator.getInstalledRelatedApps()) {
        const relatedApps = await navigator.getInstalledRelatedApps();
        console.log('relatedApps:', relatedApps);

        if (relatedApps.length > 0) {
          setIsInstalled(true);
          return;
        }
      }
    }
    checkInstalled();
  }, []);

  // Capture install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Trigger install prompt
  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === "accepted";
  };

  // Open installed app
  const openApp = () => {
    if (!appProtocolUrl) return;
    window.location.href = appProtocolUrl;
  };

  return { isInstalled, promptInstall, openApp, canInstall: !!deferredPrompt };
}
