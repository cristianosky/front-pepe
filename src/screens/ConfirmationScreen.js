import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { io } from 'socket.io-client';
import { ordersAPI } from '../services/api';
import { SOCKET_URL } from '../config';
import { COLORS } from '../theme';

const STATUS_CONFIG = {
  recibido:       { label: 'Pedido recibido',      emoji: '📋', color: COLORS.white },
  en_preparacion: { label: 'En preparación',        emoji: '👨‍🍳', color: '#FFA500' },
  listo:          { label: '¡Listo para entregar!', emoji: '✅', color: COLORS.success },
  entregado:      { label: '¡Entregado!',            emoji: '🎉', color: COLORS.success },
  cancelado:      { label: 'Cancelado',              emoji: '❌', color: COLORS.error },
};

const STATUSES = ['recibido', 'en_preparacion', 'listo', 'entregado'];

export default function ConfirmationScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [status, setStatus] = useState('recibido');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.getById(orderId)
      .then((data) => {
        const s = data.status ?? data.order?.status ?? 'recibido';
        setStatus(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('order_status_changed', ({ id, status: s }) => {
      if (id === orderId) setStatus(s);
    });
    return () => socket.disconnect();
  }, [orderId]);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.recibido;
  const currentStep = STATUSES.indexOf(status);

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Text style={styles.mainEmoji}>{config.emoji}</Text>
        <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
        <Text style={styles.orderId}>Pedido #{String(orderId).slice(0, 8).toUpperCase()}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.yellow} style={{ marginTop: 32 }} />
      ) : (
        <View style={styles.timeline}>
          {STATUSES.map((s, i) => {
            const done = i <= currentStep && status !== 'cancelado';
            const active = i === currentStep && status !== 'cancelado';
            return (
              <View key={s} style={styles.timelineRow}>
                <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]} />
                {i < STATUSES.length - 1 && (
                  <View style={[styles.line, done && i < currentStep && styles.lineDone]} />
                )}
                <Text style={[styles.timelineLabel, done && styles.timelineLabelDone]}>
                  {STATUS_CONFIG[s].emoji} {STATUS_CONFIG[s].label}
                </Text>
              </View>
            );
          })}
          {status === 'cancelado' && (
            <View style={styles.timelineRow}>
              <View style={[styles.dot, styles.dotCancelled]} />
              <Text style={[styles.timelineLabel, { color: COLORS.error }]}>
                {STATUS_CONFIG.cancelado.emoji} {STATUS_CONFIG.cancelado.label}
              </Text>
            </View>
          )}
        </View>
      )}

      {(status === 'entregado' || status === 'cancelado') && (
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] })}
        >
          <Text style={styles.homeButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    padding: 24,
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 24,
    marginBottom: 32,
  },
  mainEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  orderId: {
    color: COLORS.gray,
    fontSize: 14,
  },
  timeline: {
    width: '100%',
    paddingHorizontal: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    marginRight: 14,
  },
  dotDone: { backgroundColor: COLORS.success },
  dotActive: { backgroundColor: COLORS.yellow },
  dotCancelled: { backgroundColor: COLORS.error },
  line: {
    position: 'absolute',
    left: 7,
    top: 16,
    width: 2,
    height: 24,
    backgroundColor: COLORS.border,
  },
  lineDone: { backgroundColor: COLORS.success },
  timelineLabel: {
    color: COLORS.gray,
    fontSize: 15,
  },
  timelineLabelDone: {
    color: COLORS.white,
    fontWeight: '600',
  },
  homeButton: {
    marginTop: 48,
    backgroundColor: COLORS.yellow,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  homeButtonText: {
    color: COLORS.black,
    fontWeight: 'bold',
    fontSize: 17,
  },
});
