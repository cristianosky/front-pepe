import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import { COLORS, formatPrice } from '../theme';

const STATUS_CONFIG = {
  recibido:       { label: 'Recibido',    color: '#FF9800' },
  en_preparacion: { label: 'Preparando',  color: '#2196F3' },
  listo:          { label: 'Listo',       color: COLORS.yellow },
  en_reparto:     { label: 'En reparto',  color: '#9C27B0' },
  entregado:      { label: 'Entregado',   color: COLORS.success },
  cancelado:      { label: 'Cancelado',   color: COLORS.error },
};

function OrderCard({ order, onPress, onCancelled }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.recibido;
  const date = new Date(order.created_at).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const itemCount = order.items?.length ?? 0;

  const handleCancel = () => {
    Alert.alert(
      'Cancelar pedido',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ordersAPI.cancel(order.id);
              onCancelled();
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: config.color }]}>
          <Text style={styles.badgeText}>{config.label}</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {date} · {order.delivery_type === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger'} · {itemCount} ítem{itemCount !== 1 ? 's' : ''}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatPrice(order.total)}</Text>
        {order.status === 'recibido' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function OrderHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ordersAPI.getByUser(user.id);
      setOrders(data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.id]);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.yellow} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.yellow} />
      }
      renderItem={({ item }) => (
        <OrderCard
          order={item}
          onPress={() => navigation.navigate('Confirmation', { orderId: item.id })}
          onCancelled={load}
        />
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.empty}>Aún no tienes pedidos</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
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
  orderId: { color: COLORS.white, fontWeight: 'bold', fontSize: 15, fontFamily: 'monospace' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: COLORS.black, fontSize: 12, fontWeight: '700' },
  meta: { color: COLORS.gray, fontSize: 13 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { color: COLORS.yellow, fontSize: 18, fontWeight: 'bold' },
  cancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelBtnText: { color: COLORS.error, fontSize: 13, fontWeight: '600' },
  empty: { color: COLORS.gray, fontSize: 16, textAlign: 'center' },
});
