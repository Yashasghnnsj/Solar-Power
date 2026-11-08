export interface LiveTelemetry {
  voltageV: number | null;
  currentA: number | null;
  activePowerW: number | null;
  frequencyHz: number | null;
  powerFactor: number | null;
  solarPowerW: number | null;
  loadPowerW: number | null;
  netPowerW: number | null;
  exportEnergyKWh: number | null;
  importEnergyKWh: number | null;
  meterEnergyKWh: number | null;
  batteryVoltageV: number | null;
  batterySocPercent: number | null;
  inverterRelay: boolean | null;
  gridRelay: boolean | null;
  timestamp: string;
}

export interface HourlyDataPoint {
  hour: string;
  solarW: number;
  loadW: number;
  netW: number;
}

export interface DailyDataPoint {
  day: string;
  solarKWh: number;
  loadKWh: number;
  exportKWh: number;
  importKWh: number;
  netSavings: number;
}

export interface TariffConfig {
  importRatePerKWh: number;
  exportCreditPerKWh: number;
  fixedMonthlyCharge: number;
  currencySymbol: string;
}

export interface SystemAlert {
  id: string;
  type: 'warning' | 'info' | 'danger';
  title: string;
  message: string;
  time: string;
}
