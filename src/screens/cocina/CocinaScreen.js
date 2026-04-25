import React, { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { io } from 'socket.io-client';
import { cocinaAPI } from '../../services/api';
import { COLORS } from '../../theme';
import { SOCKET_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  recibido:       { label: 'Nuevo',       color: '#FF9800', btnLabel: 'Iniciar preparación' },
  en_preparacion: { label: 'Preparando',  color: '#2196F3', btnLabel: 'Marcar listo' },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'Ahora mismo';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  return `Hace ${Math.floor(diff / 3600)} h`;
}

function OrderCard({ order, onAdvance }) {
  const config = STATUS_CONFIG[order.status];
  const [loading, setLoading] = useState(false);

  const handleAdvance = () => {
    Alert.alert('Confirmar', `¿${config.btnLabel}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setLoading(true);
          try {
            await cocinaAPI.nextStatus(order.id);
            onAdvance();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.time}>{timeAgo(order.created_at)}</Text>
          <View style={[styles.badge, { backgroundColor: config.color }]}>
            <Text style={styles.badgeText}>{config.label}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Ítems</Text>
      {order.items.map((item, i) => (
        <Text key={i} style={styles.item}>
          {item.quantity}× {item.product_name}
          {item.size ? ` (${item.size.label})` : ''}
          {item.extras?.length ? ` + ${item.extras.map(e => e.name).join(', ')}` : ''}
        </Text>
      ))}

      {order.notes ? (
        <Text style={styles.notes}>Nota: {order.notes}</Text>
      ) : null}

      <Text style={styles.delivery}>
        {order.delivery_type === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger en tienda'}
      </Text>

      <TouchableOpacity style={styles.btn} onPress={handleAdvance} disabled={loading}>
        {loading
          ? <ActivityIndicator size="small" color={COLORS.black} />
          : <Text style={styles.btnText}>{config.btnLabel} →</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

export default function CocinaScreen({ navigation }) {
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 14 }}
          onPress={() =>
            Alert.alert('Cerrar sesión', '¿Estás seguro?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Salir', style: 'destructive', onPress: logout },
            ])
          }
        >
          <Text style={{ color: COLORS.error, fontSize: 14, fontWeight: '600' }}>Salir</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

  const load = useCallback(async () => {
    try {
      const data = await cocinaAPI.getOrders();
      setOrders(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('new_order', () => load());
    socket.on('order_status_changed', () => load());
    return () => socket.disconnect();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.yellow} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.yellow} />}
      renderItem={({ item }) => <OrderCard order={item} onAdvance={load} />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.empty}>Sin pedidos pendientes</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  list: { padding: 12, gap: 12 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { color: COLORS.white, fontWeight: 'bold', fontSize: 16, fontFamily: 'monospace' },
  time: { color: COLORS.gray, fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: COLORS.black, fontSize: 12, fontWeight: '700' },
  sectionLabel: { color: COLORS.gray, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  item: { color: COLORS.white, fontSize: 15 },
  notes: { color: COLORS.yellow, fontSize: 13, fontStyle: 'italic' },
  delivery: { color: COLORS.lightGray, fontSize: 13 },
  btn: {
    backgroundColor: COLORS.yellow,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: { color: COLORS.black, fontWeight: '700', fontSize: 14 },
  empty: { color: COLORS.gray, fontSize: 16 },
});
