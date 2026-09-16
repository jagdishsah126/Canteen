/**
 * Pure client-side browser Notification API helper for meal reminders.
 * 100% offline, privacy-first, no external push server needed.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
}

export function sendLocalNotification(title: string, body: string): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'wrc-canteen-reminder',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('Failed to send notification:', err);
    return false;
  }
}

export function testMealNotification(): boolean {
  return sendLocalNotification(
    '🍱 WRC Hostel Reminder Test',
    'Reminders are working perfectly! You will receive gentle meal logging prompts at your scheduled times.'
  );
}
