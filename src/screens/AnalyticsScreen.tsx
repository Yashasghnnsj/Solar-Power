import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart3, TrendingUp, Sun, Home, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react-native';
import { useTelemetry } from '../context/TelemetryContext';

export function AnalyticsScreen() {
  const { hourlyHistory, dailyHistory, telemetry } = useTelemetry();
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');

  const maxDailySolar = Math.max(1, ...dailyHistory.map((d) => d.solarKWh));
  const maxHourlySolar = Math.max(1, ...hourlyHistory.map((h) => Math.max(h.solarW, h.loadW)));
  const hasHistory = hourlyHistory.length > 0 || dailyHistory.length > 0;

  const totalWeeklySolar = dailyHistory.reduce((acc, d) => acc + d.solarKWh, 0);
  const totalWeeklyLoad = dailyHistory.reduce((acc, d) => acc + d.loadKWh, 0);
  const totalWeeklyExport = dailyHistory.reduce((acc, d) => acc + d.exportKWh, 0);
  const totalWeeklyImport = dailyHistory.reduce((acc, d) => acc + d.importKWh, 0);

  const selfConsumptionRate = totalWeeklySolar > 0
    ? (((totalWeeklySolar - totalWeeklyExport) / totalWeeklySolar) * 100).toFixed(1)
    : '0';

  const gridIndependence = totalWeeklyLoad > 0
    ? (((totalWeeklyLoad - totalWeeklyImport) / totalWeeklyLoad) * 100).toFixed(1)
    : '0';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Energy Analytics</Text>
          <Text style={styles.subtitle}>Solar Generation & Grid Interaction Trends</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'hourly' && styles.tabButtonActive]}
            onPress={() => setActiveTab('hourly')}
          >
            <Text style={[styles.tabText, activeTab === 'hourly' && styles.tabTextActive]}>
              Today's Profile (Hourly)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'daily' && styles.tabButtonActive]}
            onPress={() => setActiveTab('daily')}
          >
            <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>
              7-Day Net Yield
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>
              {activeTab === 'hourly' ? 'GENERATION VS CONSUMPTION (W)' : 'DAILY ENERGY PRODUCTION (kWh)'}
            </Text>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Solar</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#38bdf8' }]} />
                <Text style={styles.legendText}>Load</Text>
              </View>
            </View>
          </View>

          {activeTab === 'hourly' && hourlyHistory.length === 0 ? (
            <Text style={styles.emptyState}>No historical meter data has been recorded.</Text>
          ) : activeTab === 'daily' && dailyHistory.length === 0 ? (
            <Text style={styles.emptyState}>No historical meter data has been recorded.</Text>
          ) : activeTab === 'hourly' ? (
            /* Hourly Bar Visualizer */
            <View style={styles.barsContainer}>
              {hourlyHistory.map((item, index) => {
                const solarHeight = (item.solarW / maxHourlySolar) * 120;
                const loadHeight = (item.loadW / maxHourlySolar) * 120;
                return (
                  <View key={index} style={styles.barColumn}>
                    <View style={styles.barPair}>
                      <View style={[styles.bar, { height: Math.max(4, solarHeight), backgroundColor: '#f59e0b' }]} />
                      <View style={[styles.bar, { height: Math.max(4, loadHeight), backgroundColor: '#38bdf8' }]} />
                    </View>
                    <Text style={styles.barLabel}>{item.hour}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            /* Daily Bar Visualizer */
            <View style={styles.barsContainer}>
              {dailyHistory.map((item, index) => {
                const solarHeight = (item.solarKWh / maxDailySolar) * 120;
                const loadHeight = (item.loadKWh / maxDailySolar) * 120;
                return (
                  <View key={index} style={styles.barColumn}>
                    <View style={styles.barPair}>
                      <View style={[styles.bar, { height: Math.max(6, solarHeight), backgroundColor: '#f59e0b' }]} />
                      <View style={[styles.bar, { height: Math.max(6, loadHeight), backgroundColor: '#38bdf8' }]} />
                    </View>
                    <Text style={styles.barLabel}>{item.day}</Text>
                    <Text style={styles.barSubLabel}>{item.solarKWh}k</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {hasHistory && <>
        {/* Key Performance Indicators */}
        <Text style={styles.sectionHeader}>PERFORMANCE METRICS</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <TrendingUp color="#10b981" size={20} />
            <Text style={styles.metricValue}>{selfConsumptionRate}%</Text>
            <Text style={styles.metricLabel}>Self-Consumption</Text>
            <Text style={styles.metricHint}>PV power used on-site</Text>
          </View>

          <View style={styles.metricCard}>
            <Sun color="#f59e0b" size={20} />
            <Text style={styles.metricValue}>{gridIndependence}%</Text>
            <Text style={styles.metricLabel}>Grid Independence</Text>
            <Text style={styles.metricHint}>Solar coverage of total load</Text>
          </View>

          <View style={styles.metricCard}>
            <ArrowUpRight color="#10b981" size={20} />
            <Text style={styles.metricValue}>{totalWeeklyExport.toFixed(1)} <Text style={styles.unit}>kWh</Text></Text>
            <Text style={styles.metricLabel}>7-Day Export</Text>
            <Text style={styles.metricHint}>Surplus sold back to grid</Text>
          </View>

          <View style={styles.metricCard}>
            <ArrowDownLeft color="#f59e0b" size={20} />
            <Text style={styles.metricValue}>{totalWeeklyImport.toFixed(1)} <Text style={styles.unit}>kWh</Text></Text>
            <Text style={styles.metricLabel}>7-Day Import</Text>
            <Text style={styles.metricHint}>Mains energy absorbed</Text>
          </View>
        </View>

        {/* Energy Summary Table */}
        <Text style={styles.sectionHeader}>WEEKLY SUMMARY</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Solar Generation</Text>
            <Text style={styles.summaryValue}>{totalWeeklySolar.toFixed(1)} kWh</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Home Consumption</Text>
            <Text style={styles.summaryValue}>{totalWeeklyLoad.toFixed(1)} kWh</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net Energy Balance</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              +{(totalWeeklyExport - totalWeeklyImport).toFixed(1)} kWh (Net Surplus)
            </Text>
          </View>
        </View>
        </>}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#1e293b',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#38bdf8',
  },
  chartCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  emptyState: { color: '#94a3b8', fontSize: 12, textAlign: 'center', paddingVertical: 48 },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 8,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: 6,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  barSubLabel: {
    fontSize: 8,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginVertical: 4,
    fontFamily: 'monospace',
  },
  unit: {
    fontSize: 12,
    color: '#94a3b8',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  metricHint: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f8fafc',
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
  },
});
