import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { TelemetryProvider, useTelemetry } from './src/context/TelemetryContext';

function fmt(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  return val.toFixed(decimals);
}

function MainDashboard() {
  const {
    telemetry,
    isConnected,
    connectionStatus,
    connectionError,
    espIp,
    setEspIp,
    tariff,
    setTariff,
    toggleRelay,
    resetEnergyCounters,
  } = useTelemetry();

  const [ipInput, setIpInput] = useState(espIp);
  const [activeTab, setActiveTab] = useState<'live' | 'billing' | 'esg'>('live');
  const [isPeakHour, setIsPeakHour] = useState(false);

  useEffect(() => {
    const updatePeakHour = () => {
      const hour = new Date().getHours();
      setIsPeakHour(hour >= 18 && hour < 22);
    };

    updatePeakHour();
    const interval = setInterval(updatePeakHour, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute Solar & Load values from telemetry
  const batteryV = telemetry.batteryVoltageV;
  const solarW = telemetry.solarPowerW;
  const loadW = telemetry.loadPowerW;
  const netW = telemetry.netPowerW ?? (
    solarW !== null && loadW !== null ? solarW - loadW : null
  );
  const isExporting = netW !== null && netW >= 0;
  const soc = telemetry.batterySocPercent === null
    ? null
    : Math.min(Math.max(telemetry.batterySocPercent, 0), 100);
  const acV = telemetry.voltageV;
  const activePowerW = telemetry.activePowerW;
  const importCost = telemetry.importEnergyKWh === null
    ? null
    : telemetry.importEnergyKWh * tariff.importRatePerKWh;
  const exportCredit = telemetry.exportEnergyKWh === null
    ? null
    : telemetry.exportEnergyKWh * tariff.exportCreditPerKWh;
  const netBill = importCost === null || exportCredit === null
    ? null
    : tariff.fixedMonthlyCharge + importCost - exportCredit;
  const co2AvoidedKg = telemetry.exportEnergyKWh === null
    ? null
    : telemetry.exportEnergyKWh * 0.82;
  const treesEquivalent = co2AvoidedKg === null ? null : co2AvoidedKg / 21;
  const isVoltageSag = acV !== null && acV > 0 && acV < 190;
  const isVoltageSwell = acV !== null && acV > 250;
  const isOverload = activePowerW !== null && activePowerW > 500;
  const isLowBattery = soc !== null && soc < 20 && telemetry.inverterRelay === true;

  // Manually force the Inverter Relay ON/OFF
  const handleToggleRelay = () => {
    toggleRelay('inverter');
  };

  const handleResetEnergy = () => {
    Alert.alert('Reset Energy', 'Reset kWh counters back to 0.00?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetEnergyCounters },
    ]);
  };

  const adjustTariff = (field: 'importRatePerKWh' | 'exportCreditPerKWh', adjustment: number) => {
    setTariff({
      ...tariff,
      [field]: Math.max(0, Math.round((tariff[field] + adjustment) * 100) / 100),
    });
  };

  const handleShareReport = async () => {
    const report = [
      'SMART SOLAR ENERGY AUDIT',
      `Timestamp: ${new Date().toLocaleString()}`,
      `Gateway IP: ${espIp}`,
      '',
      'ENERGY',
      `Solar power: ${fmt(telemetry.solarPowerW)} W`,
      `Grid export: ${fmt(telemetry.exportEnergyKWh, 3)} kWh`,
      `Grid import: ${fmt(telemetry.importEnergyKWh, 3)} kWh`,
      `Meter energy: ${fmt(telemetry.meterEnergyKWh, 3)} kWh`,
      '',
      'BILLING',
      `Import tariff: ${tariff.currencySymbol}${tariff.importRatePerKWh.toFixed(2)}/kWh`,
      `Export credit: ${tariff.currencySymbol}${tariff.exportCreditPerKWh.toFixed(2)}/kWh`,
      `Estimated net bill: ${netBill === null ? 'Not available (import/export readings missing)' : `${tariff.currencySymbol}${netBill.toFixed(2)}`}`,
      '',
      'ENVIRONMENT',
      `CO2 avoided from measured exports: ${co2AvoidedKg === null ? 'Not available (export reading missing)' : `${co2AvoidedKg.toFixed(2)} kg`}`,
      '',
      'Solar generation totals and on-site solar savings require additional telemetry.',
    ].join('\n');

    try {
      await Share.share({ message: report });
    } catch (error) {
      console.error('[Energy audit] Could not share report:', error);
      Alert.alert('Share failed', 'Unable to open the share menu. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#080c14" barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>Solar Energy Monitor</Text>
            <Text style={styles.appSubtitle}>IoT Hybrid Net-Meter & ATS</Text>
          </View>
          <View style={[styles.statusBadge, isConnected ? styles.badgeConnected : styles.badgeOffline]}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
            <Text style={[styles.statusBadgeText, { color: isConnected ? '#10b981' : '#ef4444' }]}>
              {isConnected ? 'ESP32 Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'live' && styles.activeTabButton]}
            onPress={() => setActiveTab('live')}
          >
            <Text style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>Live Power</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'billing' && styles.activeTabButton]}
            onPress={() => setActiveTab('billing')}
          >
            <Text style={[styles.tabText, activeTab === 'billing' && styles.activeTabText]}>Billing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'esg' && styles.activeTabButton]}
            onPress={() => setActiveTab('esg')}
          >
            <Text style={[styles.tabText, activeTab === 'esg' && styles.activeTabText]}>ESG &amp; Health</Text>
          </TouchableOpacity>
        </View>

        {/* IP Connect Bar */}
        <View style={styles.panel}>
          <Text style={styles.sectionLabel}>ESP32 WEBSOCKET IP</Text>
          <View style={styles.ipRow}>
            <TextInput
              value={ipInput}
              onChangeText={setIpInput}
              placeholder="192.168.4.1"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={styles.ipInput}
            />
            <TouchableOpacity style={styles.connectButton} onPress={() => setEspIp(ipInput.trim())}>
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.endpointText}>ws://{espIp}:81</Text>
        </View>

        {activeTab === 'live' && (
          <>
        {/* Power Dispatch Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroHeaderLabel}>POWER DISPATCH FLOW</Text>
          <View style={styles.powerFlowRow}>
            <View style={styles.flowNode}>
              <Text style={styles.nodeLabel}>SOLAR PV</Text>
              <Text style={styles.nodeValue}>{fmt(solarW, 1)} W</Text>
            </View>
            <View style={styles.flowCenter}>
              <View style={[styles.flowBadge, { backgroundColor: netW === null ? '#1e293b' : isExporting ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                <Text style={[styles.flowBadgeText, { color: netW === null ? '#94a3b8' : isExporting ? '#10b981' : '#f59e0b' }]}>
                  {netW === null ? 'NOT MEASURED' : isExporting ? 'SURPLUS EXPORT' : 'GRID DRAW'}
                </Text>
              </View>
              <Text style={styles.flowNetValue}>
                {netW === null ? '—' : `${isExporting ? '+' : ''}${fmt(netW, 1)} W`}
              </Text>
            </View>
            <View style={styles.flowNode}>
              <Text style={styles.nodeLabel}>AC LOAD</Text>
              <Text style={styles.nodeValue}>{fmt(loadW, 1)} W</Text>
            </View>
          </View>
        </View>

        {/* Relay Actuator Controls */}
        <View style={styles.panel}>
          <Text style={styles.sectionLabel}>HARDWARE ACTUATOR OVERRIDE</Text>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.relayBtn, telemetry.inverterRelay ? styles.btnRelayOn : styles.btnRelayOff]}
              onPress={handleToggleRelay}
              disabled={!isConnected || telemetry.inverterRelay === null}
            >
              <Text style={styles.relayBtnTitle}>
                Inverter Relay: {telemetry.inverterRelay === null ? '—' : telemetry.inverterRelay ? 'ON' : 'OFF'}
              </Text>
              <Text style={styles.relayBtnSubtitle}>
                {!isConnected || telemetry.inverterRelay === null
                  ? 'Relay state unavailable'
                  : telemetry.inverterRelay ? 'Tap to switch to Grid' : 'Tap to force Inverter Power'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnReset} onPress={handleResetEnergy}>
              <Text style={styles.btnResetText}>Reset kWh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Solar DC and battery telemetry */}
        <Text style={styles.groupTitle}>Solar &amp; Battery Telemetry</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.highlightSolarCard]}>
            <Text style={styles.metricLabel}>Battery Voltage</Text>
            <Text style={[styles.metricValue, styles.highlightSolarText]}>{fmt(batteryV, 1)} <Text style={styles.unit}>V</Text></Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Solar Power</Text>
            <Text style={styles.metricValue}>{fmt(solarW, 1)} <Text style={styles.unit}>W</Text></Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Battery SOC</Text>
            <Text style={styles.metricValue}>{soc === null ? '—' : fmt(soc, 0)} <Text style={styles.unit}>%</Text></Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>AC Load Power</Text>
            <Text style={styles.metricValue}>{fmt(loadW, 1)} <Text style={styles.unit}>W</Text></Text>
          </View>
        </View>

        {/* AC Mains & Load (PZEM-004T) */}
        <Text style={styles.groupTitle}>AC Load Telemetry (PZEM-004T)</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.highlightCard]}>
            <Text style={styles.metricLabel}>AC Voltage</Text>
            <Text style={[styles.metricValue, styles.highlightText]}>{fmt(acV, 1)} <Text style={styles.unit}>V</Text></Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>AC Current</Text>
            <Text style={styles.metricValue}>{fmt(telemetry.currentA, 2)} <Text style={styles.unit}>A</Text></Text>
          </View>
          <View style={[styles.metricCard, styles.highlightCard]}>
            <Text style={styles.metricLabel}>Active Power</Text>
            <Text style={[styles.metricValue, styles.highlightText]}>{fmt(activePowerW, 1)} <Text style={styles.unit}>W</Text></Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Frequency</Text>
            <Text style={styles.metricValue}>{fmt(telemetry.frequencyHz, 1)} <Text style={styles.unit}>Hz</Text></Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Power Factor</Text>
            <Text style={styles.metricValue}>{fmt(telemetry.powerFactor, 2)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Meter Energy</Text>
            <Text style={styles.metricValue}>{fmt(telemetry.meterEnergyKWh, 3)} <Text style={styles.unit}>kWh</Text></Text>
          </View>
        </View>
          </>
        )}

        {activeTab === 'billing' && (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroHeaderLabel}>ESTIMATED NET ELECTRICITY BILL</Text>
              <Text style={styles.billHeroAmount}>
                {netBill === null
                  ? '—'
                  : `${netBill < 0 ? '- ' : ''}${tariff.currencySymbol}${Math.abs(netBill).toFixed(2)}`}
              </Text>
              <Text style={[styles.billHeroStatus, { color: netBill !== null && netBill < 0 ? '#10b981' : '#f59e0b' }]}>
                {netBill === null
                  ? 'Waiting for measured import and export energy'
                  : netBill < 0 ? 'NET CREDIT BEFORE UTILITY SETTLEMENT' : 'ENERGY CHARGES AND FIXED CHARGE'}
              </Text>
              <Text style={styles.esgNote}>
                Estimate = fixed charge + grid import cost - export credit. Taxes and utility-specific rules are not included.
              </Text>
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionLabel}>TARIFF SETTINGS ({tariff.currencySymbol}/kWh)</Text>
              <View style={styles.tariffRow}>
                <View style={styles.tariffCol}>
                  <Text style={styles.tariffTitle}>Grid import rate</Text>
                  <View style={styles.rateStepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      accessibilityLabel="Decrease grid import tariff"
                      onPress={() => adjustTariff('importRatePerKWh', -0.5)}
                    >
                      <Text style={styles.stepBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.rateValue}>{tariff.currencySymbol}{tariff.importRatePerKWh.toFixed(2)}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      accessibilityLabel="Increase grid import tariff"
                      onPress={() => adjustTariff('importRatePerKWh', 0.5)}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.tariffCol}>
                  <Text style={styles.tariffTitle}>Export credit rate</Text>
                  <View style={styles.rateStepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      accessibilityLabel="Decrease export credit tariff"
                      onPress={() => adjustTariff('exportCreditPerKWh', -0.5)}
                    >
                      <Text style={styles.stepBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.rateValue}>{tariff.currencySymbol}{tariff.exportCreditPerKWh.toFixed(2)}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      accessibilityLabel="Increase export credit tariff"
                      onPress={() => adjustTariff('exportCreditPerKWh', 0.5)}
                    >
                      <Text style={styles.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.groupTitle}>Measured energy accounting</Text>
            <View style={styles.energyBreakdownList}>
              <View style={styles.breakdownCard}>
                <View>
                  <Text style={styles.breakdownTitle}>Grid energy imported</Text>
                  <Text style={styles.breakdownUnits}>{fmt(telemetry.importEnergyKWh, 3)} kWh</Text>
                </View>
                <Text style={[styles.breakdownCost, { color: '#f59e0b' }]}>
                  {importCost === null ? '—' : `+${tariff.currencySymbol}${importCost.toFixed(2)}`}
                </Text>
              </View>
              <View style={styles.breakdownCard}>
                <View>
                  <Text style={styles.breakdownTitle}>Solar energy exported</Text>
                  <Text style={styles.breakdownUnits}>{fmt(telemetry.exportEnergyKWh, 3)} kWh</Text>
                </View>
                <Text style={[styles.breakdownCost, { color: '#10b981' }]}>
                  {exportCredit === null ? '—' : `-${tariff.currencySymbol}${exportCredit.toFixed(2)}`}
                </Text>
              </View>
              <View style={styles.breakdownCard}>
                <View>
                  <Text style={styles.breakdownTitle}>Meter energy register</Text>
                  <Text style={styles.breakdownUnits}>{fmt(telemetry.meterEnergyKWh, 3)} kWh</Text>
                </View>
                <Text style={styles.breakdownCost}>Measured</Text>
              </View>
            </View>
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                Bill-without-solar and total savings are not estimated because this firmware does not report total solar generation or on-site solar consumption.
              </Text>
            </View>
          </>
        )}

        {activeTab === 'esg' && (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroHeaderLabel}>ENVIRONMENTAL IMPACT</Text>
              <View style={styles.esgRow}>
                <View style={styles.esgNode}>
                  <Text style={styles.esgNumber}>{fmt(co2AvoidedKg, 2)}</Text>
                  <Text style={styles.esgUnit}>kg CO2 avoided</Text>
                </View>
                <View style={styles.esgDivider} />
                <View style={styles.esgNode}>
                  <Text style={styles.esgNumber}>{fmt(treesEquivalent, 2)}</Text>
                  <Text style={styles.esgUnit}>tree-year equivalent</Text>
                </View>
              </View>
              <Text style={styles.esgNote}>
                Based only on measured solar exports at 0.82 kg CO2/kWh and 21 kg CO2 per tree-year.
              </Text>
            </View>

            <View style={[styles.todCard, isPeakHour ? styles.todPeak : styles.todOffPeak]}>
              <Text style={styles.todTitle}>
                {isPeakHour ? 'Peak window active (6 PM–10 PM)' : 'Outside peak window'}
              </Text>
              <Text style={styles.todSubtitle}>
                Informational local-time indicator only; no automatic battery or relay dispatch is configured.
              </Text>
            </View>

            <Text style={styles.groupTitle}>Grid and system health</Text>
            <View style={styles.diagnosticsList}>
              <View style={styles.diagItem}>
                <Text style={styles.diagLabel}>Grid voltage</Text>
                <Text style={[styles.diagStatus, acV === null ? styles.statusUnknown : isVoltageSag || isVoltageSwell ? styles.statusBad : styles.statusGood]}>
                  {acV === null ? 'NOT MEASURED' : isVoltageSag ? 'LOW VOLTAGE' : isVoltageSwell ? 'OVER 250 V' : 'NORMAL'}
                </Text>
              </View>
              <View style={styles.diagItem}>
                <Text style={styles.diagLabel}>Active power (&gt;500 W warning)</Text>
                <Text style={[styles.diagStatus, activePowerW === null ? styles.statusUnknown : isOverload ? styles.statusBad : styles.statusGood]}>
                  {activePowerW === null ? 'NOT MEASURED' : isOverload ? 'ABOVE THRESHOLD' : 'BELOW THRESHOLD'}
                </Text>
              </View>
              <View style={styles.diagItem}>
                <Text style={styles.diagLabel}>Battery SOC in inverter mode</Text>
                <Text style={[styles.diagStatus, soc === null || telemetry.inverterRelay === null ? styles.statusUnknown : isLowBattery ? styles.statusBad : styles.statusGood]}>
                  {soc === null || telemetry.inverterRelay === null
                    ? 'NOT MEASURED'
                    : telemetry.inverterRelay !== true ? 'NOT IN INVERTER MODE' : isLowBattery ? 'BELOW 20%' : 'ABOVE 20%'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.shareReportBtn} onPress={handleShareReport}>
              <Text style={styles.shareReportText}>Share Energy Audit Report</Text>
            </TouchableOpacity>
          </>
        )}

        {connectionError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {connectionError}</Text>
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TelemetryProvider>
        <MainDashboard />
      </TelemetryProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080c14' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 36, paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingTop: 6 },
  appTitle: { color: '#f8fafc', fontSize: 22, fontWeight: '800' },
  appSubtitle: { color: '#64748b', fontSize: 12, fontWeight: '500', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  badgeConnected: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' },
  badgeOffline: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  tabBar: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 12, padding: 4, marginBottom: 12 },
  tabButton: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
  activeTabButton: { backgroundColor: '#1e293b' },
  tabText: { color: '#64748b', fontSize: 11, fontWeight: '600' },
  activeTabText: { color: '#38bdf8', fontWeight: '700' },
  panel: { backgroundColor: '#0f172a', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#1e293b' },
  sectionLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  ipRow: { flexDirection: 'row', gap: 10 },
  ipInput: { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: '#f8fafc', fontSize: 14 },
  connectButton: { backgroundColor: '#2563eb', paddingHorizontal: 18, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  connectButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  endpointText: { color: '#475569', fontSize: 11, marginTop: 6 },
  heroCard: { backgroundColor: '#0f172a', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#1e293b' },
  heroHeaderLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  powerFlowRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flowNode: { alignItems: 'center', backgroundColor: '#1e293b', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, minWidth: 90 },
  nodeLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '700' },
  nodeValue: { color: '#f8fafc', fontSize: 15, fontWeight: '800', marginTop: 4 },
  flowCenter: { alignItems: 'center', flex: 1 },
  flowBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 4 },
  flowBadgeText: { fontSize: 9, fontWeight: '800' },
  flowNetValue: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  controlRow: { flexDirection: 'row', gap: 10 },
  relayBtn: { flex: 1, padding: 12, borderRadius: 10, justifyContent: 'center' },
  btnRelayOn: { backgroundColor: '#065f46', borderColor: '#10b981', borderWidth: 1 },
  btnRelayOff: { backgroundColor: '#991b1b', borderColor: '#ef4444', borderWidth: 1 },
  relayBtnTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  relayBtnSubtitle: { color: '#cbd5e1', fontSize: 10, marginTop: 2 },
  btnReset: { backgroundColor: '#1e293b', paddingHorizontal: 14, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  btnResetText: { color: '#f8fafc', fontWeight: '700', fontSize: 12 },
  groupTitle: { color: '#cbd5e1', fontSize: 14, fontWeight: '700', marginBottom: 10, marginTop: 4 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: { width: '48%', backgroundColor: '#0f172a', borderRadius: 14, padding: 12, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  highlightCard: { backgroundColor: '#1e3a8a', borderColor: '#3b82f6' },
  highlightSolarCard: { backgroundColor: '#78350f', borderColor: '#f59e0b' },
  metricLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  metricValue: { color: '#f8fafc', fontSize: 20, fontWeight: '800', marginTop: 4 },
  highlightText: { color: '#60a5fa' },
  highlightSolarText: { color: '#fbbf24' },
  unit: { fontSize: 12, color: '#94a3b8', fontWeight: '400' },
  billHeroAmount: { color: '#f8fafc', fontSize: 32, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  billHeroStatus: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  tariffRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  tariffCol: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 10, alignItems: 'center' },
  tariffTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  rateStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { backgroundColor: '#334155', width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold' },
  rateValue: { color: '#f8fafc', fontSize: 13, fontWeight: '700' },
  energyBreakdownList: { gap: 8, marginBottom: 10 },
  breakdownCard: { backgroundColor: '#0f172a', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  breakdownTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  breakdownUnits: { color: '#f8fafc', fontSize: 15, fontWeight: '800', marginTop: 2 },
  breakdownCost: { color: '#f8fafc', fontSize: 14, fontWeight: '800' },
  noticeBox: { marginBottom: 14, padding: 12, backgroundColor: '#1e293b', borderRadius: 10 },
  noticeText: { color: '#cbd5e1', fontSize: 11, lineHeight: 16 },
  esgRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginVertical: 6 },
  esgNode: { alignItems: 'center', flex: 1 },
  esgNumber: { color: '#10b981', fontSize: 22, fontWeight: '800' },
  esgUnit: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  esgDivider: { width: 1, height: 40, backgroundColor: '#1e293b' },
  esgNote: { color: '#94a3b8', fontSize: 10, textAlign: 'center', marginTop: 8, lineHeight: 15 },
  todCard: { borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#1e293b' },
  todPeak: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#ef4444' },
  todOffPeak: { backgroundColor: 'rgba(56,189,248,0.1)', borderColor: '#38bdf8' },
  todTitle: { color: '#f8fafc', fontSize: 12, fontWeight: '700' },
  todSubtitle: { color: '#94a3b8', fontSize: 10, marginTop: 4, lineHeight: 15 },
  diagnosticsList: { backgroundColor: '#0f172a', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1e293b', gap: 10, marginBottom: 14 },
  diagItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  diagLabel: { color: '#94a3b8', fontSize: 11, flex: 1 },
  diagStatus: { fontSize: 10, fontWeight: '700', textAlign: 'right' },
  statusGood: { color: '#10b981' },
  statusBad: { color: '#ef4444' },
  statusUnknown: { color: '#94a3b8' },
  shareReportBtn: { backgroundColor: '#2563eb', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 14 },
  shareReportText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  errorBox: { marginTop: 10, padding: 10, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10 },
  errorText: { color: '#fca5a5', fontSize: 11, textAlign: 'center' },
});