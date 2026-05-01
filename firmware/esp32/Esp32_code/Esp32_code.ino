/**
 * @file Esp32_code.ino
 * @brief Enterprise-grade ESP32 Edge Node - Weighted Occupancy System (Phase 1)
 * 
 * - All logical decision-making happens in Spring Boot backend
 * - ESP32 reads sensors, publishes telemetry, executes remote commands
 * - No local occupancy logic - backend owns all intelligence
 * 
 * MQTT PROTOCOL:
 * - Publish: home/sensors/telemetry (every 1 second)
 * - Subscribe: home/action/commands (real-time execution)
 * 
 * BEHAVIOR:
 * 1. Every 1 second: Read PIR, LDR, Sound → Publish JSON
 * 2. On command: Parse JSON → Execute (Servo, LED, Display, Alerts)
 * 3. Display: Shows confidence score from backend
 * 4. Failover: Serial2 prints "SECURITY ALERT" on lockdown
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiUdp.h>
#include <ESP32Servo.h>
#include <TM1637Display.h>
#include <ArduinoJson.h>  // Add for robust JSON parsing
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

// MQTT Topics (Per Requirements)
const char* TOPIC_TELEMETRY = "home/sensors/telemetry";
const char* TOPIC_COMMANDS  = "home/action/commands";

// NTP for Timestamps
const char* ntpServer = "pool.ntp.org";

// Pin Mapping (Per Hardware Specification)
#define PIN_PIR        13  // Motion sensor (GPIO 13 as per requirements)
#define PIN_LDR        32  // Light sensor via 10k divider (GPIO 32 as per requirements)
#define PIN_SOUND      35  // KY-037 Sound sensor (GPIO 35 as per requirements)
#define PIN_SERVO      27  // Servo control (GPIO 27)
#define PIN_LED        25  // Status LED (GPIO 25)
#define PIN_TM_CLK     26  // TM1637 Clock (GPIO 26)
#define PIN_TM_DIO     33  // TM1637 Data (GPIO 33)
#define PIN_SERIAL2_TX 17  // Serial2 failover TX (GPIO 17, RX=16)


// Sensor Thresholds (Per Specification)
const int LIGHT_DARK_THRESHOLD  = 150;  // LDR: Light < 150 = Dark
const int SOUND_NOISE_THRESHOLD = 1500; // Sound for confidence calculation
const int SOUND_GLASS_THRESHOLD = 3000; // Glass break anomaly
const unsigned long TELEMETRY_INTERVAL = 1000;  // Publish every 1 second
const unsigned long DISPLAY_HOLD_TIME  = 5000;  // Hold confidence display for 5 seconds

// ==========================================
// GLOBAL OBJECTS & STATE
// ==========================================

WiFiClient espClient;
PubSubClient mqttClient(espClient);
Servo smartVent;
TM1637Display display(PIN_TM_CLK, PIN_TM_DIO);

// Telemetry timing
unsigned long lastTelemetryTime = 0;

// Display state
unsigned long displayConfidenceUntil = 0;
int currentDisplayValue = 0;

// Servo state tracking (prevent redundant writes)
int currentServoAngle = -1;

// Sensor calibration & debouncing
int pirDebounceCount = 0;
const int PIR_DEBOUNCE_THRESHOLD = 3;

// ==========================================
// MQTT CALLBACK - Command Processor
// ==========================================

/**
 * MQTT Command Schema (from Backend):
 * {
 *   "servoAngle": 90,      // 0-90 degrees
 *   "ledState": true,      // LED on/off
 *   "confidence": 100,     // 0-100 (display on TM1637)
 *   "lockdown": false      // Security alert flag
 * }
 */
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    // Convert payload to string
    char jsonBuffer[256];
    if (length >= 255) {
        Serial.println("[ERROR] Command payload too large!");
        return;
    }
    
    strncpy(jsonBuffer, (char*)payload, length);
    jsonBuffer[length] = '\0';
    
    Serial.print("[MQTT] Received Command: ");
    Serial.println(jsonBuffer);

    // Parse JSON using ArduinoJson
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, jsonBuffer);
    
    if (error) {
        Serial.print("[ERROR] JSON parse failed: ");
        Serial.println(error.f_str());
        return;
    }

    // 1. SERVO ANGLE CONTROL
    if (doc.containsKey("servoAngle")) {
        int angle = doc["servoAngle"];
        angle = constrain(angle, 0, 90);  // Safety: limit to 0-90
        
        if (angle != currentServoAngle) {
            currentServoAngle = angle;
            smartVent.write(angle);
            Serial.print("[ACTUATOR] Servo moved to ");
            Serial.print(angle);
            Serial.println("°");
        }
    }

    // 2. LED STATE CONTROL
    if (doc.containsKey("ledState")) {
        bool ledState = doc["ledState"];
        digitalWrite(PIN_LED, ledState ? HIGH : LOW);
        Serial.print("[ACTUATOR] LED set to ");
        Serial.println(ledState ? "ON" : "OFF");
    }

    // 3. CONFIDENCE SCORE - DISPLAY ON TM1637
    if (doc.containsKey("confidence")) {
        int confidence = doc["confidence"];
        currentDisplayValue = constrain(confidence, 0, 9999);
        displayConfidenceUntil = millis() + DISPLAY_HOLD_TIME;
        
        Serial.print("[DISPLAY] Showing confidence: ");
        Serial.println(confidence);
    }

    // 4. SECURITY LOCKDOWN ALERT
    if (doc.containsKey("lockdown")) {
        bool lockdown = doc["lockdown"];
        
        if (lockdown) {
            Serial.println("[SECURITY] LOCKDOWN ACTIVATED!");
            Serial2.println("SECURITY ALERT");
            Serial2.println("GLASS BREAK DETECTED");
            Serial2.println("EMERGENCY PROTOCOLS ACTIVE");
            
            // Visual alert: blink LED
            for (int i = 0; i < 5; i++) {
                digitalWrite(PIN_LED, HIGH);
                delay(200);
                digitalWrite(PIN_LED, LOW);
                delay(200);
            }
        }
    }
}

