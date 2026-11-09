import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TelemetryProvider, useTelemetry } from './src/context/TelemetryContext';

function formatReading(value: number | null, decimals = 1): string {
  return value === null ? '--' : value.toFixed(decimals);
}

function AppDashboard() {
  const {
    telemetry,
    isConnected,
    connectionStatus,
    connectionError,
    espIp,
    setEspIp,
  } = useTelemetry();
  const [ipInput, setIpInput] = useState(espIp);

  const metrics = [
    { label: 'AC Voltage', value: formatReading(telemetry.voltageV), unit: 'V' },
    { label: 'AC Current', value: formatReading(telemetry.currentA, 2), unit: 'A' },
    { label: 'Active Power', value: formatReading(telemetry.activePowerW), unit: 'W', highlight: true },
    { label: 'Frequency', value: formatReading(telemetry.frequencyHz, 2), unit: 'Hz' },
    { label: 'Meter Energy', value: formatReading(telemetry.meterEnergyKWh, 3), unit: 'kWh' },
    { label: 'Power Factor', value: formatReading(telemetry.powerFactor, 2), unit: '' },
  ];

  const statusLabel = isConnected
    ? 'ESP32 Connected'
    : connectionStatus === 'connecting' ? 'Connecting to ESP32...' : 'ESP32 Offline';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0f172a" barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Solar Energy Monitor</Text>
          <View style={styles.statusBadge}>
            {connectionStatus === 'connecting' && !isConnected ? (
              <ActivityIndicator size="small" color="#f59e0b" style={styles.statusSpinner} />
            ) : (
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isConnected ? '#10b981' : '#ef4444' },
                ]}
              />
            )}
            <Text
              style={[
                styles.statusText,
                { color: isConnected ? '#10b981' : connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444' },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.ipPanel}>
          <Text style={styles.sectionLabel}>ESP32 WebSocket IP</Text>
          <View style={styles.ipRow}>
            <TextInput
              value={ipInput}
              onChangeText={setIpInput}
              placeholder="192.168.4.1"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
              style={styles.ipInput}
            />
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setEspIp(ipInput.trim())}
              disabled={!ipInput.trim()}
              style={[styles.connectButton, !ipInput.trim() && styles.disabledButton]}
            >
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.endpoint}>ws://{espIp}:81</Text>
        </View>

        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <View
              key={metric.label}
              style={[styles.metricCard, metric.highlight && styles.highlightCard]}
            >
              <Text style={[styles.metricLabel, metric.highlight && styles.highlightLabel]}>
                {metric.label}
              </Text>
              <Text style={[styles.metricValue, metric.highlight && styles.highlightValue]}>
                {metric.value}
                {metric.unit ? <Text style={styles.metricUnit}> {metric.unit}</Text> : null}
              </Text>
            </View>
          ))}
        </View>

        {connectionError ? <Text style={styles.errorText}>{connectionError}</Text> : null}
        <Text style={styles.note}>
          Readings are received live from the ESP32 meter. Solar-specific values are not available
          from the current single-meter firmware.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <TelemetryProvider>
      <AppDashboard />
    </TelemetryProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  statusBadge: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusSpinner: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ipPanel: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 9,
    textTransform: 'uppercase',
  },
  ipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ipInput: {
    flex: 1,
    minWidth: 0,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: 15,
  },
  connectButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: '#2563eb',
  },
  disabledButton: {
    opacity: 0.5,
  },
  connectButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  endpoint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 9,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    minHeight: 112,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#1e293b',
    marginBottom: 12,
  },
  highlightCard: {
    backgroundColor: '#1e3a8a',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  highlightLabel: {
    color: '#bfdbfe',
  },
  metricValue: {
    color: '#f59e0b',
    fontSize: 27,
    fontWeight: '700',
    marginTop: 8,
  },
  highlightValue: {
    color: '#60a5fa',
  },
  metricUnit: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '400',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
    textAlign: 'center',
  },
  note: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 20,
    textAlign: 'center',
  },
});
