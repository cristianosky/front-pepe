import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

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

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync();
    await api.put('/auth/push-token', { pushToken });
    return pushToken;
  } catch {
    return null;
  }
}
