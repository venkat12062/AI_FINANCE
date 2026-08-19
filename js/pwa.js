// PWA Lifecycle and DOM UI Management

let deferredPrompt;

// Immediately unregister any old broken service workers and clear ALL caches
if ('serviceWorker' in navigator) {
    // Unregister all existing service workers first
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => {
            reg.unregister();
            console.log('[PWA] Unregistered old service worker:', reg.scope);
        });
    });

    // Clear all caches
    if ('caches' in window) {
        caches.keys().then(keys => {
            keys.forEach(key => {
                caches.delete(key);
                console.log('[PWA] Deleted cache:', key);
            });
        });
    }

    // Re-register the fresh service worker after clearing
    window.addEventListener('load', () => {
        setTimeout(() => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('[PWA] Service Worker registered:', registration.scope);

                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (installingWorker) {
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    showUpdateBanner();
                                }
                            };
                        }
                    };
                })
                .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
        }, 1000); // slight delay to ensure old workers are fully unregistered
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Offline/Online Indicators
    const createOfflineIndicator = () => {
        const banner = document.createElement('div');
        banner.id = 'offline-indicator';
        banner.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background-color: #f44336;
            color: white;
            text-align: center;
            padding: 10px;
            z-index: 9999;
            display: none;
            font-family: sans-serif;
            font-weight: bold;
        `;
        banner.innerText = 'You are currently offline. Changes will be synced later.';
        document.body.appendChild(banner);
        return banner;
    };

    const indicator = createOfflineIndicator();

    window.addEventListener('online', () => { indicator.style.display = 'none'; });
    window.addEventListener('offline', () => { indicator.style.display = 'block'; });

    if (!navigator.onLine) {
        indicator.style.display = 'block';
    }

    // App Install Button
    const installBtn = document.createElement('button');
    installBtn.id = 'pwa-install-btn';
    installBtn.innerText = 'Install App';
    installBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #4caf50;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        display: none;
        z-index: 9998;
        font-family: sans-serif;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(installBtn);

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.style.display = 'block';
    });

    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') console.log('[PWA] User accepted install');
            deferredPrompt = null;
            installBtn.style.display = 'none';
        }
    });

    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed');
        installBtn.style.display = 'none';
    });
});

function showUpdateBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%;
        background-color: #2196f3;
        color: white;
        text-align: center;
        padding: 15px;
        z-index: 10000;
        font-family: sans-serif;
        cursor: pointer;
    `;
    banner.innerText = 'New version available! Click here to refresh.';
    banner.onclick = () => window.location.reload(true);
    document.body.appendChild(banner);
}
