import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, Alert, Animated,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme';

const ITEMS = [
  { name: 'AdminDashboard', label: 'Dashboard', icon: '📊' },
  { name: 'AdminOrders',    label: 'Pedidos',   icon: '📋' },
  { name: 'AdminProducts',  label: 'Productos', icon: '🍔' },
  { name: 'AdminStaff',     label: 'Personal',  icon: '👥' },
];

export default function AdminMenuModal({ visible, onClose, navigation, currentRoute }) {
  const { logout } = useAuth();
  const slideAnim = useRef(new Animated.Value(-260)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -260,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [visible]);

  const navigate = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  const handleLogout = () => {
    onClose();
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Pepe Food</Text>
            <Text style={styles.subtitle}>Administración</Text>
          </View>

          {ITEMS.map((item) => {
            const active = currentRoute === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                style={[styles.item, active && styles.itemActive]}
                onPress={() => navigate(item.name)}
              >
                <Text style={[styles.itemText, active && styles.itemTextActive]}>
                  {item.icon}  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.item} onPress={handleLogout}>
              <Text style={[styles.itemText, { color: COLORS.error }]}>🚪  Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 260,
    backgroundColor: COLORS.surface,
    paddingTop: 50,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  title: { color: COLORS.yellow, fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: COLORS.gray, fontSize: 13, marginTop: 2 },
  item: { paddingHorizontal: 20, paddingVertical: 15 },
  itemActive: { backgroundColor: COLORS.dark },
  itemText: { color: COLORS.white, fontSize: 16 },
  itemTextActive: { color: COLORS.yellow, fontWeight: '700' },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
