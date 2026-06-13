import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import apiClient from '../api/apiClient';

// Added userId parameter so your API registration payload doesn't throw a ReferenceError
export function usePushNotifications(isAuthenticated, navigateTo) {
  useEffect(() => {
    console.log('[PUSH DEBUG] useEffect fired.', { 
      isNative: Capacitor.isNativePlatform(), 
      isAuthenticated
    });

    // 1. Safety Guard: Web View / SSR Check
    if (!Capacitor.isNativePlatform()) {
      console.warn('[PUSH DEBUG] Aborted: This code is running in a web browser layout environment. Push tokens require a native platform sandbox (Android/iOS WebView).');
      return;
    }

    // 2. Authentication Guard
    if (!isAuthenticated) {
      console.warn('[PUSH DEBUG] Aborted: User is not authenticated. Skipping setup cycle.');
      return;
    }

    const setupListeners = () => {
      console.log('[PUSH DEBUG] Initializing listeners and wiping active listener tree allocations...');
      PushNotifications.removeAllListeners();

      // Device successfully linked with FCM / APNS gateway
      PushNotifications.addListener('registration', async (token) => {
        console.log('[PUSH DEBUG] Native Registration Token Acquired successfully:', token.value);
        try {
          console.log('[PUSH DEBUG] Dispatching token packet to API backend core...');
          await apiClient.post('/users/push-token', {
            token: token.value
          });
          console.log('[PUSH DEBUG] Token sync complete.');
        } catch (err) {
          console.error('[PUSH DEBUG] Failed to sync device token with backend engine:', err.message);
        }
      });

      // Interactive Action Triggers
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[PUSH DEBUG] Banner tapped by user. Action payload extracted:', action);
        const targetRoute = action.notification.data?.route;
        if (targetRoute && navigateTo) {
          console.log(`[PUSH DEBUG] Context redirect engine routing user onward to: ${targetRoute}`);
          navigateTo(targetRoute);
        } else {
          console.log('[PUSH DEBUG] Banner tapped but no valid target navigation route found in the metadata frame.', action.notification.data);
        }
      });

      // Live Foreground Interception
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[PUSH DEBUG] Incoming foreground package intercepted live:', notification);
      });
    };

    const initializePush = async () => {
      try {
        console.log('[PUSH DEBUG] Querying local operating system permission state database...');
        let permStatus = await PushNotifications.checkPermissions();
        console.log('[PUSH DEBUG] Initial check state returned:', permStatus);
        
        if (permStatus.receive === 'prompt') {
          console.log('[PUSH DEBUG] System state identifies as "prompt". Spawning active platform dialogue box now...');
          permStatus = await PushNotifications.requestPermissions();
          console.log('[PUSH DEBUG] Dialogue prompt closed. Updated user allocation status:', permStatus);
        }

        if (permStatus.receive !== 'granted') {
          console.error(`[PUSH DEBUG] Core Permission Denied or Revoked. Execution halted. Current status: "${permStatus.receive}"`);
          return;
        }

        console.log('[PUSH DEBUG] Permission state valid ("granted"). Commencing listener attachment loop...');
        setupListeners();
        
        console.log('[PUSH DEBUG] Requesting APNS/FCM device token registration array...');
        await PushNotifications.register();
        console.log('[PUSH DEBUG] Platform registration command issued to native thread.');

      } catch (error) {
        console.error('[PUSH DEBUG] Critical runtime crash inside Push Manager lifecycle setup sequence:', error);
      }
    };

    initializePush();

    return () => {
      if (Capacitor.isNativePlatform()) {
        console.log('[PUSH DEBUG] Hook lifecycle unmounting. Detaching listeners to prevent leakage paths.');
        PushNotifications.removeAllListeners();
      }
    };
  }, [isAuthenticated, navigateTo]);
}