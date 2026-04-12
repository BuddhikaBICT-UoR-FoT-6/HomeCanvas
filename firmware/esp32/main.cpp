/**
 * @file main.cpp
 * @author Senior IoT Systems Engineer
 * @brief Production-ready ESP32 Edge-Computing Node for Smart Home Environment.
 * 
 * CORE ARCHITECTURE: 
 * This node implements "Local Reflexes" for zero-latency responses to environmental triggers
 * (Security lockdown, Daylight harvesting, HVAC control) while maintaining cloud telemetry
 * asynchronously every 2 seconds.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <TM1637Display.h>

// ============================================================================
// CONFIGURATION & HARDWARE MAPPING
// ============================================================================

// WiFi Configuration
const char* WIFI_SSID     = "Eternal Labyrinth"; // Updated from previous firmware
const char* WIFI_PASSWORD = "Eden123479";       // Updated from previous firmware

// Backend Configuration (Spring Boot)
const String BACKEND_URL = "http://10.92.209.240:8080/api/iot/telemetry";

// Pin Definitions
#define PIN_PIR        13    // Digital Input: Motion Sensor
#define PIN_LDR        32    // Analog Input: Photoresistor
#define PIN_SOUND      35    // Analog Input: KY-037 Sound Sensor
#define PIN_SERVO      27    // PWM Output: SG90 Servo
#define PIN_LED        25    // Digital Output: Status LED
#define PIN_TM_CLK     26    // TM1637 CLK
#define PIN_TM_DIO     33    // TM1637 DIO
#define PIN_SERIAL2_TX 17    // UART2 TX: Failover Console

// Thresholds & Constants
const int LDR_DARK_THRESHOLD   = 2000;
const int SOUND_ALARM_THRESHOLD = 3000;
const unsigned long TELEMETRY_INTERVAL = 2000; // 2 seconds in milliseconds

// ============================================================================
// GLOBAL OBJECTS
// ============================================================================

Servo smartVent;
TM1637Display display(PIN_TM_CLK, PIN_TM_DIO);
unsigned long lastTelemetryTime = 0;

// ============================================================================
// SYSTEM INITIALIZATION
// ============================================================================

void connectWiFi() {
    Serial.print("[WIFI] Connecting to ");
    Serial.println(WIFI_SSID);
    
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[WIFI] Connected Successfully.");
        Serial.print("[WIFI] IP Address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\n[WIFI] Connection Failed. Operating in Offline Reflex Mode.");
    }
}

void setup() {
    // 1. Initialize Serial Interfaces
    Serial.begin(115200);                    // Debug Console
    Serial2.begin(9600, SERIAL_8N1, 16, PIN_SERIAL2_TX); // Failover Console (RX=16, TX=17)
    
    delay(500);
    Serial.println("\n\n--- ESP32 SMART HOME EDGE NODE STARTING ---");

    // 2. Configure Pin Modes
    pinMode(PIN_PIR, INPUT);
    pinMode(PIN_LDR, INPUT);
    pinMode(PIN_SOUND, INPUT);
    pinMode(PIN_LED, OUTPUT);
    
    // 3. Initialize Actuators
    smartVent.attach(PIN_SERVO);
    smartVent.write(0); // Default to Closed
    
    display.setBrightness(0x0f); // Maximum brightness
    display.clear();
    
    // 4. Start Network
    connectWiFi();
    
    Serial.println("[SYSTEM] Setup Complete. Entering Loop.");
}

// ============================================================================
// MAIN EXECUTION LOOP (REFLEXES & TELEMETRY)
// ============================================================================

void loop() {
    // --- 1. LOCAL SENSOR READINGS ---
    int lightLevel     = analogRead(PIN_LDR);
    int noiseLevel     = analogRead(PIN_SOUND);
    bool motionDetected = (digitalRead(PIN_PIR) == HIGH);

    // --- 2. LOCAL REFLEXES (ZERO LATENCY) ---

    // A. Daylight Harvesting (Lighting)
    // If dark, turn on light; if bright, turn it off.
    if (lightLevel < LDR_DARK_THRESHOLD) {
        digitalWrite(PIN_LED, HIGH);
    } else {
        digitalWrite(PIN_LED, LOW);
    }

    // B. Acoustic Dashboard
    // Constantly display raw noise value on 4-digit display.
    display.showNumberDec(noiseLevel);

    // C. Smart HVAC with Security Override (Hierarchy)
    // Priority 1: Security Lockdown (Loud noise / Possible breach)
    if (noiseLevel > SOUND_ALARM_THRESHOLD) {
        smartVent.write(0); // Snap to Closed
        Serial2.println("SECURITY LOCKDOWN: WINDOW BREACH!");
        Serial.println("[SECURITY] Alarm Triggered! Lockdown Engaged.");
    } 
    // Priority 2: Occupancy (Motion detected)
    else if (motionDetected) {
        smartVent.write(45); // Half-open for ventilation
        Serial.println("[HVAC] Motion Detected. Vent: 45°");
    } 
    // Priority 3: Empty Room / Energy Save
    else {
        smartVent.write(0); // Closed
    }

    // --- 3. ASYNCHRONOUS CLOUD TELEMETRY ---
    unsigned long currentMillis = millis();
    if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL) {
        lastTelemetryTime = currentMillis;
        
        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(BACKEND_URL);
            http.addHeader("Content-Type", "application/json");

            // Construct JSON Payload
            String payload = "{";
            payload += "\"lightLevel\":" + String(lightLevel) + ",";
            payload += "\"noiseLevel\":" + String(noiseLevel) + ",";
            payload += "\"motionDetected\":" + String(motionDetected ? "true" : "false");
            payload += "}";

            int httpResponseCode = http.POST(payload);
            
            if (httpResponseCode > 0) {
                Serial.print("[CLOUD] Telemetry Sent. Response: ");
                Serial.println(httpResponseCode);
            } else {
                Serial.print("[CLOUD] Error sending telemetry: ");
                Serial.println(httpResponseCode);
            }
            http.end();
        } else {
            Serial.println("[CLOUD] WiFi Disconnected. Skipping telemetry.");
        }
    }

    // Minimal delay to prevent WDT issues while keeping loop responsive
    delay(10); 
}
