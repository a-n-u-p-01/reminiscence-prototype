import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import apiClient from '../api/apiClient';

export function usePushNotifications(userId, isAuthenticated, navigateTo) {
  useEffect(() => {
    console.log('--- 🔍 Push Notification Hook Lifecycle Step ---');
    console.log('Checking parameters:', { userId, isAuthenticated, isNativePlatform: Capacitor.isNativePlatform() });

    // 1. Safety Guard: Web View Check
    if (!Capacitor.isNativePlatform()) {
      console.log('🛑 [Guard 1]: Running on Web/Vercel. Suppressing native push registration.');
      return;
    }

    // 2. Authentication Guard
    if (!isAuthenticated) {
      console.log('⚠️ [Guard 2]: User is NOT authenticated yet. Postponing push registration.');
      return;
    }

    console.log('🚀 [Passed Guards]: Starting device permission and FCM registration sequence...');

    const setupListeners = () => {
      console.log('🎧 Setting up Push Notification event listeners...');

      // Clean up any existing registration listeners before adding a new one
      PushNotifications.removeAllListeners();

      PushNotifications.addListener('registration', async (token) => {
        console.log('📱 Android Hardware Registered! Token Matrix:', token.value);
        
        // Setup payload structure
        const payload = {
          userId: userId,
          token: token.value
        };

        // 🛠️ Generate a mock curl log for clear debugging inside Logcat
        const baseUrl = apiClient.defaults.baseURL || 'http://YOUR_BACKEND_URL';
        const curlCommand = `curl -X POST "${baseUrl}/users/push-token" \\\n` +
                            `  -H "Content-Type: application/json" \\\n` +
                            `  -d '${JSON.stringify(payload, null, 2)}'`;
        
        console.log('📡 [API Request] Generated cURL Command:\n' + curlCommand);

        try {
          console.log(`⚡ Syncing token to Spring Boot API...`);
          const response = await apiClient.post('/users/push-token', payload);
          
          // 🍏 Log explicit success status and server metadata response
          console.log('✅ [API Response Success]:', {
            status: response.status,
            statusText: response.statusText,
            data: response.data
          });
        } catch (err) {
          // 🍎 Log clear error diagnosis payloads
          if (err.response) {
            console.error('❌ [API Response Error] Server returned an error status:', {
              status: err.response.status,
              data: err.response.data,
              headers: err.response.headers
            });
          } else if (err.request) {
            console.error('❌ [API Network Error] No response received from server. Request details:', err.request);
          } else {
            console.error('❌ [API Setup Error] Error setting up request configuration:', err.message);
          }
        }
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('🎯 User clicked/tapped a notification background action:', action.notification);
        const targetRoute = action.notification.data?.route;
        if (targetRoute && navigateTo) {
          console.log(`🧭 Routing user internally to: #${targetRoute}`);
          navigateTo(targetRoute);
        }
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('🔔 Foreground push intercepted live:', notification);
      });
    };

    const initializePush = async () => {
      try {
        console.log('📋 Checking current OS permission state...');
        let permStatus = await PushNotifications.checkPermissions();
        console.log('📊 Current Permission Status Object:', permStatus);
        
        if (permStatus.receive === 'prompt') {
          console.log('📣 Permission is "prompt". Triggering native OS dialogue prompt now...');
          permStatus = await PushNotifications.requestPermissions();
          console.log('🔄 Updated Permission Status After Prompt:', permStatus);
        } else {
          console.log(`ℹ️ Skipping prompt trigger. Status is already: "${permStatus.receive}"`);
        }

        if (permStatus.receive !== 'granted') {
          console.warn('❌ Push notification permissions were DENIED by the user or system configuration.');
          return;
        }

        // Setup the listeners right before registering
        setupListeners();

        console.log('📡 Registering hardware device configuration with Firebase/FCM gateway...');
        await PushNotifications.register();
        console.log('✔️ Capacitor Register call completed.');

      } catch (error) {
        console.error('💥 Critical breakdown during Capacitor push setup:', error);
      }
    };

    initializePush();

    return () => {
      if (Capacitor.isNativePlatform()) {
        console.log('🧹 Cleaning up push listeners on component unmount.');
        PushNotifications.removeAllListeners();
      }
    };
  }, [userId, isAuthenticated, navigateTo]);
}