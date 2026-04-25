import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { COLORS } from '../theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminOrderDetailScreen from '../screens/admin/AdminOrderDetailScreen';
import AdminProductsScreen from '../screens/admin/AdminProductsScreen';
import AdminProductFormScreen from '../screens/admin/AdminProductFormScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminStaffScreen from '../screens/admin/AdminStaffScreen';
import AdminStaffFormScreen from '../screens/admin/AdminStaffFormScreen';
import CocinaScreen from '../screens/cocina/CocinaScreen';
import RepartidorScreen from '../screens/repartidor/RepartidorScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const DARK_HEADER = {
  headerStyle: { backgroundColor: COLORS.dark },
  headerTintColor: COLORS.white,
  headerTitleStyle: { fontWeight: 'bold' },
};

function HomeTabs() {
  const { itemCount } = useCart();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.dark, borderTopColor: COLORS.border },
        tabBarActiveTintColor: COLORS.yellow,
        tabBarInactiveTintColor: COLORS.gray,
      }}
    >
      <Tab.Screen
        name="Menu"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Menú',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🍽️</Text>,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Carrito',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🛒</Text>,
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.yellow, color: COLORS.black },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={DARK_HEADER}>
      <Stack.Screen name="AdminDashboard"   component={AdminDashboardScreen}   options={{ title: 'Dashboard' }} />
      <Stack.Screen name="AdminOrders"      component={AdminOrdersScreen}      options={{ title: 'Pedidos' }} />
      <Stack.Screen name="AdminProducts"    component={AdminProductsScreen}    options={{ title: 'Productos' }} />
      <Stack.Screen name="AdminStaff"       component={AdminStaffScreen}       options={{ title: 'Personal' }} />
      <Stack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} options={{ title: 'Detalle del pedido' }} />
      <Stack.Screen name="AdminProductForm" component={AdminProductFormScreen} options={{ title: 'Producto' }} />
      <Stack.Screen name="AdminStaffForm"   component={AdminStaffFormScreen}   options={{ title: 'Nuevo usuario' }} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={DARK_HEADER}>
      <Stack.Screen name="HomeTabs"    component={HomeTabs}           options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Detalle' }} />
      <Stack.Screen name="Checkout"    component={CheckoutScreen}     options={{ title: 'Confirmar pedido' }} />
      <Stack.Screen
        name="Confirmation"
        component={ConfirmationScreen}
        options={{ title: 'Tu pedido', headerLeft: () => null }}
      />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'Mis pedidos' }} />
    </Stack.Navigator>
  );
}

function CocinaStack() {
  return (
    <Stack.Navigator screenOptions={DARK_HEADER}>
      <Stack.Screen name="Cocina" component={CocinaScreen} options={{ title: 'Cocina' }} />
    </Stack.Navigator>
  );
}

function RepartidorStack() {
  return (
    <Stack.Navigator screenOptions={DARK_HEADER}>
      <Stack.Screen name="Repartidor" component={RepartidorScreen} options={{ title: 'Entregas' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigation() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack />
      ) : user.role === 'admin' ? (
        <AdminStack />
      ) : user.role === 'cocinero' ? (
        <CocinaStack />
      ) : user.role === 'repartidor' ? (
        <RepartidorStack />
      ) : (
        <AppStack />
      )}
    </NavigationContainer>
  );
}
