/*
  ESP32 + PZEM-004T v3.0 Smart Net-Meter WebSocket Firmware
  Streams measured PZEM readings and reports unavailable sensors as JSON null.
*/

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <PZEM004Tv30.h>
#include <ArduinoJson.h>

// Set these to the 2.4 GHz Wi-Fi network shared by the ESP32 and phone.
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

#define PZEM_RX_PIN 16
#define PZEM_TX_PIN 17
#define RELAY_INVERTER_PIN 22
#define RELAY_GRID_PIN 23

PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);
WebSocketsServer webSocket = WebSocketsServer(81);
unsigned long lastStreamTime = 0;

void setMeasurement(JsonObject doc, const char* key, float value) {
  if (isnan(value) || isinf(value)) {
    doc[key] = nullptr;
  } else {
    doc[key] = value;
  }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  if (type == WStype_CONNECTED) {
    Serial.printf("[WebSocket] Client #%u connected\n", num);
  } else if (type == WStype_TEXT) {
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    if (error) return;

    const char* action = doc["action"] | "";
    if (strcmp(action, "set_relay") == 0) {
      const char* target = doc["target"] | "";
      int state = doc["state"] | 0;
      if (strcmp(target, "inverter") == 0) {
        digitalWrite(RELAY_INVERTER_PIN, state ? HIGH : LOW);
      } else if (strcmp(target, "grid") == 0) {
        digitalWrite(RELAY_GRID_PIN, state ? HIGH : LOW);
      }
    } else if (strcmp(action, "reset_counter") == 0) {
      pzem.resetEnergy();
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_INVERTER_PIN, OUTPUT);
  pinMode(RELAY_GRID_PIN, OUTPUT);
  digitalWrite(RELAY_INVERTER_PIN, HIGH);
  digitalWrite(RELAY_GRID_PIN, HIGH);

  WiFi.setSleep(false);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.print("\nWi-Fi connected. ESP32 IP address: ");
  Serial.println(WiFi.localIP());

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();

  if (millis() - lastStreamTime >= 1000) {
    lastStreamTime = millis();

    const float voltage = pzem.voltage();
    const float current = pzem.current();
    const float power = pzem.power();
    const float energy = pzem.energy();
    const float frequency = pzem.frequency();
    const float powerFactor = pzem.pf();

    StaticJsonDocument<512> document;
    JsonObject telemetry = document.to<JsonObject>();
    setMeasurement(telemetry, "voltageV", voltage);
    setMeasurement(telemetry, "currentA", current);
    setMeasurement(telemetry, "activePowerW", power);
    setMeasurement(telemetry, "frequencyHz", frequency);
    setMeasurement(telemetry, "powerFactor", powerFactor);

    // A single PZEM cannot independently measure PV, household, grid-flow, or battery data.
    telemetry["solarPowerW"] = nullptr;
    telemetry["loadPowerW"] = nullptr;
    telemetry["netPowerW"] = nullptr;
    telemetry["exportEnergyKWh"] = nullptr;
    telemetry["importEnergyKWh"] = nullptr;
    setMeasurement(telemetry, "meterEnergyKWh", energy);
    telemetry["batteryVoltageV"] = nullptr;
    telemetry["batterySocPercent"] = nullptr;
    telemetry["inverterRelay"] = digitalRead(RELAY_INVERTER_PIN) == HIGH;
    telemetry["gridRelay"] = digitalRead(RELAY_GRID_PIN) == HIGH;
    telemetry["timestamp"] = millis();

    String json;
    serializeJson(telemetry, json);
    webSocket.broadcastTXT(json);
  }
}
