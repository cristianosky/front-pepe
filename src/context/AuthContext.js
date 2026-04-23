import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { registerForPushNotificationsAsync } from '../services/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await AsyncStorage.getItem('@pepe_token');
      if (token) {
        const data = await authAPI.me();
        const u = data.user ?? data;
        setUser(u);
        if (u.role === 'user') registerForPushNotificationsAsync();
      }
    } catch {
      await AsyncStorage.removeItem('@pepe_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    await AsyncStorage.setItem('@pepe_token', data.token);
    setUser(data.user);
    if (data.user.role === 'user') registerForPushNotificationsAsync();
  };

  const register = async (email, password, name) => {
    const data = await authAPI.register({ email, password, name });
    await AsyncStorage.setItem('@pepe_token', data.token);
    setUser(data.user);
    if (data.user.role === 'user') registerForPushNotificationsAsync();
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['@pepe_token', '@pepe_cart']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
