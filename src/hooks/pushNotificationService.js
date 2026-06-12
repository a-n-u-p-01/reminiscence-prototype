import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import apiClient from '../api/apiClient';

export function usePushNotifications(userId, isAuthenticated, navigateTo) {
  useEffect(() => {
    // 1. Safety Guard: Web View / SSR Check
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // 2. Authentication Guard
    if (!isAuthenticated || !userId) {
      return;
    }

    const setupListeners = () => {
      // Clear out active references before attaching new ones to avoid listener leakages
      PushNotifications.removeAllListeners();

      // Device successfully linked with FCM / APNS gateway
      PushNotifications.addListener('registration', async (token) => {
        try {
          await apiClient.post('/users/push-token', {
            userId: userId,
            token: token.value
          });
        } catch (err) {
          // Minimal system tracking for remote troubleshooting logs
          console.error('Failed to sync device token with backend engine:', err.message);
        }
      });

      // Interactive Action Triggers (User clicked the background banner notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const targetRoute = action.notification.data?.route;
        if (targetRoute && navigateTo) {
          navigateTo(targetRoute);
        }
      });

      // Live Foreground Interception
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        // Handle in-app banner behavior here if desired
      });
    };

    const initializePush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          return;
        }

        setupListeners();
        await PushNotifications.register();

      } catch (error) {
        console.error('Error initialization context mapping within Push Manager:', error);
      }
    };

    initializePush();

    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [userId, isAuthenticated, navigateTo]);
}