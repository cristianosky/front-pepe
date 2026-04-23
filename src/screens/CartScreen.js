import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { COLORS, formatPrice } from '../theme';

export default function CartScreen({ navigation }) {
  const { items, total, updateQuantity, removeItem } = useCart();
  const insets = useSafeAreaInsets();

  if (items.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top }]}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptyText}>Agrega productos desde el menú</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.product.image ? (
              <Image source={{ uri: item.product.image }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderEmoji}>🍽️</Text>
              </View>
            )}

            <View style={styles.info}>
              <View style={styles.cardTop}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                <TouchableOpacity onPress={() => removeItem(item.key)}>
                  <Text style={styles.remove}>✕</Text>
                </TouchableOpacity>
              </View>

              {item.size && (
                <Text style={styles.meta}>Tamaño: {item.size.label}</Text>
              )}
              {item.extras.length > 0 && (
                <Text style={styles.meta} numberOfLines={1}>
                  Extras: {item.extras.map((e) => e.name).join(', ')}
                </Text>
              )}

              <View style={styles.cardBottom}>
                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    style={styles.qBtn}
                    onPress={() => updateQuantity(item.key, item.quantity - 1)}
                  >
                    <Text style={styles.qBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qBtn}
                    onPress={() => updateQuantity(item.key, item.quantity + 1)}
                  >
                    <Text style={styles.qBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.subtotal}>{formatPrice(item.unitPrice * item.quantity)}</Text>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total del pedido</Text>
          <Text style={styles.totalPrice}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutText}>Ir a pagar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  empty: {
    flex: 1,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { color: COLORS.gray, fontSize: 15, textAlign: 'center' },
  list: { padding: 16, paddingBottom: 8 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  image: {
    width: 100,
    alignSelf: 'stretch',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: 100,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.border,
  },
  placeholderEmoji: { fontSize: 32 },
  info: {
    flex: 1,
    padding: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  remove: { color: COLORS.error, fontSize: 18, fontWeight: 'bold' },
  meta: { color: COLORS.gray, fontSize: 12, marginBottom: 2 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qBtnText: { color: COLORS.yellow, fontSize: 18, fontWeight: 'bold' },
  quantity: { color: COLORS.white, fontSize: 15, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  subtotal: { color: COLORS.yellow, fontWeight: 'bold', fontSize: 15 },
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
  checkoutButton: {
    backgroundColor: COLORS.yellow,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  checkoutText: { color: COLORS.black, fontWeight: 'bold', fontSize: 17 },
});
