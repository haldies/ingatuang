import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // Deprecated, use shouldShowBanner instead
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export async function requestNotificationPermissions() {
  try {
    console.log('[NOTIF] Starting permission request...');
    console.log('[NOTIF] Platform:', Platform.OS);
    
    if (Platform.OS === 'android') {
      console.log('[NOTIF] Setting up Android notification channel...');
      const channel = await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });
      console.log('[NOTIF] Channel created:', channel);
    }

    console.log('[NOTIF] Checking existing permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('[NOTIF] Existing status:', existingStatus);
    
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('[NOTIF] Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('[NOTIF] Permission result:', status);
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[NOTIF] ❌ Permission DENIED');
      return false;
    }

    console.log('[NOTIF] ✅ Permission GRANTED');
    return true;
  } catch (error) {
    console.error('[NOTIF] ❌ Error requesting permissions:', error);
    return false;
  }
}

// Send local notification
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  try {
    console.log('[NOTIF] ========== SENDING NOTIFICATION ==========');
    console.log('[NOTIF] Title:', title);
    console.log('[NOTIF] Body:', body);
    console.log('[NOTIF] Data:', data);
    
    const hasPermission = await requestNotificationPermissions();
    console.log('[NOTIF] Has permission:', hasPermission);
    
    if (!hasPermission) {
      console.log('[NOTIF] ❌ No notification permission, aborting');
      return;
    }

    console.log('[NOTIF] Scheduling notification...');
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });

    console.log('[NOTIF] ✅ Notification scheduled successfully! ID:', identifier);
    return identifier;
  } catch (error) {
    console.error('[NOTIF] ❌ Error sending notification:', error);
    console.error('[NOTIF] Error details:', JSON.stringify(error, null, 2));
  }
}

// Schedule notification for future
export async function scheduleNotification(
  title: string,
  body: string,
  triggerDate: Date,
  data?: any
) {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('No notification permission');
      return;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: triggerDate,
    });

    console.log('Notification scheduled:', identifier);
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

// Cancel scheduled notification
export async function cancelNotification(identifier: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log('Notification cancelled:', identifier);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}
