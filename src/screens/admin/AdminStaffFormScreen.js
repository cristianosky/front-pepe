import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { staffAPI } from '../../services/api';
import { COLORS } from '../../theme';

const ROLES = [
  { value: 'cocinero', label: 'Cocinero', color: '#FF9800' },
  { value: 'repartidor', label: 'Repartidor', color: '#2196F3' },
];

export default function AdminStaffFormScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cocinero');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !password) {
      return Alert.alert('Error', 'Todos los campos son requeridos');
    }
    setLoading(true);
    try {
      await staffAPI.create({ name: name.trim(), email: email.trim(), password, role });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nombre completo"
        placeholderTextColor={COLORS.gray}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="correo@ejemplo.com"
        placeholderTextColor={COLORS.gray}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Mínimo 6 caracteres"
        placeholderTextColor={COLORS.gray}
        secureTextEntry
      />

      <Text style={styles.label}>Rol</Text>
      <View style={styles.roleRow}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.roleChip, role === r.value && { backgroundColor: r.color, borderColor: r.color }]}
            onPress={() => setRole(r.value)}
          >
            <Text style={[styles.roleChipText, role === r.value && { color: COLORS.black }]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={loading}>
        {loading
          ? <ActivityIndicator color={COLORS.black} />
          : <Text style={styles.btnText}>Crear usuario</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  content: { padding: 20, gap: 8 },
  label: { color: COLORS.gray, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginTop: 12 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.white,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  roleRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  roleChip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleChipText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },
  btn: {
    backgroundColor: COLORS.yellow,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: { color: COLORS.black, fontWeight: 'bold', fontSize: 16 },
});
