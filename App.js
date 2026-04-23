import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import SplashScreen from './src/screens/SplashScreen';
import RootNavigation from './src/navigation';

function AppContent() {
  const { loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone || loading) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <RootNavigation />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
