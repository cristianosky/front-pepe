import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import { COLORS, formatPrice } from '../theme';

const PAYMENT_OPTIONS = [
  { value: 'efectivo',      label: '💵 Efectivo' },
  { value: 'tarjeta',       label: '💳 Tarjeta' },
  { value: 'nequi',         label: '📱 Nequi' },
  { value: 'transferencia', label: '🏦 Transferencia' },
];

export default function CheckoutScreen({ navigation }) {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();

  const [deliveryType, setDeliveryType] = useState('domicilio');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (deliveryType === 'domicilio' && !address.trim()) {
      Alert.alert('Error', 'Ingresa tu dirección de entrega');
      return;
    }

    const orderItems = items.map((i) => ({
      product_id: i.product.id,
      product_name: i.product.name,
      size: i.size?.label || null,
      extras: i.extras.map((e) => e.name),
      unit_price: i.unitPrice,
      quantity: i.quantity,
      subtotal: i.unitPrice * i.quantity,
    }));

    setLoading(true);
    try {
      const order = await ordersAPI.create({
        items: orderItems,
        deliveryType,
        address: deliveryType === 'domicilio' ? address.trim() : null,
        paymentMethod,
        notes: notes.trim(),
      });
      clearCart();
      navigation.replace('Confirmation', { orderId: order.id ?? order.order?.id });
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo crear el pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Tu pedido</Text>
        {items.map((item) => (
          <View key={item.key} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              {item.size && <Text style={styles.itemMeta}>{item.size.label}</Text>}
              {item.extras.length > 0 && (
                <Text style={styles.itemMeta}>{item.extras.map((e) => e.name).join(', ')}</Text>
              )}
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>{formatPrice(item.unitPrice * item.quantity)}</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Tipo de entrega</Text>
        <View style={styles.optionRow}>
          {['domicilio', 'recoger'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.option, deliveryType === type && styles.optionActive]}
              onPress={() => setDeliveryType(type)}
            >
              <Text style={[styles.optionText, deliveryType === type && styles.optionTextActive]}>
                {type === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {deliveryType === 'domicilio' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.sectionTitle}>Dirección</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu dirección completa"
              placeholderTextColor={COLORS.gray}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Método de pago</Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.paymentOption, paymentMethod === opt.value && styles.optionActive]}
              onPress={() => setPaymentMethod(opt.value)}
            >
              <Text style={[styles.optionText, paymentMethod === opt.value && styles.optionTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.sectionTitle}>Notas (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: sin cebolla, timbrar puerta 2..."
            placeholderTextColor={COLORS.gray}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={loading}>
          {loading
            ? <ActivityIndicator color={COLORS.black} />
            : <Text style={styles.confirmText}>Confirmar pedido</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 20, paddingBottom: 8 },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  itemMeta: { color: COLORS.gray, fontSize: 13, marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemQty: { color: COLORS.gray, fontSize: 13 },
  itemPrice: { color: COLORS.yellow, fontWeight: 'bold', fontSize: 15 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  optionRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  option: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: '45%',
    alignItems: 'center',
  },
  optionActive: { borderColor: COLORS.yellow, backgroundColor: '#2a2200' },
  optionText: { color: COLORS.gray, fontSize: 15, fontWeight: '600' },
  optionTextActive: { color: COLORS.yellow },
  fieldGroup: { marginTop: 16 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    color: COLORS.white,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.dark,
    gap: 16,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  totalPrice: { color: COLORS.yellow, fontSize: 22, fontWeight: 'bold' },
  confirmButton: {
    backgroundColor: COLORS.yellow,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmText: { color: COLORS.black, fontWeight: 'bold', fontSize: 17 },
});
