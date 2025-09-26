"use client";

import { useEffect, useState } from 'react';

export default function PWAClient() {
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    // Only register SW in production
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        if (reg.waiting) setUpdateReady(true);
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      }).catch(() => {});

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          window.location.reload();
          refreshing = true;
        }
      });
    }

    const onBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const applyUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[env(safe-area-inset-bottom)] flex flex-col items-center gap-2 pointer-events-none">
      {!isOnline && (
        <div className="pointer-events-auto bg-black text-white text-sm px-3 py-2 rounded-md shadow">
          You are offline. Some features may be unavailable.
        </div>
      )}
      {installEvent && (
        <button onClick={triggerInstall} className="pointer-events-auto bg-red-600 text-white text-sm px-3 py-2 rounded-md shadow">
          Install app
        </button>
      )}
      {updateReady && (
        <button onClick={applyUpdate} className="pointer-events-auto bg-amber-500 text-white text-sm px-3 py-2 rounded-md shadow">
          Update available — Reload
        </button>
      )}
    </div>
  );
}


