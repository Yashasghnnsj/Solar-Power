import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, Home, ArrowUpRight, ArrowDownLeft, Battery } from 'lucide-react-native';
import { useTelemetry } from '../context/TelemetryContext';

export function DashboardScreen() {
  const { telemetry, connectionStatus } = useTelemetry();
  const isExporting = telemetry.netPowerW !== null && telemetry.netPowerW > 0;
  const statusLabel = connectionStatus === 'connected'
    ? 'LIVE ESP32'
    : connectionStatus === 'connecting' ? 'CONNECTING' : 'OFFLINE';
  const statusStyle = connectionStatus === 'connected'
    ? styles.badgeOnline
    : connectionStatus === 'connecting' ? styles.badgeOffline : styles.badgeDisconnected;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.appTitle}>PV Smart Net-Meter</Text>
            <Text style={styles.subTitle}>ESP32 + PZEM-004T v3.0 Live Stream</Text>
          </View>
          <View style={[styles.statusBadge, statusStyle]}>
            <View style={[styles.dot, connectionStatus === 'connected' ? styles.dotGreen : styles.dotAmber]} />
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
        </View>

        {/* Bi-Directional Power Flow Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.flowHeader}>
            <Text style={styles.flowLabel}>NET POWER FLOW</Text>
            <Text style={[styles.flowState, isExporting ? styles.textGreen : styles.textAmber]}>
              {telemetry.netPowerW === null
                ? 'NOT MEASURED'
                : isExporting ? 'SURPLUS EXPORTING' : 'GRID IMPORTING'}
            </Text>
          </View>

          <Text style={[styles.heroWattage, isExporting ? styles.textGreen : styles.textAmber]}>
            {telemetry.netPowerW === null
              ? '—'
              : `${isExporting ? '+' : ''}${telemetry.netPowerW.toFixed(0)} W`}
          </Text>
          <Text style={styles.formulaText}>
            Net solar/load power requires separate meters
          </Text>

          {/* Quick Subsystem Nodes */}
          <View style={styles.nodeGrid}>
            <View style={styles.nodeItem}>
              <Sun color="#f59e0b" size={20} />
              <Text style={styles.nodeVal}>{telemetry.solarPowerW === null ? '—' : `${telemetry.solarPowerW} W`}</Text>
              <Text style={styles.nodeLbl}>Solar PV</Text>
            </View>
            <View style={styles.nodeItem}>
              <Home color="#38bdf8" size={20} />
              <Text style={styles.nodeVal}>{telemetry.loadPowerW === null ? '—' : `${telemetry.loadPowerW} W`}</Text>
              <Text style={styles.nodeLbl}>Household</Text>
            </View>
            <View style={styles.nodeItem}>
              <Battery color="#10b981" size={20} />
              <Text style={styles.nodeVal}>{telemetry.batteryVoltageV === null ? '—' : `${telemetry.batteryVoltageV.toFixed(1)} V`}</Text>
              <Text style={styles.nodeLbl}>
                {telemetry.batterySocPercent === null ? 'Battery SOC —' : `Battery SOC ${telemetry.batterySocPercent}%`}
              </Text>
            </View>
          </View>
        </View>

        {/* Electrical Dials (PZEM-004T Measured Parameters) */}
        <Text style={styles.sectionHeader}>PZEM-004T ELECTRICAL TELEMETRY</Text>
        <View style={styles.dialsGrid}>
          <View style={styles.dialCard}>
            <Text style={styles.dialLabel}>MAINS VOLTAGE</Text>
            <Text style={styles.dialValue}>
              {telemetry.voltageV === null ? '—' : telemetry.voltageV.toFixed(1)} <Text style={styles.unit}>V</Text>
            </Text>
            <Text style={styles.dialSub}>Nominal: 230V ±5%</Text>
          </View>

          <View style={styles.dialCard}>
            <Text style={styles.dialLabel}>RMS CURRENT</Text>
            <Text style={styles.dialValue}>
              {telemetry.currentA === null ? '—' : telemetry.currentA.toFixed(2)} <Text style={styles.unit}>A</Text>
            </Text>
            <Text style={styles.dialSub}>CT Split-Core 100A</Text>
          </View>

          <View style={styles.dialCard}>
            <Text style={styles.dialLabel}>ACTIVE POWER</Text>
            <Text style={styles.dialValue}>
              {telemetry.activePowerW === null ? '—' : telemetry.activePowerW.toFixed(0)} <Text style={styles.unit}>W</Text>
            </Text>
            <Text style={styles.dialSub}>
              PF: {telemetry.powerFactor === null ? '—' : telemetry.powerFactor.toFixed(2)}
            </Text>
          </View>

          <View style={styles.dialCard}>
            <Text style={styles.dialLabel}>FREQUENCY</Text>
            <Text style={styles.dialValue}>
              {telemetry.frequencyHz === null ? '—' : telemetry.frequencyHz.toFixed(1)} <Text style={styles.unit}>Hz</Text>
            </Text>
            <Text style={styles.dialSub}>Grid Synchronized</Text>
          </View>
        </View>

        {/* Net Meter Counters */}
        <Text style={styles.sectionHeader}>ACCUMULATED NET UNITS</Text>
        <View style={styles.countersRow}>
          <View style={[styles.counterBox, { borderColor: '#10b981' }]}>
            <ArrowUpRight color="#10b981" size={22} />
            <Text style={styles.counterVal}>
              {telemetry.exportEnergyKWh === null ? '—' : `${telemetry.exportEnergyKWh.toFixed(2)} kWh`}
            </Text>
            <Text style={styles.counterLbl}>Export energy (meter required)</Text>
          </View>

          <View style={[styles.counterBox, { borderColor: '#f59e0b' }]}>
            <ArrowDownLeft color="#f59e0b" size={22} />
            <Text style={styles.counterVal}>
              {telemetry.importEnergyKWh === null ? '—' : `${telemetry.importEnergyKWh.toFixed(2)} kWh`}
            </Text>
            <Text style={styles.counterLbl}>Import energy (meter required)</Text>
          </View>
        </View>

        {/* Solar Generation Yield Card */}
        <View style={styles.yieldCard}>
          <View style={styles.yieldHeader}>
            <Text style={styles.yieldLabel}>PZEM METER ENERGY</Text>
            <Text style={styles.yieldValue}>
              {telemetry.meterEnergyKWh === null ? '—' : `${telemetry.meterEnergyKWh.toFixed(2)} kWh`}
            </Text>
          </View>
          <Text style={styles.yieldSub}>Cumulative energy reported by the connected PZEM sensor</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  appTitle: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
  subTitle: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeOnline: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: '#10b981' },
  badgeOffline: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderWidth: 1, borderColor: '#f59e0b' },
  badgeDisconnected: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: '#ef4444' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  dotGreen: { backgroundColor: '#10b981' },
  dotAmber: { backgroundColor: '#f59e0b' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#f8fafc' },
  heroCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#1e293b', marginBottom: 20 },
  flowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flowLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  flowState: { fontSize: 11, fontWeight: 'bold' },
  textGreen: { color: '#10b981' },
  textAmber: { color: '#f59e0b' },
  heroWattage: { fontSize: 36, fontWeight: 'bold', marginVertical: 8, fontFamily: 'monospace' },
  formulaText: { fontSize: 11, color: '#64748b', marginBottom: 14 },
  nodeGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1e293b' },
  nodeItem: { alignItems: 'center' },
  nodeVal: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc', marginTop: 4, fontFamily: 'monospace' },
  nodeLbl: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  sectionHeader: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  dialsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 20 },
  dialCard: { width: '48%', backgroundColor: '#0f172a', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },
  dialLabel: { fontSize: 9, color: '#64748b', fontWeight: 'bold', letterSpacing: 0.5 },
  dialValue: { fontSize: 20, fontWeight: 'bold', color: '#38bdf8', marginVertical: 4, fontFamily: 'monospace' },
  unit: { fontSize: 13, color: '#94a3b8' },
  dialSub: { fontSize: 9, color: '#64748b' },
  countersRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  counterBox: { flex: 1, backgroundColor: '#0f172a', padding: 14, borderRadius: 12, borderWidth: 1 },
  counterVal: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', marginVertical: 4, fontFamily: 'monospace' },
  counterLbl: { fontSize: 10, color: '#94a3b8' },
  yieldCard: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  yieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  yieldLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', letterSpacing: 0.5 },
  yieldValue: { fontSize: 18, fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace' },
  yieldSub: { fontSize: 10, color: '#64748b', marginTop: 4 },
});
