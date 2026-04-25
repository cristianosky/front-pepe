import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { io } from 'socket.io-client';
import { adminAPI } from '../../services/api';
import { COLORS, formatPrice } from '../../theme';
import { SOCKET_URL } from '../../config';
import useAdminMenu from './useAdminMenu';
import AdminMenuModal from './AdminMenuModal';

const FILTERS = [
  { label: 'Todos',      value: null },
  { label: 'Recibido',   value: 'recibido' },
  { label: 'Preparando', value: 'en_preparacion' },
  { label: 'Listo',      value: 'listo' },
  { label: 'En reparto', value: 'en_reparto' },
  { label: 'Entregado',  value: 'entregado' },
  { label: 'Cancelado',  value: 'cancelado' },
];

const STATUS_CONFIG = {
  recibido:       { label: 'Recibido',    color: '#FF9800', next: 'en_preparacion', nextLabel: 'Iniciar preparación' },
  en_preparacion: { label: 'Preparando',  color: '#2196F3', next: 'listo',          nextLabel: 'Marcar listo' },
  listo:          { label: 'Listo',       color: COLORS.yellow, next: 'en_reparto', nextLabel: 'Salió a repartir' },
  en_reparto:     { label: 'En reparto',  color: '#9C27B0', next: 'entregado',      nextLabel: 'Marcar entregado' },
  entregado:      { label: 'Entregado',   color: COLORS.success, next: null,        nextLabel: null },
  cancelado:      { label: 'Cancelado',   color: COLORS.error,   next: null,        nextLabel: null },
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'Ahora mismo';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  return `Hace ${Math.floor(diff / 86400)} días`;
}

function OrderCard({ order, onStatusChange, onPress }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.recibido;
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    Alert.alert(
      'Cambiar estado',
      `¿Cambiar pedido a "${STATUS_CONFIG[config.next]?.label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              await adminAPI.updateOrderStatus(order.id, config.next);
              onStatusChange();
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        <View style={[styles.badge, { backgroundColor: config.color }]}>
          <Text style={styles.badgeText}>{config.label}</Text>
        </View>
      </View>

      <Text style={styles.userName}>{order.user_name}</Text>
      <Text style={styles.userEmail}>{order.user_email}</Text>

      <View style={styles.row}>
        <Text style={styles.detail}>
          {order.delivery_type === 'domicilio' ? '🛵 Domicilio' : '🏠 Recoger'}
        </Text>
        <Text style={styles.detail}>{timeAgo(order.created_at)}</Text>
      </View>

      {order.delivery_type === 'domicilio' && order.address ? (
        <Text style={styles.address}>{order.address}</Text>
      ) : null}

      {order.notes ? (
        <Text style={styles.notes}>Nota: {order.notes}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatPrice(order.total)}</Text>
        {config.next && (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.black} />
            ) : (
              <Text style={styles.nextBtnText}>{config.nextLabel} →</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function AdminOrdersScreen({ navigation }) {
  const { menuOpen, closeMenu } = useAdminMenu(navigation);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const filterRef = useRef(filter);
  filterRef.current = filter;


  const fetchOrders = useCallback(async () => {
    try {
      const data = await adminAPI.getOrders(filterRef.current);
      setOrders(data);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, [filter])
  );

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('new_order', (order) => {
      setOrders((prev) => {
        if (filterRef.current && order.status !== filterRef.current) return prev;
        return [order, ...prev];
      });
    });

    socket.on('order_status_changed', ({ id, status }) => {
      setOrders((prev) => {
        const updated = prev.map((o) => (o.id === id ? { ...o, status } : o));
        if (filterRef.current) return updated.filter((o) => o.status === filterRef.current);
        return updated;
      });
    });

    return () => socket.disconnect();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  return (
    <View style={styles.container}>
      <AdminMenuModal visible={menuOpen} onClose={closeMenu} navigation={navigation} currentRoute="AdminOrders" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={String(f.value)}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.yellow} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onStatusChange={fetchOrders}
              onPress={() => navigation.navigate('AdminOrderDetail', { order: item })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.yellow}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No hay pedidos{filter ? ' con este estado' : ''}.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  filters: { maxHeight: 52, flexGrow: 0 },
  filtersContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterChipActive: { backgroundColor: COLORS.yellow, borderColor: COLORS.yellow },
  filterText: { color: COLORS.gray, fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: COLORS.black },
  list: { padding: 12, gap: 12 },
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
  userName: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  userEmail: { color: COLORS.gray, fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  detail: { color: COLORS.lightGray, fontSize: 13 },
  address: { color: COLORS.gray, fontSize: 12, fontStyle: 'italic' },
  notes: { color: COLORS.gray, fontSize: 12, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  total: { color: COLORS.yellow, fontSize: 18, fontWeight: 'bold' },
  nextBtn: {
    backgroundColor: COLORS.yellow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nextBtnText: { color: COLORS.black, fontWeight: '700', fontSize: 13 },
  empty: { color: COLORS.gray, textAlign: 'center', marginTop: 60, fontSize: 15 },
});
