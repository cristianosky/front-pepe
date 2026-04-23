import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { adminAPI, categoriesAPI } from '../../services/api';
import { COLORS, formatPrice } from '../../theme';

export default function AdminProductFormScreen({ route, navigation }) {
  const editing = route.params?.product ?? null;

  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [price, setPrice] = useState(editing ? String(editing.price) : '');
  const [image, setImage] = useState(editing?.image ?? '');
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? null);
  const [available, setAvailable] = useState(editing?.available ?? true);
  const [featured, setFeatured] = useState(editing?.featured ?? false);
  const [extras, setExtras] = useState(editing?.extras ?? []);
  const [sizes, setSizes] = useState(editing?.sizes ?? []);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Editar producto' : 'Nuevo producto' });
    categoriesAPI.getAll().then(setCategories).catch(() => {});
  }, []);

  const addExtra = () => setExtras((prev) => [...prev, { name: '', price: 0 }]);
  const removeExtra = (i) => setExtras((prev) => prev.filter((_, idx) => idx !== i));
  const updateExtra = (i, field, val) =>
    setExtras((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: field === 'price' ? Number(val) || 0 : val } : e));

  const addSize = () => setSizes((prev) => [...prev, { label: '', priceModifier: 0 }]);
  const removeSize = (i) => setSizes((prev) => prev.filter((_, idx) => idx !== i));
  const updateSize = (i, field, val) =>
    setSizes((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: field === 'priceModifier' ? Number(val) || 0 : val } : s));

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'El nombre es requerido');
    if (!price || isNaN(Number(price))) return Alert.alert('Error', 'El precio debe ser un número');

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category_id: categoryId,
      image: image.trim(),
      available,
      featured,
      extras: extras.filter((e) => e.name.trim()),
      sizes: sizes.filter((s) => s.label.trim()),
    };

    setSaving(true);
    try {
      if (editing) {
        await adminAPI.updateProduct(editing.id, payload);
      } else {
        await adminAPI.createProduct(payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Text style={styles.label}>Nombre *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre del producto" placeholderTextColor={COLORS.gray} />

      <Text style={styles.label}>Descripción</Text>
      <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} placeholder="Descripción opcional" placeholderTextColor={COLORS.gray} multiline />

      <Text style={styles.label}>Precio (COP) *</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Ej: 12000" placeholderTextColor={COLORS.gray} keyboardType="numeric" />

      <Text style={styles.label}>URL de imagen</Text>
      <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="https://..." placeholderTextColor={COLORS.gray} autoCapitalize="none" />

      <Text style={styles.label}>Categoría</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <TouchableOpacity
          style={[styles.chip, !categoryId && styles.chipActive]}
          onPress={() => setCategoryId(null)}
        >
          <Text style={[styles.chipText, !categoryId && styles.chipTextActive]}>Sin categoría</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, categoryId === cat.id && styles.chipActive]}
            onPress={() => setCategoryId(cat.id)}
          >
            <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>
              {cat.name || cat.slug}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.toggleRow}>
        <Text style={styles.label}>Disponible</Text>
        <Switch value={available} onValueChange={setAvailable} trackColor={{ true: COLORS.success }} thumbColor={COLORS.white} />
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.label}>Destacado ⭐</Text>
        <Switch value={featured} onValueChange={setFeatured} trackColor={{ true: COLORS.yellow }} thumbColor={COLORS.white} />
      </View>

      {/* Extras */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Extras</Text>
        <TouchableOpacity style={styles.addRowBtn} onPress={addExtra}>
          <Text style={styles.addRowBtnText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>
      {extras.map((extra, i) => (
        <View key={i} style={styles.subRow}>
          <TextInput
            style={[styles.input, styles.subInput]}
            value={extra.name}
            onChangeText={(v) => updateExtra(i, 'name', v)}
            placeholder="Nombre del extra"
            placeholderTextColor={COLORS.gray}
          />
          <TextInput
            style={[styles.input, styles.subInputSmall]}
            value={String(extra.price)}
            onChangeText={(v) => updateExtra(i, 'price', v)}
            placeholder="Precio"
            placeholderTextColor={COLORS.gray}
            keyboardType="numeric"
          />
          <TouchableOpacity onPress={() => removeExtra(i)} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Tamaños */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tamaños</Text>
        <TouchableOpacity style={styles.addRowBtn} onPress={addSize}>
          <Text style={styles.addRowBtnText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>
      {sizes.map((size, i) => (
        <View key={i} style={styles.subRow}>
          <TextInput
            style={[styles.input, styles.subInput]}
            value={size.label}
            onChangeText={(v) => updateSize(i, 'label', v)}
            placeholder="Etiqueta (Ej: Grande)"
            placeholderTextColor={COLORS.gray}
          />
          <TextInput
            style={[styles.input, styles.subInputSmall]}
            value={String(size.priceModifier)}
            onChangeText={(v) => updateSize(i, 'priceModifier', v)}
            placeholder="+precio"
            placeholderTextColor={COLORS.gray}
            keyboardType="numeric"
          />
          <TouchableOpacity onPress={() => removeSize(i)} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving
          ? <ActivityIndicator color={COLORS.black} />
          : <Text style={styles.saveBtnText}>{editing ? 'Guardar cambios' : 'Crear producto'}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  content: { padding: 16, gap: 6, paddingBottom: 40 },
  label: { color: COLORS.gray, fontSize: 13, marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    color: COLORS.white,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: 8,
    marginTop: 4,
  },
  chipActive: { backgroundColor: COLORS.yellow, borderColor: COLORS.yellow },
  chipText: { color: COLORS.gray, fontSize: 13 },
  chipTextActive: { color: COLORS.black, fontWeight: 'bold' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  sectionTitle: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  addRowBtn: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addRowBtnText: { color: COLORS.yellow, fontSize: 13, fontWeight: '600' },
  subRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 },
  subInput: { flex: 1 },
  subInputSmall: { width: 90, flex: 0 },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#5a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: COLORS.error, fontSize: 16, fontWeight: 'bold' },
  saveBtn: {
    backgroundColor: COLORS.yellow,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnText: { color: COLORS.black, fontWeight: 'bold', fontSize: 16 },
});
