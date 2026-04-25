import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { staffAPI } from '../../services/api';
import { COLORS } from '../../theme';
import useAdminMenu from './useAdminMenu';
import AdminMenuModal from './AdminMenuModal';

const ROLE_CONFIG = {
  cocinero:   { label: 'Cocinero',   color: '#FF9800' },
  repartidor: { label: 'Repartidor', color: '#2196F3' },
};

function StaffCard({ user, onDelete }) {
  const config = ROLE_CONFIG[user.role];

  const handleDelete = () => {
    Alert.alert(
      'Eliminar usuario',
      `¿Eliminar a ${user.name}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(user.id) },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: config.color }]}>
          <Text style={styles.badgeText}>{config.label}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete}>
          <Text style={styles.deleteBtn}>Eliminar</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
    </View>
  );
}

export default function AdminStaffScreen({ navigation }) {
  const { menuOpen, closeMenu } = useAdminMenu(navigation);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await staffAPI.getAll();
      setStaff(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 14 }}
          onPress={() => navigation.navigate('AdminStaffForm')}
        >
          <Text style={{ color: COLORS.yellow, fontSize: 14, fontWeight: '600' }}>+ Nuevo</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleDelete = async (id) => {
    try {
      await staffAPI.remove(id);
      setStaff((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.yellow} />
      </View>
    );
  }

  return (
    <>
    <AdminMenuModal visible={menuOpen} onClose={closeMenu} navigation={navigation} currentRoute="AdminStaff" />
    <FlatList
      style={styles.container}
      data={staff}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.yellow} />}
      renderItem={({ item }) => <StaffCard user={item} onDelete={handleDelete} />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.empty}>No hay personal registrado</Text>
        </View>
      }
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: COLORS.black, fontSize: 12, fontWeight: '700' },
  deleteBtn: { color: COLORS.error, fontSize: 13, fontWeight: '600' },
  name: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  email: { color: COLORS.gray, fontSize: 13 },
  empty: { color: COLORS.gray, fontSize: 16 },
});
