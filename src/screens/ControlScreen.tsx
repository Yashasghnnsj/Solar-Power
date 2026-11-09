import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sliders, Wifi, Power, RotateCcw, ShieldAlert, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { useTelemetry } from '../context/TelemetryContext';

export function ControlScreen() {
  const {
    telemetry,
    isConnected,
    connectionStatus,
    connectionError,
    espIp,
    setEspIp,
    toggleRelay,
    resetEnergyCounters,
    alerts,
    dismissAlert,
  } = useTelemetry();

  const [ipInput, setIpInput] = useState(espIp);

  const handleUpdateIp = () => {
    const ip = ipInput.trim();
    const octets = ip.split('.');
    if (
      octets.length !== 4 ||
      octets.some((octet) => !/^\d+$/.test(octet) || Number(octet) > 255)
    ) {
      Alert.alert('Invalid IP', 'Please enter a valid IP address for the ESP32.');
      return;
    }
    setEspIp(ip);
  };

  const confirmResetCounters = () => {
    Alert.alert(
      'Reset Energy Counters',
      'Are you sure you want to reset the PZEM-004T energy register?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset All Counters',
          style: 'destructive',
          onPress: () => {
            resetEnergyCounters();
            Alert.alert('Reset Command Sent', 'The PZEM reading will update when the ESP32 sends its next telemetry packet.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>System & Controls</Text>
          <Text style={styles.subtitle}>ESP32 Network, Relays & Hardware Registers</Text>
        </View>

        {/* ESP32 Network Bridge Card */}
        <Text style={styles.sectionHeader}>ESP32 HARDWARE CONNECTION</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.iconLabelRow}>
              <Wifi color={isConnected ? '#10b981' : '#f59e0b'} size={18} />
              <Text style={styles.cardLabel}>WebSocket IP Target</Text>
            </View>
            <View
              style={[
                styles.statusTag,
                connectionStatus === 'connected'
                  ? styles.tagGreen
                  : connectionStatus === 'connecting' ? styles.tagAmber : styles.tagRed,
              ]}
            >
              <Text style={styles.statusTagText}>
                {connectionStatus === 'connected'
                  ? 'CONNECTED'
                  : connectionStatus === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          <View style={styles.ipRow}>
            <TextInput
              style={styles.ipInput}
              value={ipInput}
              onChangeText={setIpInput}
              placeholder="192.168.4.1"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.connectButton} onPress={handleUpdateIp}>
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>
            {connectionError ?? `WebSocket: ws://${espIp}:81`}
          </Text>
        </View>

        {/* Relay Actuator Controls */}
        <Text style={styles.sectionHeader}>CIRCUIT BREAKER & RELAY ACTUATORS</Text>
        <View style={styles.card}>
          <View style={styles.relayRow}>
            <View style={styles.relayInfo}>
              <Power color={telemetry.inverterRelay ? '#10b981' : '#64748b'} size={20} />
              <View>
                <Text style={styles.relayTitle}>Solar Inverter AC Relay</Text>
                <Text style={styles.relaySub}>
                  Status: {telemetry.inverterRelay === null
                    ? 'Unknown'
                    : telemetry.inverterRelay ? 'ENERGIZED (Online)' : 'ISOLATED (Tripped)'}
                </Text>
              </View>
            </View>
            <Switch
              value={telemetry.inverterRelay ?? false}
              disabled={!isConnected || telemetry.inverterRelay === null}
              onValueChange={() => toggleRelay('inverter')}
              trackColor={{ false: '#334155', true: '#10b981' }}
              thumbColor="#f8fafc"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.relayRow}>
            <View style={styles.relayInfo}>
              <Power color={telemetry.gridRelay ? '#38bdf8' : '#64748b'} size={20} />
              <View>
                <Text style={styles.relayTitle}>Grid-Tie Synchronization Relay</Text>
                <Text style={styles.relaySub}>
                  Status: {telemetry.gridRelay === null
                    ? 'Unknown'
                    : telemetry.gridRelay ? 'GRID TIED' : 'ISLANDED'}
                </Text>
              </View>
            </View>
            <Switch
              value={telemetry.gridRelay ?? false}
              disabled={!isConnected || telemetry.gridRelay === null}
              onValueChange={() => toggleRelay('grid')}
              trackColor={{ false: '#334155', true: '#38bdf8' }}
              thumbColor="#f8fafc"
            />
          </View>
        </View>

        {/* Calibration & Register Maintenance */}
        <Text style={styles.sectionHeader}>PZEM-004T CALIBRATION & MAINTENANCE</Text>
        <View style={styles.card}>
          <View style={styles.registerRow}>
            <View>
              <Text style={styles.registerTitle}>Reset Accumulated Energy</Text>
              <Text style={styles.registerSub}>Clears EEPROM net metering kWh registers</Text>
            </View>
            <TouchableOpacity
              style={[styles.resetButton, !isConnected && styles.disabledButton]}
              onPress={confirmResetCounters}
              disabled={!isConnected}
            >
              <RotateCcw color="#ef4444" size={14} />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Diagnostics & Alert Feed */}
        <Text style={styles.sectionHeader}>SYSTEM ALERTS & DIAGNOSTICS</Text>
        {alerts.length === 0 ? (
          <View style={styles.card}>
            <View style={styles.allClearRow}>
              <CheckCircle2 color="#10b981" size={18} />
              <Text style={styles.allClearText}>No device alerts have been received.</Text>
            </View>
          </View>
        ) : (
          alerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={styles.alertTitleRow}>
                  {alert.type === 'warning' ? (
                    <AlertTriangle color="#f59e0b" size={16} />
                  ) : (
                    <ShieldAlert color="#38bdf8" size={16} />
                  )}
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                </View>
                <TouchableOpacity onPress={() => dismissAlert(alert.id)}>
                  <Text style={styles.dismissText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertTime}>{alert.time}</Text>
            </View>
          ))
        )}

        {/* Hardware Specs Footnote */}
        <View style={styles.specsCard}>
          <View style={styles.specsHeader}>
            <Cpu color="#94a3b8" size={16} />
            <Text style={styles.specsTitle}>HARDWARE SPECIFICATIONS</Text>
          </View>
          <Text style={styles.specsText}>• MCU: ESP32-WROOM-32 (Dual-Core 240MHz)</Text>
          <Text style={styles.specsText}>• Metering IC: PZEM-004T v3.0 (UART Modbus-RTU)</Text>
          <Text style={styles.specsText}>• Current Sensor: Split-Core CT (0-100A RMS)</Text>
          <Text style={styles.specsText}>• Protocol: WebSocket JSON Stream (1000ms polling)</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 6,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 18,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  tagAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  tagRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#f8fafc',
  },
  ipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ipInput: {
    flex: 1,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  connectButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#090d16',
  },
  hintText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 8,
  },
  relayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  relayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  relayTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  relaySub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 10,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  registerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  registerSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  disabledButton: { opacity: 0.45 },
  resetButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ef4444',
  },
  allClearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allClearText: {
    fontSize: 12,
    color: '#10b981',
  },
  alertCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 10,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  dismissText: {
    fontSize: 10,
    color: '#64748b',
  },
  alertMessage: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 9,
    color: '#64748b',
  },
  specsCard: {
    backgroundColor: '#0b111e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 10,
  },
  specsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  specsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  specsText: {
    fontSize: 11,
    color: '#94a3b8',
    marginVertical: 2,
  },
});