// ==========================================
// MQTT RECONNECTION HANDLER
// ==========================================

void reconnect() {
    while (!mqttClient.connected()) {
        Serial.print("[MQTT] Attempting connection... ");
        
        if (mqttClient.connect(MQTT_CLIENT_ID)) {
            Serial.println("CONNECTED");
            mqttClient.subscribe(TOPIC_COMMANDS);
            Serial.print("[MQTT] Subscribed to: ");
            Serial.println(TOPIC_COMMANDS);
        } else {
            Serial.print("FAILED (rc=");
            Serial.print(mqttClient.state());
            Serial.println(") - Retry in 5s");
            delay(5000);
        }
    }
}

// ==========================================
// HELPER FUNCTIONS
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
        Serial.print("[MQTT] Attempting connection...");
        if (mqttClient.connect(MQTT_CLIENT_ID)) {
            Serial.println("connected");
            mqttClient.subscribe(TOPIC_COMMANDS.c_str());
            Serial.println("[MQTT] Subscribed to: " + TOPIC_COMMANDS);
        } else {
    
void setup() {
    Serial.begin(115200);
    Serial2.begin(9600, SERIAL_8N1, 16, PIN_SERIAL2_TX);
    
    delay(2000);  // Allow serial to stabilize
    Serial.println("\n\n[STARTUP] HomeCanvas ESP32 Edge Node (Weighted Occupancy System)");
    Serial.println("[STARTUP] Role: Dumb Data Streamer + Physical Actuator");

    // Allocate timers for ESP32PWM
    ESP32PWM::allocateTimer(0);
    ESP32PWM::allocateTimer(1);
    ESP32PWM::allocateTimer(2);
    ESP32PWM::allocateTimer(3);
    
    // Pin Configuration
    pinMode(PIN_PIR, INPUT);  // PIR motion sensor
    pinMode(PIN_LDR, INPUT);  // LDR light sensor (analog)
    pinMode(PIN_SOUND, INPUT);  // Sound sensor (analog)
    pinMode(PIN_LED, OUTPUT);
    digitalWrite(PIN_LED, LOW);
    
    // ADC Attenuation (11dB = full 0-3.3V range)
    analogSetPinAttenuation(PIN_LDR, ADC_11db);
    analogSetPinAttenuation(PIN_SOUND, ADC_11db);
    
    // Servo Initialization
    smartVent.attach(PIN_SERVO, 1000, 2000);  // 1000-2000 μs for servo range
    smartVent.write(0);  // Start at 0°
    delay(1000);
    Serial.println("[HARDWARE] Servo initialized to 0°");
    
    // Display Initialization
    display.setBrightness(0x0f);  // Max brightness
    display.clear();
    Serial.println("[HARDWARE] TM1637 Display initialized");
    
    // WiFi Connection
    Serial.print("[WIFI] Connecting to ");
    Serial.println(WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int wifi_attempts = 0;
    while (WiFi.status() != WL_CONNECTED && wifi_attempts < 20) {
        delay(500);
        Serial.print(".");
        wifi_attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[WIFI] Connected!");
        Serial.print("[WIFI] IP: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\n[WIFI] Failed to connect - will retry");
    }

    // UDP Discovery for MQTT Broker
    Serial.println("[DISCOVERY] Searching for HomeCanvas MQTT Broker...");
    udp.begin(UDP_DISCOVERY_PORT);
    
    unsigned long discovery_start = millis();
    while (MQTT_BROKER == "" && millis() - discovery_start < 10000) {
        // Broadcast discovery request
        udp.beginPacket("255.255.255.255", UDP_DISCOVERY_PORT);
        udp.write((const uint8_t*)DISCOVERY_REQUEST, strlen(DISCOVERY_REQUEST));
        udp.endPacket();
        
        // Wait for response (500ms timeout)
        unsigned long startTime = millis();
        while (millis() - startTime < 500) {
            int packetSize = udp.parsePacket();
            if (packetSize) {
                char incomingPacket[256];
                int len = udp.read(incomingPacket, 255);
                if (len > 0) {
                    incomingPacket[len] = 0;
                }
                
                if (String(incomingPacket).equals(DISCOVERY_RESPONSE)) {
                    MQTT_BROKER = udp.remoteIP().toString();
                    Serial.print("[DISCOVERY] MQTT Broker found at: ");
                    Serial.println(MQTT_BROKER);
                    break;
                }
            }
            delay(10);
        }
    }
    udp.stop();
    
    // Fallback if discovery fails
    if (MQTT_BROKER == "") {
        MQTT_BROKER = "192.168.1.100";  // Adjust to your network
        Serial.print("[DISCOVERY] Using fallback MQTT broker: ");
        Serial.println(MQTT_BROKER);
    }

    // MQTT Setup
    mqttClient.setServer(MQTT_BROKER.c_str(), MQTT_PORT);
    mqttClient.setBufferSize(512);  // Increase for JSON payloads
    mqttClient.setCallback(mqttCallback);

    // NTP Time Sync
    configTime(0, 0, ntpServer);
    Serial.println("[NTP] Syncing time...");
    
    Serial.println("[STARTUP] Initialization complete. Waiting for commands...\n");
}

// ==========================================
// MAIN LOOP
// ==========================================

void loop() {
    // Ensure MQTT connection
    if (!mqttClient.connected()) {
        reconnect();
    }
    mqttClient.loop();

    // -------- SENSOR READING --------
    // Read and average samples to reduce noise
    long ldrSum = 0, soundSum = 0;
    for (int i = 0; i < 10; i++) {
        ldrSum += analogRead(PIN_LDR);
        soundSum += analogRead(PIN_SOUND);
        delayMicroseconds(100);
    }
    int lightLevel = ldrSum / 10;
    int soundLevel = soundSum / 10;
    
    // PIR with debouncing
    bool pirRaw = (digitalRead(PIN_PIR) == HIGH);
    if (pirRaw) {
        if (pirDebounceCount < 10) pirDebounceCount++;
    } else {
        pirDebounceCount = 0;
    }
    bool motionDetected = (pirDebounceCount >= PIR_DEBOUNCE_THRESHOLD);

    // -------- DISPLAY MANAGEMENT --------
    // Show confidence if backend recently sent it, otherwise show sound level
    if (millis() < displayConfidenceUntil) {
        display.showNumberDec(currentDisplayValue, false);
    } else {
        // Show sound level as diagnostic
        display.showNumberDec(soundLevel, false);
    }

    // -------- TELEMETRY PUBLISH (Every 1 second) --------
    if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL) {
        lastTelemetryTime = millis();
        
        // Build telemetry JSON
        StaticJsonDocument<256> telemetryDoc;
        telemetryDoc["pir"] = motionDetected;
        telemetryDoc["sound"] = soundLevel;
        telemetryDoc["light"] = lightLevel;
        telemetryDoc["timestamp"] = getISO8601Timestamp();
        
        // Serialize and publish
        char telemetryBuffer[256];
        serializeJson(telemetryDoc, telemetryBuffer);
        
        bool published = mqttClient.publish(TOPIC_TELEMETRY, telemetryBuffer, true);
        
        if (published) {
            Serial.println("[TELEMETRY] Published to " TOPIC_TELEMETRY);
        } else {
            Serial.println("[TELEMETRY] Publish failed!");
        }
        
        // Debug output
        Serial.print("  PIR=");
        Serial.print(motionDetected ? "1" : "0");
        Serial.print(" SOUND=");
        Serial.print(soundLevel);
        Serial.print(" LIGHT=");
        Serial.print(lightLevel);
        Serial.print(" SERVO=");
        Serial.print(currentServoAngle >= 0 ? currentServoAngle : 0);
        Serial.print("° LED=");
        Serial.println(digitalRead(PIN_LED) ? "ON" : "OFF");
    }
}
