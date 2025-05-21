"use client"

import { useEffect, useState } from "react"
import { useVendor } from "@/lib/context/vendor-provider"
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase/messaging"
import { toast } from "@/components/ui/use-toast"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export default function FCMInitializer() {
  const { isAuthenticated, vendor } = useVendor()
  const [notificationsInitialized, setNotificationsInitialized] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isTestAccount, setIsTestAccount] = useState(false)

  // Client-side only mounting check
  useEffect(() => {
    setIsMounted(true)

    // Check if this is a test account based on cookies
    if (typeof document !== 'undefined') {
      const isTestMode = document.cookie.includes('testMode=true');
      setIsTestAccount(isTestMode);
    }
  }, [])

  // Skip all Firebase operations for test accounts
  useEffect(() => {
    if (isMounted && vendor && vendor.id === 'test-vendor-id') {
      console.log("Test account detected, skipping FCM initialization");
      setIsTestAccount(true);
    }
  }, [isMounted, vendor]);

  // Register service worker - only on client side after mount
  useEffect(() => {
    // Skip for test accounts or development mode
    if (!isMounted || isTestAccount || process.env.NODE_ENV === 'development') {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
            console.log('Service Worker registered with scope:', registration.scope)

            // Pass Firebase config to service worker
            if (registration.active) {
              registration.active.postMessage({
                type: 'FIREBASE_CONFIG',
                config: {
                  FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                  FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                  FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                  FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                  FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
                  FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
                  FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
                }
              })
            }
          } catch (swError) {
            console.error('Service worker registration failed:', swError);
          }
        }
      } catch (error) {
        // Non-critical error - don't block the app
        console.error('Service worker registration failed:', error)
      }
    }

    // Only register service worker in production
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      registerServiceWorker().catch(err => {
        console.error("Failed to register service worker:", err);
      });
    }
  }, [isMounted, isTestAccount])

  // Initialize notifications when vendor is authenticated - only on client side
  useEffect(() => {
    // Skip for development mode or test accounts
    if (!isMounted || !isAuthenticated || !vendor || isTestAccount || process.env.NODE_ENV === 'development') {
      return;
    }

    // Skip if already initialized
    if (notificationsInitialized) return;

    let isActive = true; // For avoiding state updates after unmount

    const initializeNotifications = async () => {
      try {
        // Don't initialize for test account
        if (vendor.id === 'test-vendor-id') {
          console.log("Skipping FCM for test account");
          if (isActive) setNotificationsInitialized(true);
          return;
        }

        const result = await requestNotificationPermission();

        if (!isActive) return; // Bail if component unmounted

        if (result.success && result.token) {
          // Try to save FCM token to vendor document
          try {
            await setDoc(
              doc(db, "vendors", vendor.id),
              { fcmToken: result.token },
              { merge: true }
            );
          } catch (dbError) {
            console.error("Error saving FCM token to Firestore:", dbError);
            // Continue anyway since this is not critical
          }

          // Set up message listener for foreground messages
          try {
            const unsubscribe = onForegroundMessage((payload) => {
              console.log('Received foreground message:', payload)

              // Show toast notification
              toast({
                title: payload.notification?.title || "New Order",
                description: payload.notification?.body || "You have a new order!",
                duration: 5000,
              })
            });

            if (isActive) setNotificationsInitialized(true);
          } catch (msgError) {
            console.error("Error setting up foreground message handler:", msgError);
          }
        } else {
          console.warn('Failed to initialize notifications:', result.error)
        }
      } catch (error) {
        // Non-critical error - don't block the app
        console.error('Error initializing notifications:', error)
      }
    }

    // Run asynchronously with error handling
    initializeNotifications().catch(err => {
      console.error("Failed to initialize notifications:", err);
    });

    return () => {
      isActive = false;
    };
  }, [isMounted, isAuthenticated, vendor, notificationsInitialized, isTestAccount])

  // This component doesn't render anything
  return null
} 