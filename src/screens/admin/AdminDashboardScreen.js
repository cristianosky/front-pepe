import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { adminAPI } from '../../services/api';
import { COLORS, formatPrice } from '../../theme';
import useAdminMenu from './useAdminMenu';
import AdminMenuModal from './AdminMenuModal';

const STATUS_LABELS = {
  recibido:       { label: 'Recibido',   color: '#FF9800' },
  en_preparacion: { label: 'Preparando', color: '#2196F3' },
  listo:          { label: 'Listo',      color: COLORS.yellow },
  entregado:      { label: 'Entregado',  color: COLORS.success },
  cancelado:      { label: 'Cancelado',  color: COLORS.error },
};

function StatCard({ label, value, sub }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const { menuOpen, closeMenu } = useAdminMenu(navigation);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.yellow} />
      </View>
    );
  }

  return (
    <>
    <AdminMenuModal visible={menuOpen} onClose={closeMenu} navigation={navigation} currentRoute="AdminDashboard" />
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.yellow} />}
    >
      <Text style={styles.section}>Hoy</Text>
      <View style={styles.row}>
        <StatCard
          label="Pedidos"
          value={stats?.ordersToday ?? 0}
        />
        <StatCard
          label="Ingresos"
          value={formatPrice(stats?.revenueToday ?? 0)}
        />
      </View>

      {stats?.topProduct && (
        <>
          <Text style={styles.section}>Más vendido (total)</Text>
          <View style={styles.topCard}>
            <Text style={styles.topName}>{stats.topProduct.name}</Text>
            <Text style={styles.topQty}>{stats.topProduct.qty} unidades</Text>
          </View>
        </>
      )}

      <Text style={styles.section}>Pedidos por estado</Text>
      {(stats?.byStatus ?? []).map((row) => {
        const cfg = STATUS_LABELS[row.status] ?? { label: row.status, color: COLORS.gray };
        return (
          <View key={row.status} style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
            <Text style={styles.statusLabel}>{cfg.label}</Text>
            <Text style={styles.statusCount}>{row.count}</Text>
          </View>
        );
      })}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.dark },
  section: { color: COLORS.gray, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8 },
  row: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { color: COLORS.yellow, fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: COLORS.gray, fontSize: 13 },
  statSub: { color: COLORS.lightGray, fontSize: 12 },
  topCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  topName: { color: COLORS.white, fontSize: 17, fontWeight: '700' },
  topQty: { color: COLORS.gray, fontSize: 13 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusLabel: { flex: 1, color: COLORS.white, fontSize: 15 },
  statusCount: { color: COLORS.yellow, fontSize: 18, fontWeight: 'bold' },
});
