import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { io } from 'socket.io-client';
import { adminAPI } from '../../services/api';
import { COLORS, formatPrice } from '../../theme';
import { SOCKET_URL } from '../../config';

const STATUS_CONFIG = {
  recibido:       { label: 'Recibido',   color: '#FF9800', next: 'en_preparacion', nextLabel: 'Iniciar preparación' },
  en_preparacion: { label: 'Preparando', color: '#2196F3', next: 'listo',          nextLabel: 'Marcar listo' },
  listo:          { label: 'Listo',      color: COLORS.yellow, next: 'en_reparto', nextLabel: 'Salió a repartir' },
  en_reparto:     { label: 'En reparto', color: '#9C27B0', next: 'entregado',      nextLabel: 'Marcar entregado' },
  entregado:      { label: 'Entregado',  color: COLORS.success, next: null,        nextLabel: null },
  cancelado:      { label: 'Cancelado',  color: COLORS.error,   next: null,        nextLabel: null },
};

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function AdminOrderDetailScreen({ route, navigation }) {
  const [order, setOrder] = useState(route.params.order);
  const [loading, setLoading] = useState(false);
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.recibido;

  useEffect(() => {
    navigation.setOptions({ title: `Pedido #${order.id.slice(0, 8).toUpperCase()}` });
  }, [order.id]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('order_status_changed', ({ id, status }) => {
      if (id === order.id) setOrder((prev) => ({ ...prev, status }));
    });
    return () => socket.disconnect();
  }, [order.id]);

  const handleNext = () => {
    Alert.alert(
      'Cambiar estado',
      `¿Cambiar a "${STATUS_CONFIG[config.next]?.label}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setLoading(true);
            try {
              const updated = await adminAPI.updateOrderStatus(order.id, config.next);
              setOrder((prev) => ({ ...prev, status: updated.status }));
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

  const createdAt = new Date(order.created_at).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Estado */}
      <View style={styles.statusRow}>
        <View style={[styles.badge, { backgroundColor: config.color }]}>
          <Text style={styles.badgeText}>{config.label}</Text>
        </View>
        <Text style={styles.date}>{createdAt}</Text>
      </View>

      {/* Cliente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <Row label="Nombre" value={order.user_name} />
        <Row label="Email"  value={order.user_email} />
        {order.user_phone ? <Row label="Teléfono" value={order.user_phone} /> : null}
      </View>

      {/* Entrega */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Entrega</Text>
        <Row label="Tipo" value={order.delivery_type === 'domicilio' ? '🛵 Domicilio' : '🏠 Recoger en tienda'} />
        {order.delivery_type === 'domicilio' && <Row label="Dirección" value={order.address} />}
        <Row label="Pago" value={order.payment_method === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta'} />
        {order.notes ? <Row label="Nota" value={order.notes} /> : null}
      </View>

      {/* Ítems */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ítems</Text>
        {order.items.map((item, i) => (
          <View key={i} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>×{item.quantity}</Text>
            </View>
            {item.size ? <Text style={styles.itemMeta}>Tamaño: {item.size}</Text> : null}
            {item.extras?.length > 0 && (
              <Text style={styles.itemMeta}>Extras: {item.extras.join(', ')}</Text>
            )}
            <Text style={styles.itemSubtotal}>{formatPrice(item.subtotal)}</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
      </View>

      {/* Botón siguiente estado */}
      {config.next && (
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.black} />
            : <Text style={styles.nextBtnText}>{config.nextLabel} →</Text>
          }
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  content: { padding: 16, gap: 16 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14 },
  badgeText: { color: COLORS.black, fontWeight: '700', fontSize: 13 },
  date: { color: COLORS.gray, fontSize: 13 },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  sectionTitle: { color: COLORS.yellow, fontWeight: '700', fontSize: 13, marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: COLORS.gray, fontSize: 13, flexShrink: 0 },
  rowValue: { color: COLORS.white, fontSize: 13, textAlign: 'right', flex: 1 },
  itemCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 8,
    padding: 10,
    gap: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { color: COLORS.white, fontWeight: '600', fontSize: 14, flex: 1 },
  itemQty: { color: COLORS.yellow, fontWeight: '700', fontSize: 14 },
  itemMeta: { color: COLORS.gray, fontSize: 12 },
  itemSubtotal: { color: COLORS.lightGray, fontSize: 13, fontWeight: '500', marginTop: 2 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  totalValue: { color: COLORS.yellow, fontSize: 22, fontWeight: 'bold' },
  nextBtn: {
    backgroundColor: COLORS.yellow,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  nextBtnText: { color: COLORS.black, fontWeight: '700', fontSize: 15 },
});
