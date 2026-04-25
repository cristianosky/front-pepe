import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

const PROJECT_ID =
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.easConfig?.projectId ??
  '3df22a9f-f9fb-4dac-b29d-6b7ca1f19e6f';

export async function registerForPushNotificationsAsync() {
  // En Expo Go el módulo ni siquiera se carga para evitar el error de SDK 53+
  if (Constants.executionEnvironment === 'storeClient') return null;
  if (!Device.isDevice) return null;

  try {
    const Notifications = require('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Pepe Food',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD700',
      });
    }

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    await api.put('/auth/push-token', { pushToken });
    return pushToken;
  } catch (err) {
    console.error('[Push] ERROR:', err.message, err);
    return null;
  }
}
