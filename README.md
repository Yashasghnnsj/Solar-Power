# PV Smart Net-Meter Mobile App (React Native / Expo / TypeScript)

A modern mobile telemetry and control dashboard for **Solar PV Bi-Directional Net-Metering** powered by **ESP32** and **PZEM-004T v3.0** electrical energy monitors.

---

## 📱 Features

1. **Live Power Telemetry (`Live Power` Tab)**
   - Bi-directional net power flow (`P_net = P_solar - P_load`)
   - Real-time surplus export / grid import indicator
   - High-accuracy electrical parameters: Voltage (V), RMS Current (A), Active Power (W), Frequency (Hz), Power Factor (PF)
   - Energy counters: Accumulated Export (kWh), Import (kWh), Total Solar Yield (kWh)

2. **Energy Analytics (`Analytics` Tab)**
   - Hourly profile comparison (Solar Generation vs Household Load)
   - 7-Day Net Energy Production yield
   - Self-Consumption Ratio (%) and Grid Independence Index (%)
   - Net energy balance and weekly summary tables

3. **Net Metering & Billing (`Billing & ROI` Tab)**
   - Itemized DISCOM / Utility bill calculation
   - Solar feed-in tariff credit deductions & net payable total
   - Dynamic Tariff Configurator (Import rate, Export credit, Fixed meter charges)
   - Carbon offset calculator (CO₂ saved in kg & trees equivalent)

4. **System & Hardware Controls (`Controls` Tab)**
   - ESP32 local network IP configuration (`ws://<IP>:81`) with automatic reconnect
   - Solid-state relay control for Solar Inverter and Grid-Tie synchronization
   - PZEM-004T EEPROM counter reset with confirmation dialogs
   - System alert feed and hardware diagnostic metrics

---

## 🚀 Quick Start Guide

### 1. Configure and flash the ESP32

In `esp32_firmware/esp32_smart_meter.ino`, replace `YOUR_WIFI_SSID` and
`YOUR_WIFI_PASSWORD` with the credentials for a 2.4 GHz Wi-Fi network. Flash
the sketch and open the serial monitor at 115200 baud to read the ESP32's IP
address. The phone and ESP32 must be on the same local network; guest Wi-Fi or
client isolation can prevent them from communicating.

Install the Arduino libraries used by the sketch: **WebSockets** by Markus
Sattler, **PZEM004Tv30**, and **ArduinoJson**.

### 2. Install app dependencies
```bash
npm install
```

### 3. Build and run the Android app
```bash
npm run android
```

The Android manifest allows cleartext traffic for the local `ws://` connection;
rebuild the native app after changing native configuration. In the app's
**Controls** tab, enter the IP printed by the ESP32 and tap **Connect**. The app
retries automatically and shows connection errors instead of substituting
simulated readings.

The app only displays readings the connected hardware reports. A single
PZEM-004T cannot separately measure solar generation, household load,
import/export energy, or battery state, so those values appear as unavailable.
Use additional appropriately placed meters/sensors and extend the firmware
before relying on those measurements. Analytics remain empty until historical
storage is implemented.

The WebSocket parser accepts both the current camelCase telemetry keys and
legacy firmware keys such as `mains_voltage` and `total_export`. If legacy
telemetry omits `meterEnergyKWh`, the app shows that reading as unavailable.

---

## 🛠️ Project Structure

```
pv-smart-netmeter/
├── App.tsx                      # Main application entry point with Tab navigation
├── app.json                     # Expo configuration
├── babel.config.js              # Babel preset config
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript strict configuration
├── src/
│   ├── context/
│   │   └── TelemetryContext.tsx # Live telemetry and connection state
│   ├── screens/
│   │   ├── DashboardScreen.tsx  # Live power flow & electrical dials
│   │   ├── AnalyticsScreen.tsx  # Generation vs load analytics & KPI charts
│   │   ├── BillingScreen.tsx    # Net tariff bill breakdown & tariff editor
│   │   └── ControlScreen.tsx    # ESP32 IP bridge & relay breaker controls
│   ├── services/
│   │   └── esp32Service.ts      # WebSocket communication layer
│   └── types/
│       └── index.ts             # TypeScript interfaces for telemetry & tariffs
└── esp32_firmware/
    └── esp32_smart_meter.ino    # Arduino sketch for ESP32 + PZEM-004T v3.0
```

---

## ⚡ Hardware Wiring & Architecture

- **Microcontroller**: ESP32-WROOM-32
- **Energy Meter**: PZEM-004T v3.0 connected via UART (`RX: GPIO 16`, `TX: GPIO 17`)
- **Current Transformer**: 100A Split-Core CT clamped to mains bi-directional line
- **Actuators**: 2-Channel 5V/3.3V Relay Module (`GPIO 22` & `GPIO 23`)
- **Transport**: Real-time WebSocket streaming over LAN on port `81` (`ws://<ESP32_IP>:81`)
