import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Receipt, DollarSign, Leaf, Sparkles, SlidersHorizontal, Check } from 'lucide-react-native';
import { useTelemetry } from '../context/TelemetryContext';

export function BillingScreen() {
  const { telemetry, tariff, setTariff } = useTelemetry();
  const [isEditingTariff, setIsEditingTariff] = useState(false);
  const [importRateInput, setImportRateInput] = useState(tariff.importRatePerKWh.toString());
  const [exportCreditInput, setExportCreditInput] = useState(tariff.exportCreditPerKWh.toString());
  const [fixedChargeInput, setFixedChargeInput] = useState(tariff.fixedMonthlyCharge.toString());

  // Computations
  const importCost = telemetry.importEnergyKWh === null
    ? null
    : telemetry.importEnergyKWh * tariff.importRatePerKWh;
  const exportCredit = telemetry.exportEnergyKWh === null
    ? null
    : telemetry.exportEnergyKWh * tariff.exportCreditPerKWh;
  const grossSelfConsumption = telemetry.meterEnergyKWh === null || telemetry.exportEnergyKWh === null
    ? null
    : Math.max(0, telemetry.meterEnergyKWh - telemetry.exportEnergyKWh);
  const directSelfConsumptionSavings = grossSelfConsumption === null
    ? null
    : grossSelfConsumption * tariff.importRatePerKWh;
  const totalFinancialBenefit = directSelfConsumptionSavings === null || exportCredit === null
    ? null
    : directSelfConsumptionSavings + exportCredit;
  const netPayableBill = importCost === null || exportCredit === null
    ? null
    : Math.max(0, tariff.fixedMonthlyCharge + importCost - exportCredit);

  const handleSaveTariff = () => {
    const importRate = parseFloat(importRateInput) || 0;
    const exportCreditVal = parseFloat(exportCreditInput) || 0;
    const fixedCharge = parseFloat(fixedChargeInput) || 0;

    setTariff({
      ...tariff,
      importRatePerKWh: importRate,
      exportCreditPerKWh: exportCreditVal,
      fixedMonthlyCharge: fixedCharge,
    });
    setIsEditingTariff(false);
    Alert.alert('Settings Updated', 'Tariff parameters have been updated successfully.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Net Metering & Billing</Text>
          <Text style={styles.subtitle}>Utility Tariff, Grid Credits & Solar ROI</Text>
        </View>

        {/* Net Bill Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>ESTIMATED NET UTILITY PAYABLE</Text>
          <Text style={styles.heroAmount}>
            {tariff.currencySymbol}
            {netPayableBill === null ? '—' : netPayableBill.toFixed(2)}
          </Text>
          <Text style={styles.heroSub}>
            {netPayableBill === null
              ? 'Import/export meters are required to estimate the bill'
              : `Includes ${tariff.currencySymbol}${tariff.fixedMonthlyCharge.toFixed(0)} fixed meter charge`}
          </Text>

          <View style={styles.savingsBadge}>
            <Sparkles color="#10b981" size={16} />
            <Text style={styles.savingsText}>
              Total Solar Benefit: {totalFinancialBenefit === null
                ? '—'
                : `${tariff.currencySymbol}${totalFinancialBenefit.toFixed(2)}`}
            </Text>
          </View>
        </View>

        {/* Detailed Itemized Invoice Breakdown */}
        <Text style={styles.sectionHeader}>ITEMIZED NET TARIFF BREAKDOWN</Text>
        <View style={styles.billCard}>
          <View style={styles.billRow}>
            <View>
              <Text style={styles.rowTitle}>Grid Import Energy</Text>
              <Text style={styles.rowSub}>
                {telemetry.importEnergyKWh === null
                  ? 'Not measured'
                  : `${telemetry.importEnergyKWh.toFixed(2)} kWh @ ${tariff.currencySymbol}${tariff.importRatePerKWh}/kWh`}
              </Text>
            </View>
            <Text style={[styles.rowAmount, { color: '#f59e0b' }]}>
              {importCost === null ? '—' : `+${tariff.currencySymbol}${importCost.toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billRow}>
            <View>
              <Text style={styles.rowTitle}>Solar Export Feed-in Credit</Text>
              <Text style={styles.rowSub}>
                {telemetry.exportEnergyKWh === null
                  ? 'Not measured'
                  : `${telemetry.exportEnergyKWh.toFixed(2)} kWh @ ${tariff.currencySymbol}${tariff.exportCreditPerKWh}/kWh`}
              </Text>
            </View>
            <Text style={[styles.rowAmount, { color: '#10b981' }]}>
              {exportCredit === null ? '—' : `-${tariff.currencySymbol}${exportCredit.toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billRow}>
            <View>
              <Text style={styles.rowTitle}>Fixed Monthly Meter Surcharge</Text>
              <Text style={styles.rowSub}>Utility connection fee</Text>
            </View>
            <Text style={styles.rowAmount}>
              +{tariff.currencySymbol}{tariff.fixedMonthlyCharge.toFixed(2)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billRow}>
            <View>
              <Text style={[styles.rowTitle, { fontWeight: 'bold', color: '#f8fafc' }]}>Net Payable Total</Text>
              <Text style={styles.rowSub}>Final payable after solar credit deductions</Text>
            </View>
            <Text style={[styles.rowAmount, { fontSize: 18, color: '#38bdf8' }]}>
              {netPayableBill === null ? '—' : `${tariff.currencySymbol}${netPayableBill.toFixed(2)}`}
            </Text>
          </View>
        </View>

        {/* Environmental Eco Impact */}
        <Text style={styles.sectionHeader}>GREEN IMPACT & CO2 OFFSET</Text>
        <View style={styles.ecoCard}>
          <View style={styles.ecoItem}>
            <Leaf color="#10b981" size={24} />
            <Text style={styles.ecoVal}>—</Text>
            <Text style={styles.ecoLbl}>CO₂ Prevented</Text>
          </View>
          <View style={styles.ecoDivider} />
          <View style={styles.ecoItem}>
            <Text style={styles.treeEmoji}>🌳</Text>
            <Text style={styles.ecoVal}>—</Text>
            <Text style={styles.ecoLbl}>Trees Equivalent</Text>
          </View>
        </View>

        {/* Tariff Rate Configuration */}
        <View style={styles.configHeader}>
          <Text style={styles.sectionHeader}>DISCOM TARIFF RATES CONFIGURATION</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditingTariff(!isEditingTariff)}
          >
            <SlidersHorizontal color="#38bdf8" size={14} />
            <Text style={styles.editButtonText}>{isEditingTariff ? 'Cancel' : 'Edit Tariff'}</Text>
          </TouchableOpacity>
        </View>

        {isEditingTariff ? (
          <View style={styles.editorCard}>
            <Text style={styles.inputLabel}>Import Rate per kWh ({tariff.currencySymbol})</Text>
            <TextInput
              style={styles.input}
              value={importRateInput}
              onChangeText={setImportRateInput}
              keyboardType="numeric"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.inputLabel}>Export Feed-in Credit per kWh ({tariff.currencySymbol})</Text>
            <TextInput
              style={styles.input}
              value={exportCreditInput}
              onChangeText={setExportCreditInput}
              keyboardType="numeric"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.inputLabel}>Fixed Monthly Charge ({tariff.currencySymbol})</Text>
            <TextInput
              style={styles.input}
              value={fixedChargeInput}
              onChangeText={setFixedChargeInput}
              keyboardType="numeric"
              placeholderTextColor="#64748b"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTariff}>
              <Check color="#090d16" size={18} />
              <Text style={styles.saveButtonText}>Save Tariff Parameters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tariffInfoCard}>
            <View style={styles.tariffRow}>
              <Text style={styles.tariffLbl}>Import Tariff Rate</Text>
              <Text style={styles.tariffVal}>{tariff.currencySymbol}{tariff.importRatePerKWh.toFixed(2)} / kWh</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.tariffRow}>
              <Text style={styles.tariffLbl}>Export Solar Feed-in Credit</Text>
              <Text style={styles.tariffVal}>{tariff.currencySymbol}{tariff.exportCreditPerKWh.toFixed(2)} / kWh</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.tariffRow}>
              <Text style={styles.tariffLbl}>Fixed Monthly Meter Surcharge</Text>
              <Text style={styles.tariffVal}>{tariff.currencySymbol}{tariff.fixedMonthlyCharge.toFixed(2)}</Text>
            </View>
          </View>
        )}
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
  heroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
    alignItems: 'center',
  },
  heroLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', letterSpacing: 0.5 },
  heroAmount: { fontSize: 36, fontWeight: 'bold', color: '#38bdf8', marginVertical: 6, fontFamily: 'monospace' },
  heroSub: { fontSize: 11, color: '#64748b' },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  savingsText: { fontSize: 11, fontWeight: '700', color: '#10b981' },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  billCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowTitle: { fontSize: 12, fontWeight: '600', color: '#e2e8f0' },
  rowSub: { fontSize: 10, color: '#64748b', marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: 'bold', color: '#f8fafc', fontFamily: 'monospace' },
  divider: { height: 1, backgroundColor: '#1e293b' },
  ecoCard: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
    alignItems: 'center',
  },
  ecoItem: { flex: 1, alignItems: 'center' },
  ecoVal: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', marginTop: 4, fontFamily: 'monospace' },
  ecoLbl: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  ecoDivider: { width: 1, height: 40, backgroundColor: '#1e293b' },
  treeEmoji: { fontSize: 24 },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editButtonText: { fontSize: 11, color: '#38bdf8', fontWeight: '600' },
  editorCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  inputLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#38bdf8',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  saveButtonText: { fontSize: 13, fontWeight: 'bold', color: '#090d16' },
  tariffInfoCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tariffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tariffLbl: { fontSize: 12, color: '#94a3b8' },
  tariffVal: { fontSize: 12, fontWeight: 'bold', color: '#f8fafc', fontFamily: 'monospace' },
});
