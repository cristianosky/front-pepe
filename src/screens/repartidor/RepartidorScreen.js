import React, { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { io } from 'socket.io-client';
import { repartidorAPI } from '../../services/api';
import { COLORS, formatPrice } from '../../theme';
import { SOCKET_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'Ahora mismo';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  return `Hace ${Math.floor(diff / 3600)} h`;
}

const STATUS_CONFIG = {
  listo:      { label: 'Listo',      color: '#FFD700', btnLabel: 'Recoger pedido 🛵', action: 'pickup' },
  en_reparto: { label: 'En reparto', color: '#9C27B0', btnLabel: 'Marcar entregado ✓', action: 'delivered' },
};

function OrderCard({ order, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const config = STATUS_CONFIG[order.status];

  const handleAction = () => {
    const isPickup = order.status === 'listo';
    Alert.alert(
      isPickup ? 'Recoger pedido' : 'Confirmar entrega',
      isPickup
        ? '¿Confirmás que recogiste este pedido?'
        : `¿Marcar pedido #${order.id.slice(0, 8).toUpperCase()} como entregado?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              if (isPickup) await repartidorAPI.pickup(order.id);
              else await repartidorAPI.markDelivered(order.id);
              onUpdate();
            } catch (e) {
              Alert.alert('Error', e.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.card, { borderLeftColor: config.color, borderLeftWidth: 3 }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.time}>{timeAgo(order.created_at)}</Text>
          <View style={[styles.badge, { backgroundColor: config.color }]}>
            <Text style={styles.badgeText}>{config.label}</Text>
          </View>
        </View>
      </View>

      <View style={styles.clientRow}>
        <Text style={styles.clientName}>{order.user_name}</Text>
        {order.user_phone ? (
          <Text style={styles.clientPhone}>{order.user_phone}</Text>
        ) : null}
      </View>

      <View style={styles.addressBox}>
        <Text style={styles.addressLabel}>Dirección</Text>
        <Text style={styles.address}>{order.address}</Text>
      </View>

      <Text style={styles.sectionLabel}>Ítems</Text>
      {order.items.map((item, i) => (
        <Text key={i} style={styles.item}>
          {item.quantity}× {item.product_name}
          {item.size ? ` (${item.size.label})` : ''}
        </Text>
      ))}

      {order.notes ? <Text style={styles.notes}>Nota: {order.notes}</Text> : null}

      <View style={styles.footer}>
        <Text style={styles.total}>{formatPrice(order.total)}</Text>
        <TouchableOpacity style={[styles.btn, order.status === 'en_reparto' && styles.btnGreen]} onPress={handleAction} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Text style={styles.btnText}>{config.btnLabel}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RepartidorScreen({ navigation }) {
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
      const data = await repartidorAPI.getOrders();
      setOrders(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
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
      renderItem={({ item }) => <OrderCard order={item} onUpdate={load} />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.empty}>Sin pedidos para entregar</Text>
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
  clientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientName: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  clientPhone: { color: COLORS.yellow, fontSize: 14 },
  addressBox: {
    backgroundColor: COLORS.dark,
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  addressLabel: { color: COLORS.gray, fontSize: 11, textTransform: 'uppercase', fontWeight: '600' },
  address: { color: COLORS.white, fontSize: 14 },
  sectionLabel: { color: COLORS.gray, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  item: { color: COLORS.lightGray, fontSize: 14 },
  notes: { color: COLORS.yellow, fontSize: 13, fontStyle: 'italic' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  total: { color: COLORS.yellow, fontSize: 20, fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: COLORS.black, fontSize: 11, fontWeight: '700' },
  btn: {
    backgroundColor: '#9C27B0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnGreen: { backgroundColor: COLORS.success },
  btnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
