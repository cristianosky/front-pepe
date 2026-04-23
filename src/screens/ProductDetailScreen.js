import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { COLORS, formatPrice } from '../theme';

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addItem } = useCart();

  const sizes = product.sizes || [];
  const extras = product.extras || [];

  const [selectedSize, setSelectedSize] = useState(sizes[0] || null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [quantity, setQuantity] = useState(1);

  const toggleExtra = (extra) => {
    setSelectedExtras((prev) =>
      prev.find((e) => e.name === extra.name)
        ? prev.filter((e) => e.name !== extra.name)
        : [...prev, extra]
    );
  };

  const unitPrice =
    product.price +
    (selectedSize?.priceModifier || 0) +
    selectedExtras.reduce((sum, e) => sum + e.price, 0);

  const handleAddToCart = () => {
    addItem(product, selectedSize, selectedExtras, quantity);
    Alert.alert('¡Listo!', `${product.name} agregado al carrito`, [
      { text: 'Seguir viendo', style: 'cancel' },
      { text: 'Ver carrito', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>🍽️</Text>
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>
          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}
          <Text style={styles.basePrice}>Precio base: {formatPrice(product.price)}</Text>

          {sizes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tamaño</Text>
              {sizes.map((size) => (
                <TouchableOpacity
                  key={size.label}
                  style={[styles.option, selectedSize?.label === size.label && styles.optionActive]}
                  onPress={() => setSelectedSize(size)}
                >
                  <Text style={[styles.optionText, selectedSize?.label === size.label && styles.optionTextActive]}>
                    {size.label}
                  </Text>
                  {size.priceModifier !== 0 && (
                    <Text style={[styles.optionPrice, selectedSize?.label === size.label && styles.optionTextActive]}>
                      {size.priceModifier > 0 ? '+' : ''}{formatPrice(size.priceModifier)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {extras.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Extras</Text>
              {extras.map((extra) => {
                const selected = !!selectedExtras.find((e) => e.name === extra.name);
                return (
                  <TouchableOpacity
                    key={extra.name}
                    style={[styles.option, selected && styles.optionActive]}
                    onPress={() => toggleExtra(extra)}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextActive]}>
                      {extra.name}
                    </Text>
                    <Text style={[styles.optionPrice, selected && styles.optionTextActive]}>
                      +{formatPrice(extra.price)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cantidad</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.qBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.qBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantity}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qBtn}
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Text style={styles.qBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{formatPrice(unitPrice * quantity)}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
          <Text style={styles.addButtonText}>Agregar al carrito</Text>
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
  image: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  body: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  description: {
    color: COLORS.gray,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  basePrice: {
    color: COLORS.yellow,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionActive: {
    borderColor: COLORS.yellow,
    backgroundColor: '#2a2200',
  },
  optionText: {
    color: COLORS.white,
    fontSize: 15,
  },
  optionTextActive: {
    color: COLORS.yellow,
    fontWeight: 'bold',
  },
  optionPrice: {
    color: COLORS.gray,
    fontSize: 14,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  qBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qBtnText: {
    color: COLORS.yellow,
    fontSize: 22,
    fontWeight: 'bold',
  },
  quantity: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.dark,
  },
  totalLabel: {
    color: COLORS.gray,
    fontSize: 13,
  },
  totalPrice: {
    color: COLORS.yellow,
    fontSize: 22,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: COLORS.yellow,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
