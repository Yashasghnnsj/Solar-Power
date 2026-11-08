import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LiveTelemetry, TariffConfig, HourlyDataPoint, DailyDataPoint, SystemAlert } from '../types';
import { ConnectionStatus, esp32Service } from '../services/esp32Service';

interface TelemetryContextType {
  telemetry: LiveTelemetry;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  espIp: string;
  tariff: TariffConfig;
  alerts: SystemAlert[];
  hourlyHistory: HourlyDataPoint[];
  dailyHistory: DailyDataPoint[];
  setEspIp: (ip: string) => void;
  setTariff: (tariff: TariffConfig) => void;
  toggleRelay: (relay: 'inverter' | 'grid') => void;
  resetEnergyCounters: () => void;
  dismissAlert: (id: string) => void;
}

const emptyTelemetry: LiveTelemetry = {
  voltageV: null,
  currentA: null,
  activePowerW: null,
  frequencyHz: null,
  powerFactor: null,
  solarPowerW: null,
  loadPowerW: null,
  netPowerW: null,
  exportEnergyKWh: null,
  importEnergyKWh: null,
  meterEnergyKWh: null,
  batteryVoltageV: null,
  batterySocPercent: null,
  inverterRelay: null,
  gridRelay: null,
  timestamp: '',
};

const defaultTariff: TariffConfig = {
  importRatePerKWh: 7.50,
  exportCreditPerKWh: 4.25,
  fixedMonthlyCharge: 150.00,
  currencySymbol: '₹',
};

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<LiveTelemetry>(emptyTelemetry);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [espIp, setEspIpState] = useState<string>(esp32Service.getIpAddress());
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [tariff, setTariff] = useState<TariffConfig>(defaultTariff);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const hourlyHistory: HourlyDataPoint[] = [];
  const dailyHistory: DailyDataPoint[] = [];
  const isConnected = connectionStatus === 'connected';

  const setEspIp = (ip: string) => {
    esp32Service.setIpAddress(ip);
    setEspIpState(ip);
    setConnectionAttempt((attempt) => attempt + 1);
    setTelemetry(emptyTelemetry);
  };

  const toggleRelay = (relay: 'inverter' | 'grid') => {
    const currentState = relay === 'inverter' ? telemetry.inverterRelay : telemetry.gridRelay;
    if (!isConnected || currentState === null) return;
    esp32Service.sendRelayCommand(relay, !currentState);
  };

  const resetEnergyCounters = () => {
    if (isConnected) esp32Service.sendCalibrationReset('energy');
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  useEffect(() => {
    esp32Service.connect(
      setTelemetry,
      (status, error) => {
        setConnectionStatus(status);
        setConnectionError(error ?? null);
      }
    );

    return () => {
      esp32Service.disconnect();
    };
  }, [espIp, connectionAttempt]);

  return (
    <TelemetryContext.Provider
      value={{
        telemetry,
        isConnected,
        connectionStatus,
        connectionError,
        espIp,
        tariff,
        alerts,
        hourlyHistory,
        dailyHistory,
        setEspIp,
        setTariff,
        toggleRelay,
        resetEnergyCounters,
        dismissAlert,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = (): TelemetryContextType => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
