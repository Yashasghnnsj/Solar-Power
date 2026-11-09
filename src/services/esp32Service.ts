/**
 * ESP32 Net-Meter Telemetry Service
 * Connects via WebSocket to the ESP32 IP address on the local network.
 */
import { LiveTelemetry } from '../types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

type StatusCallback = (status: ConnectionStatus, error?: string) => void;

const numericFields = [
  'voltageV',
  'currentA',
  'activePowerW',
  'frequencyHz',
  'powerFactor',
  'solarPowerW',
  'loadPowerW',
  'netPowerW',
  'exportEnergyKWh',
  'importEnergyKWh',
  'meterEnergyKWh',
  'batteryVoltageV',
  'batterySocPercent',
] as const;

const booleanFields = ['inverterRelay', 'gridRelay'] as const;

function parseTelemetry(value: unknown): LiveTelemetry | null {
  if (!value || typeof value !== 'object') return null;

  const data = value as Record<string, unknown>;
  const hasValidNumbers = numericFields.every((field) => {
    const reading = data[field];
    return reading === null || (typeof reading === 'number' && Number.isFinite(reading));
  });
  const hasValidRelays = booleanFields.every((field) =>
    data[field] === null || typeof data[field] === 'boolean'
  );

  if (!hasValidNumbers || !hasValidRelays) return null;

  return {
    ...(data as Omit<LiveTelemetry, 'timestamp'>),
    timestamp: typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
  };
}

export class ESP32Service {
  private socket: WebSocket | null = null;
  private ipAddress = '192.168.4.1';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;
  private active = false;
  private onMessageCallback: ((data: LiveTelemetry) => void) | null = null;
  private onStatusCallback: StatusCallback | null = null;

  public setIpAddress(ip: string) {
    this.ipAddress = ip;
  }

  public getIpAddress(): string {
    return this.ipAddress;
  }

  public connect(onMessage: (data: LiveTelemetry) => void, onStatusChange: StatusCallback) {
    this.disconnect();
    this.onMessageCallback = onMessage;
    this.onStatusCallback = onStatusChange;
    this.active = true;
    this.openSocket();
  }

  private openSocket() {
    if (!this.active) return;

    this.onStatusCallback?.('connecting');
    let socket: WebSocket;
    try {
      socket = new WebSocket(`ws://${this.ipAddress}:81`);
    } catch (error) {
      console.error('[ESP32] Could not create WebSocket:', error);
      this.onStatusCallback?.('disconnected', `Could not connect to ${this.ipAddress}:81.`);
      this.scheduleReconnect();
      return;
    }

    this.socket = socket;
    this.armTelemetryTimeout(socket);

    socket.onopen = () => {
      console.log(`[ESP32] WebSocket opened to ${this.ipAddress}; waiting for telemetry`);
    };

    socket.onmessage = (event) => {
      let payload: unknown;
      try {
        payload = JSON.parse(event.data);
      } catch (error) {
        console.error('[ESP32] Invalid JSON telemetry:', error);
        return;
      }

      const telemetry = parseTelemetry(payload);
      if (!telemetry) {
        console.error('[ESP32] Received telemetry with an invalid shape');
        return;
      }

      this.armTelemetryTimeout(socket);
      this.onMessageCallback?.(telemetry);
      this.onStatusCallback?.('connected');
    };

    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      if (this.connectionTimer) {
        clearTimeout(this.connectionTimer);
        this.connectionTimer = null;
      }
      this.onStatusCallback?.(
        'disconnected',
        `Can't reach ${this.ipAddress}:81. Check the ESP32 IP and make sure both devices are on the same Wi-Fi.`
      );
      this.scheduleReconnect();
    };

    socket.onerror = (error) => {
      console.warn('[ESP32] WebSocket connection error:', error);
    };
  }

  private armTelemetryTimeout(socket: WebSocket) {
    if (this.connectionTimer) clearTimeout(this.connectionTimer);
    this.connectionTimer = setTimeout(() => {
      if (this.socket !== socket || socket.readyState === WebSocket.CLOSED) return;
      this.onStatusCallback?.(
        'disconnected',
        `No recent telemetry from ${this.ipAddress}:81. Check the ESP32 firmware and network.`
      );
      socket.close();
    }, 8000);
  }

  private scheduleReconnect() {
    if (!this.active || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, 2000);
  }

  public disconnect() {
    this.active = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    if (this.socket) {
      const socket = this.socket;
      this.socket = null;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.close();
    }
  }

  public sendRelayCommand(relay: 'inverter' | 'grid', state: boolean) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        action: 'set_relay',
        target: relay,
        state: state ? 1 : 0,
      }));
    }
  }

  public sendCalibrationReset(target: 'energy' | 'all') {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        action: 'reset_counter',
        target,
      }));
    }
  }
}

export const esp32Service = new ESP32Service();
