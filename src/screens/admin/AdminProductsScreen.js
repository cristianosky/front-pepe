import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { adminAPI } from '../../services/api';
import { COLORS, formatPrice } from '../../theme';

function ProductRow({ product, onEdit, onToggle }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.rowMeta}>
          {formatPrice(product.price)}
          {product.featured ? ' · ⭐ Destacado' : ''}
          {!product.available ? ' · ❌ Inactivo' : ''}
        </Text>
        {product.category_name && (
          <Text style={styles.rowCategory}>{product.category_name}</Text>
        )}
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.editBtnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, product.available ? styles.toggleOff : styles.toggleOn]}
          onPress={onToggle}
        >
          <Text style={styles.toggleBtnText}>{product.available ? 'Desactivar' : 'Activar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminAPI.getProducts();
      setProducts(data);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const handleToggle = (product) => {
    Alert.alert(
      product.available ? 'Desactivar producto' : 'Activar producto',
      `¿${product.available ? 'Desactivar' : 'Activar'} "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await adminAPI.updateProduct(product.id, { available: !product.available });
              load();
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('AdminProductForm', { product: null })}
      >
        <Text style={styles.addBtnText}>+ Nuevo producto</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.yellow} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.yellow} />
          }
          renderItem={({ item }) => (
            <ProductRow
              product={item}
              onEdit={() => navigation.navigate('AdminProductForm', { product: item })}
              onToggle={() => handleToggle(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay productos aún.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  addBtn: {
    margin: 12,
    backgroundColor: COLORS.yellow,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  addBtnText: { color: COLORS.black, fontWeight: 'bold', fontSize: 15 },
  list: { paddingHorizontal: 12, paddingBottom: 24, gap: 10 },
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowInfo: { flex: 1 },
  rowName: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  rowMeta: { color: COLORS.gray, fontSize: 13, marginTop: 2 },
  rowCategory: { color: COLORS.yellow, fontSize: 12, marginTop: 2 },
  rowActions: { gap: 6 },
  editBtn: {
    backgroundColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  editBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  toggleBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  toggleOff: { backgroundColor: '#5a1a1a' },
  toggleOn: { backgroundColor: '#1a4a1a' },
  toggleBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },
  empty: { color: COLORS.gray, textAlign: 'center', marginTop: 60, fontSize: 15 },
});
