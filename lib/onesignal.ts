'use client';

import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';

const ONESIGNAL_APP_ID = '1d38e00c-28a9-4b64-9f67-b2d676ef3857';

export function useOneSignal() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        const initOneSignal = async () => {
            // Sadece production'da veya HTTPS'de çalışır
            if (typeof window === 'undefined') return;

            try {
                await OneSignal.init({
                    appId: ONESIGNAL_APP_ID,
                    allowLocalhostAsSecureOrigin: true,
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
        requestPermission,
    };
}
