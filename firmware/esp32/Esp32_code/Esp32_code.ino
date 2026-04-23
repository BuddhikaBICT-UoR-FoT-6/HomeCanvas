/**
 * @file Esp32_code.ino
 * @author Senior IoT Systems Engineer
 * @brief Enterprise-grade ESP32 Edge-Computing Node using MQTT.
 * 
 * PROTOCOL UPGRADE: 
 * - Swapped HTTP for MQTT (Message Queuing Telemetry Transport).
 * - Real-time command reception via Subscribe (no polling delay).
 * - Lightweight telemetry via Publish.
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiUdp.h>
#include <ESP32Servo.h>
#include <TM1637Display.h>
#include <time.h>

// ==========================================
// CONFIGURATION & HARDWARE MAPPING
// ==========================================

// WiFi Configuration
const char* WIFI_SSID     = "Eternal Labyrinth";
const char* WIFI_PASSWORD = "Eden123479";

// MQTT Configuration
String MQTT_BROKER = ""; // Will be dynamically discovered
const int   MQTT_PORT     = 1883;
const char* MQTT_CLIENT_ID = "HomeCanvas-ESP32-Node";

// UDP Discovery Configuration
const int UDP_DISCOVERY_PORT = 8888;
const char* DISCOVERY_REQUEST = "DISCOVER_HOMECANVAS_MQTT";
const char* DISCOVERY_RESPONSE = "HOMECANVAS_ACK";
WiFiUDP udp;

// MQTT Topics
String TOPIC_TELEMETRY;
String TOPIC_COMMANDS;

// NTP for Timestamps
const char* ntpServer = "pool.ntp.org";

// Pin Mapping
#define PIN_PIR        19 // Moved to GPIO 19 (Final attempt at stable pin)
#define PIN_LDR        35 // LDR is physically on GPIO 35
#define PIN_SOUND      32 // Sound sensor is physically on GPIO 32
#define PIN_SERVO      27
#define PIN_LED        25
#define PIN_TM_CLK     26
#define PIN_TM_DIO     33
#define PIN_SERIAL2_TX 17

// Logic Thresholds
const int LDR_DARK_THRESHOLD   = 150;  // Bright=~280, so <150 means dark/covered
const int SOUND_ALARM_THRESHOLD = 500;  // More sensitive for your sensor
const unsigned long TELEMETRY_INTERVAL = 2000;
const unsigned long DISPLAY_HOLD_TIME  = 10000;

// ==========================================
// GLOBAL OBJECTS & STATE
// ==========================================

WiFiClient espClient;
PubSubClient mqttClient(espClient);
Servo smartVent;
TM1637Display display(PIN_TM_CLK, PIN_TM_DIO);

unsigned long lastTelemetryTime = 0;
unsigned long dashboardDisplayUntil = 0;
int dashboardDisplayValue = -1;
int currentVentAngle = -1; // To track and prevent redundant writes

// Override flags (from MQTT)
bool overrideLedActive = false;
bool overrideLedState  = false;
bool overrideFanActive = false;
bool overrideFanState  = false;

// Sensor Calibration (Auto-Calibrate on Startup)
int ldrMinValue = 1023;  // Start high, will decrease as we see darker readings
int ldrMaxValue = 0;     // Start low, will increase as we see brighter readings
int pirDebounceCount = 0; // PIR debounce counter
const int PIR_DEBOUNCE_THRESHOLD = 3; // Need 3 consecutive HIGH reads to confirm motion

// ==========================================
// MQTT CALLBACK (Command Processing)
// ==========================================

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String message;
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    
    Serial.println("[MQTT] Received Command: " + message);

    // Simple JSON parsing (Manual string matching)
    // Format: {"fanOn":true, "ledOn":false, "lcdMessage":"1234", ...}
    
    // 1. LED Control
    if (message.indexOf("\"ledOn\":true") >= 0 || message.indexOf("\"ledOn\": true") >= 0) {
        overrideLedActive = true; 
        overrideLedState = true;
        digitalWrite(PIN_LED, HIGH);
        Serial.println("[CMD] LED ON (Manual Override)");
    } else if (message.indexOf("\"ledOn\":false") >= 0 || message.indexOf("\"ledOn\": false") >= 0) {
        overrideLedActive = true; 
        overrideLedState = false;
        digitalWrite(PIN_LED, LOW);
        Serial.println("[CMD] LED OFF (Manual Override)");
    } else if (message.indexOf("\"resetLedAuto\":true") >= 0 || message.indexOf("\"ledOn\":null") >= 0 || message.indexOf("\"ledOn\": null") >= 0) {
        overrideLedActive = false;
        Serial.println("[CMD] LED set to AUTO");
    }

    // 2. Servo (Fan) Control
    if (message.indexOf("\"fanOn\":true") >= 0 || message.indexOf("\"fanOn\": true") >= 0) {
        overrideFanActive = true; 
        overrideFanState = true;
        smartVent.write(90);
        Serial.println("[CMD] SERVO 90° (Manual Override)");
    } else if (message.indexOf("\"fanOn\":false") >= 0 || message.indexOf("\"fanOn\": false") >= 0) {
        overrideFanActive = true; 
        overrideFanState = false;
        smartVent.write(0);
        Serial.println("[CMD] SERVO 0° (Manual Override)");
    } else if (message.indexOf("\"resetFanAuto\":true") >= 0 || message.indexOf("\"fanOn\":null") >= 0 || message.indexOf("\"fanOn\": null") >= 0) {
        overrideFanActive = false;
        Serial.println("[CMD] SERVO set to AUTO");
    }

    // 3. LCD Message
    int lcdIdx = message.indexOf("\"lcdMessage\":\"");
    if (lcdIdx >= 0) {
        int start = lcdIdx + 14;
        int end = message.indexOf("\"", start);
        String msg = message.substring(start, end);
        if (msg != "null" && msg != "") {
            dashboardDisplayValue = msg.toInt();
            dashboardDisplayUntil = millis() + DISPLAY_HOLD_TIME;
            Serial.print("[CMD] Display Value: ");
            Serial.println(dashboardDisplayValue);
        }
    }
}

void reconnect() {
    while (!mqttClient.connected()) {
        Serial.print("[MQTT] Attempting connection...");
        if (mqttClient.connect(MQTT_CLIENT_ID)) {
            Serial.println("connected");
            mqttClient.subscribe(TOPIC_COMMANDS.c_str());
            Serial.println("[MQTT] Subscribed to: " + TOPIC_COMMANDS);
        } else {
            Serial.print("failed, rc=");
            Serial.print(mqttClient.state());
            Serial.println(" try again in 5 seconds");
            delay(5000);
        }
    }
}

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

// ==========================================
// SETUP & LOOP
// ==========================================

void setup() {
    Serial.begin(115200);
    Serial2.begin(9600, SERIAL_8N1, 16, PIN_SERIAL2_TX);

    // Allocate timers for ESP32PWM (improves stability)
    ESP32PWM::allocateTimer(0);
    ESP32PWM::allocateTimer(1);
    ESP32PWM::allocateTimer(2);
    ESP32PWM::allocateTimer(3);
    
    pinMode(PIN_PIR, INPUT_PULLDOWN); // Restoring pull-down for stability
    pinMode(PIN_LDR, INPUT);          // LDR on 3.3V with 10k divider
    pinMode(PIN_SOUND, INPUT);        // Sound on 5V (from Arduino)
    // Per-pin ADC config: LDR needs 0db (sensitive), Sound needs 11db (full range)
    analogSetPinAttenuation(PIN_LDR, ADC_0db);    // 0-1.1V range (sensitive for LDR on G35)
    analogSetPinAttenuation(PIN_SOUND, ADC_11db);  // 0-3.3V range (for Sound on G32)
    
    pinMode(PIN_LED, OUTPUT);
    digitalWrite(PIN_LED, LOW);
    
    smartVent.attach(PIN_SERVO);
    // Servo Startup 'Handshake' Test
    smartVent.write(90); delay(500);
    smartVent.write(0);  delay(500);
    smartVent.write(0);
    
    display.setBrightness(0x0f);
    display.clear();
    
    // WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
    Serial.println("\n[WIFI] Connected.");

    // UDP Auto-Discovery for MQTT Broker
    Serial.println("[DISCOVERY] Searching for HomeCanvas Backend...");
    udp.begin(UDP_DISCOVERY_PORT);
    
    while (MQTT_BROKER == "") {
        // Broadcast discovery request
        udp.beginPacket("255.255.255.255", UDP_DISCOVERY_PORT);
        udp.write((const uint8_t*)DISCOVERY_REQUEST, strlen(DISCOVERY_REQUEST));
        udp.endPacket();
        
        Serial.println("[DISCOVERY] Broadcast packet sent. Waiting for ACK...");
        
        // Wait for response (timeout 2 seconds)
        unsigned long startTime = millis();
        while (millis() - startTime < 2000) {
            int packetSize = udp.parsePacket();
            if (packetSize) {
                char incomingPacket[256];
                int len = udp.read(incomingPacket, 255);
                if (len > 0) {
                    incomingPacket[len] = 0;
                }
                
                if (String(incomingPacket).equals(DISCOVERY_RESPONSE)) {
                    MQTT_BROKER = udp.remoteIP().toString();
                    Serial.print("[DISCOVERY] Found MQTT Broker at ");
                    Serial.println(MQTT_BROKER);
                    break;
                }
            }
            delay(10);
        }
    }
    udp.stop();

    // Dynamic Topic Construction
    String mac = WiFi.macAddress();
    TOPIC_TELEMETRY = "homecanvas/telemetry/" + mac;
    TOPIC_COMMANDS  = "homecanvas/commands/" + mac;

    // MQTT Setup
    mqttClient.setServer(MQTT_BROKER.c_str(), MQTT_PORT);
    mqttClient.setBufferSize(512); // Increase buffer size for JSON payloads
    mqttClient.setCallback(mqttCallback);

    // NTP
    configTime(0, 0, ntpServer);
}

void loop() {
    if (!mqttClient.connected()) {
        reconnect();
    }
    mqttClient.loop();

    // 1. Read Sensors (average 10 samples to smooth WiFi noise)
    long ldrSum = 0, sndSum = 0;
    for (int i = 0; i < 10; i++) {
        ldrSum += analogRead(PIN_LDR);
        sndSum += analogRead(PIN_SOUND);
        delayMicroseconds(500);
    }
    int lightLevel  = ldrSum / 10;
    int noiseLevel  = sndSum / 10;
    bool pirRaw     = (digitalRead(PIN_PIR) == HIGH);

    // PIR Debouncing (cap at 10 to prevent overflow)
    if (pirRaw) {
        if (pirDebounceCount < 10) pirDebounceCount++;
    } else {
        pirDebounceCount = 0;
    }
    bool motionDetected = (pirDebounceCount >= PIR_DEBOUNCE_THRESHOLD);

    // 2. Local Reflexes & Overrides

    // A. Lighting Control (with hysteresis to prevent blinking)
    //    Bright/uncovered = ~450, Dark/covered = ~200
    //    LED turns ON below 250, turns OFF above 350
    if (overrideLedActive) {
        digitalWrite(PIN_LED, overrideLedState ? HIGH : LOW);
    } else {
        bool ledCurrentlyOn = (digitalRead(PIN_LED) == HIGH);
        if (!ledCurrentlyOn && lightLevel < 250) {
            digitalWrite(PIN_LED, HIGH);  // Turn ON when dark
        } else if (ledCurrentlyOn && lightLevel > 350) {
            digitalWrite(PIN_LED, LOW);   // Turn OFF when bright
        }
    }

    // B. Ventilation Control
    int intendedAngle = 0;
    if (noiseLevel > SOUND_ALARM_THRESHOLD) {
        intendedAngle = 0;
        Serial2.println("SECURITY LOCKDOWN: WINDOW BREACH!");
    } else if (overrideFanActive) {
        intendedAngle = overrideFanState ? 90 : 0;
    } else {
        intendedAngle = motionDetected ? 45 : 0;
    }
    
    // Only write to servo if angle has changed to prevent PWM jitter
    if (intendedAngle != currentVentAngle) {
        currentVentAngle = intendedAngle;
        smartVent.write(currentVentAngle);
        Serial.print("[SERVO] Moving to: ");
        Serial.println(currentVentAngle);
    }

    // C. 4-Digit Display
    if (millis() < dashboardDisplayUntil) {
        display.showNumberDec(dashboardDisplayValue, true);
    } else {
        display.showNumberDec(noiseLevel, false);
    }

    // 3. Telemetry & Debugging
    if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL) {
        lastTelemetryTime = millis();
        
        String payload = "{";
        payload += "\"macAddress\":\"" + WiFi.macAddress() + "\",";
        payload += "\"timestamp\":\"" + getISO8601Timestamp() + "\",";
        payload += "\"lightLevel\":" + String(lightLevel) + ",";
        payload += "\"noiseLevel\":" + String(noiseLevel) + ",";
        payload += "\"motionDetected\":" + String(motionDetected ? "true" : "false") + ",";
        payload += "\"ventAngle\":" + String(intendedAngle);
        payload += "}";

        mqttClient.publish(TOPIC_TELEMETRY.c_str(), payload.c_str());
        Serial.println("[MQTT] Telemetry Published");
        
        Serial.print("SYS >> LDR:"); Serial.print(lightLevel);
        Serial.print(" | SND:"); Serial.print(noiseLevel);
        Serial.print(" | PIR_RAW:"); Serial.print(pirRaw ? "1" : "0");
        Serial.print(" | MOTION:"); Serial.print(motionDetected ? "YES" : "NO");
        Serial.print(" | LED:"); Serial.println(digitalRead(PIN_LED) ? "ON" : "OFF");
    }
}
