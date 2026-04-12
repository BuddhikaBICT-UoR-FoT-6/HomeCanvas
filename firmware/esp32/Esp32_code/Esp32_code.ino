/**
 * @file Esp32_code.ino
 * @author Senior IoT Systems Engineer
 * @brief Production-ready ESP32 Edge-Computing Node for HomeCanvas.
 * 
 * CORE ARCHITECTURE: 
 * - Local Reflexes for zero-latency automation.
 * - Hybrid Control: Dashboard overrides local sensors.
 * - Non-blocking Telemetry with Timestamp.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <TM1637Display.h>
#include <time.h>

// ==========================================
// CONFIGURATION & HARDWARE MAPPING
// ==========================================

// WiFi & Backend
const char* WIFI_SSID     = "Eternal Labyrinth";
const char* WIFI_PASSWORD = "Eden123479";
const String BACKEND_URL  = "http://10.92.209.240:8080/api/iot/telemetry";

// NTP for Timestamps
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 0;
const int   daylightOffset_sec = 0;

// Pin Mapping
#define PIN_PIR        13
#define PIN_LDR        32
#define PIN_SOUND      35
#define PIN_SERVO      27
#define PIN_LED        25
#define PIN_TM_CLK     26
#define PIN_TM_DIO     33
#define PIN_SERIAL2_TX 17

// Logic Thresholds
const int LDR_DARK_THRESHOLD   = 2000;
const int SOUND_ALARM_THRESHOLD = 3000;
const unsigned long TELEMETRY_INTERVAL = 2000;
const unsigned long DISPLAY_HOLD_TIME  = 10000; // 10 seconds

// ==========================================
// GLOBAL STATE
// ==========================================

Servo smartVent;
TM1637Display display(PIN_TM_CLK, PIN_TM_DIO);

unsigned long lastTelemetryTime = 0;
unsigned long dashboardDisplayUntil = 0;
int dashboardDisplayValue = -1;

// Override flags (from backend)
bool overrideLedActive = false;
bool overrideLedState  = false;
bool overrideFanActive = false;
bool overrideFanState  = false;

// ==========================================
// HELPERS
// ==========================================

String getISO8601Timestamp() {
    time_t now;
    time(&now);
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    char buffer[25];
    strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &timeinfo);
    return String(buffer);
}

/**
 * @brief Manual JSON parsing for response fields.
 * Avoids library dependency while remaining robust for small payloads.
 */
String getJsonValue(String json, String key) {
    int keyIdx = json.indexOf("\"" + key + "\":");
    if (keyIdx == -1) return "";
    
    int valStart = keyIdx + key.length() + 3;
    char firstChar = json.charAt(valStart);
    
    if (firstChar == '"') { // String value
        int valEnd = json.indexOf("\"", valStart + 1);
        return json.substring(valStart + 1, valEnd);
    } else { // Boolean or Numeric
        int valEnd = json.indexOf(",", valStart);
        if (valEnd == -1) valEnd = json.indexOf("}", valStart);
        return json.substring(valStart, valEnd);
    }
}

void processBackendCommands(String json) {
    // 1. LED Override
    String ledVal = getJsonValue(json, "ledOn");
    if (ledVal != "" && ledVal != "null") {
        overrideLedActive = true;
        overrideLedState = (ledVal == "true");
    } else {
        overrideLedActive = false;
    }

    // 2. Fan Override
    String fanVal = getJsonValue(json, "fanOn");
    if (fanVal != "" && fanVal != "null") {
        overrideFanActive = true;
        overrideFanState = (fanVal == "true");
    } else {
        overrideFanActive = false;
    }

    // 3. LCD Message Override
    String lcdMsg = getJsonValue(json, "lcdMessage");
    if (lcdMsg != "" && lcdMsg != "null") {
        dashboardDisplayValue = lcdMsg.toInt();
        dashboardDisplayUntil = millis() + DISPLAY_HOLD_TIME;
        Serial.println("[DASHBOARD] New Message: " + lcdMsg);
    }
}

// ==========================================
// CORE LOGIC
// ==========================================

void setup() {
    Serial.begin(115200);
    Serial2.begin(9600, SERIAL_8N1, 16, PIN_SERIAL2_TX);
    
    pinMode(PIN_PIR, INPUT);
    pinMode(PIN_LDR, INPUT);
    pinMode(PIN_SOUND, INPUT);
    pinMode(PIN_LED, OUTPUT);
    digitalWrite(PIN_LED, LOW); // Start OFF
    
    smartVent.attach(PIN_SERVO);
    smartVent.write(0);
    
    display.setBrightness(0x0f);
    display.clear();
    
    // WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
    Serial.println("\n[WIFI] Connected.");

    // NTP
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
}

void loop() {
    // 1. Read Sensors
    int lightLevel     = analogRead(PIN_LDR);
    int noiseLevel     = analogRead(PIN_SOUND);
    bool motionDetected = (digitalRead(PIN_PIR) == HIGH);

    // 2. Local Reflexes & Overrides

    // A. Lighting Control
    if (overrideLedActive) {
        digitalWrite(PIN_LED, overrideLedState ? HIGH : LOW);
    } else {
        digitalWrite(PIN_LED, (lightLevel < LDR_DARK_THRESHOLD) ? HIGH : LOW);
    }

    // B. Ventilation Control (Security has global priority)
    if (noiseLevel > SOUND_ALARM_THRESHOLD) {
        smartVent.write(0); // Lockdown
        Serial2.println("SECURITY LOCKDOWN: WINDOW BREACH!");
    } else if (overrideFanActive) {
        smartVent.write(overrideFanState ? 90 : 0);
    } else {
        smartVent.write(motionDetected ? 45 : 0);
    }

    // C. 4-Digit Display (Hybrid)
    if (millis() < dashboardDisplayUntil) {
        display.showNumberDec(dashboardDisplayValue, true);
    } else {
        display.showNumberDec(noiseLevel, false);
    }

    // 3. Telemetry Sync
    if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL) {
        lastTelemetryTime = millis();
        
        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(BACKEND_URL);
            http.addHeader("Content-Type", "application/json");

            String payload = "{";
            payload += "\"macAddress\":\"" + WiFi.macAddress() + "\",";
            payload += "\"timestamp\":\"" + getISO8601Timestamp() + "\",";
            payload += "\"lightLevel\":" + String(lightLevel) + ",";
            payload += "\"noiseLevel\":" + String(noiseLevel) + ",";
            payload += "\"motionDetected\":" + String(motionDetected ? "true" : "false");
            payload += "}";

            int httpCode = http.POST(payload);
            if (httpCode == 200) {
                String response = http.getString();
                processBackendCommands(response);
            }
            http.end();
        }
    }

    delay(10);
}
