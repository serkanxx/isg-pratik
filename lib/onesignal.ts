'use client';

import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';

const ONESIGNAL_APP_ID = '1d38e00c-28a9-4b64-9f67-b2d676ef3857';

/**
 * Standalone (PWA yüklü) modunu kontrol eder
 */
function isStandaloneMode(): boolean {
    if (typeof window === 'undefined') return false;

    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    // @ts-expect-error - iOS Safari specific
    const iosStandalone = window.navigator.standalone === true;

    return standalone || iosStandalone;
}

/**
 * Mobil cihaz kontrolü
 */
function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function useOneSignal() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Sadece mobil + standalone modda (PWA yüklü) başlat
        const standalone = isStandaloneMode();
        const mobile = isMobileDevice();

        setIsStandalone(standalone);

        // Normal web sitesinde OneSignal'ı hiç başlatma
        if (!standalone || !mobile) {
            console.log('[OneSignal] Skipped - not in standalone PWA mode');
            return;
        }

        const initOneSignal = async () => {
            try {
                await OneSignal.init({
                    appId: ONESIGNAL_APP_ID,
                    allowLocalhostAsSecureOrigin: true,
                    // Otomatik izin istemeyi kapat
                    autoResubscribe: false,
                    welcomeNotification: {
                        title: 'İSG Pratik',
                        message: 'Bildirimlere abone oldunuz! 🎉',
                    },
                });

                setIsInitialized(true);

                // Subscription durumunu kontrol et
                const subscribed = await OneSignal.User.PushSubscription.optedIn;
                setIsSubscribed(subscribed || false);

                // Subscription değişikliklerini dinle
                OneSignal.User.PushSubscription.addEventListener('change', (event) => {
                    setIsSubscribed(event.current.optedIn || false);
                });

                console.log('[OneSignal] Initialized in standalone PWA mode');

            } catch (error) {
                console.error('[OneSignal] Initialization error:', error);
            }
        };

        initOneSignal();
    }, []);

    const requestPermission = async () => {
        if (!isInitialized) return false;

        try {
            await OneSignal.Notifications.requestPermission();
            const subscribed = await OneSignal.User.PushSubscription.optedIn;
            setIsSubscribed(subscribed || false);
            return subscribed || false;
        } catch (error) {
            console.error('[OneSignal] Permission request error:', error);
            return false;
        }
    };

    return {
        isInitialized,
        isSubscribed,
        isStandalone,
        requestPermission,
    };
}
