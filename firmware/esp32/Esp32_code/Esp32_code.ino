#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <TM1637Display.h>
#include <time.h>

// ==========================================
// NETWORK CONFIGURATION
// ==========================================
const char* ssid = "Buddhika";
const char* password = "Buddhika123#";
const String backendUrl = "http://192.168.0.101:8080/api/iot/telemetry"; 

// ==========================================
// NTP TIME CONFIGURATION
// ==========================================
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 5.5 * 3600;         // IST UTC+5:30
const int daylightOffset_sec = 0; 

// ==========================================
// PIN DEFINITIONS (Updated to your exact layout)
// ==========================================
const int PIR_PIN = 13;        // PIR Sensor
const int SERVO_PIN = 14;      // Smart Vent Servo (GPIO 14, not 27!)
const int STATUS_LED_PIN = 25; // Status LED
const int LDR_PIN = 32;        // LDR (wired to Ground, using internal pullup)
const int SOUND_PIN = 35;      // Sound Sensor

// 4-Digit Display Pins
const int CLK_PIN = 26;
const int DIO_PIN = 33;

// Sound Threshold (if noiseLevel > this, sound is "detected")
const int SOUND_THRESHOLD = 100;

// Create the Hardware Objects
Servo smartVent;
TM1637Display display(CLK_PIN, DIO_PIN);

void setup() {
  Serial.begin(115200);
  
  // Start the UART line to the Arduino Uno (TX is GPIO 17)
  Serial2.begin(9600, SERIAL_8N1, 16, 17); 

  // Setup Input Pins
  pinMode(PIR_PIN, INPUT);
  pinMode(SOUND_PIN, INPUT);
  
  // Activate internal pull-up resistor for the LDR since it's wired direct to negative
  pinMode(LDR_PIN, INPUT_PULLUP); 
  
  // Setup Output Pins
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);
  
  // Initialize Servo
  smartVent.attach(SERVO_PIN);
  smartVent.write(0); 

  // Initialize the Display (0x0f is maximum brightness)
  display.setBrightness(0x0f);
  display.clear();

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected! My IP is: " + WiFi.localIP().toString());
  
  // Synchronize time with NTP server
  Serial.print("Syncing time with NTP server...");
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  
  // Wait for time to be set
  time_t now = time(nullptr);
  int attempts = 0;
  while (now < 24 * 3600 && attempts < 20) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    attempts++;
  }
  Serial.println("\nTime synced!");
  Serial.println("System ready! Listening for telemetry...");
}

// ==========================================
// HELPER FUNCTION: Generate ISO 8601 Timestamp
// ==========================================
String getISO8601Timestamp() {
  time_t now = time(nullptr);
  struct tm* timeinfo = gmtime(&now);
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", timeinfo);
  return String(buffer);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(backendUrl);
    http.addHeader("Content-Type", "application/json");

    // 1. Read Sensors
    int lightLevel = analogRead(LDR_PIN);
    int noiseLevel = analogRead(SOUND_PIN);
    bool motionDetected = digitalRead(PIR_PIN) == HIGH;

    // 2. Update 4-Digit Display - Show noise level if sound detected, else 0000
    if (noiseLevel > SOUND_THRESHOLD) {
      display.showNumberDec(noiseLevel, false);  // Display actual noise level when sound detected
      Serial.print("🔊 SOUND DETECTED: ");
      Serial.println(noiseLevel);
    } else {
      display.showNumberDec(0, false);  // Display 0000 when silent
      Serial.print("🔇 Silent: ");
      Serial.println(noiseLevel);
    }

    // 3. Build JSON Payload
    String payload = "{";
    payload += "\"macAddress\":\"" + WiFi.macAddress() + "\",";
    payload += "\"timestamp\":\"" + getISO8601Timestamp() + "\",";
    payload += "\"lightLevel\":" + String(lightLevel) + ",";
    payload += "\"noiseLevel\":" + String(noiseLevel) + ",";
    payload += "\"motionDetected\":" + String(motionDetected ? "true" : "false");
    payload += "}";

    // 4. Send to Spring Boot Backend
    int httpResponseCode = http.POST(payload);

    // 5. Process Response
    if (httpResponseCode > 0) {
      String response = http.getString();
      
      // Hardware Action: Vent & LED
      if (response.indexOf("\"fanOn\":true") > 0) {
        smartVent.write(90); 
        digitalWrite(STATUS_LED_PIN, HIGH); 
      } else {
        smartVent.write(0);  
        digitalWrite(STATUS_LED_PIN, LOW); 
      }

      // Hardware Action: Alert Arduino Console
      if (response.indexOf("\"lcdMessage\":\"") > 0) {
        Serial2.println("ACOUSTIC ANOMALY DETECTED!"); 
      }
      
    }
    http.end();
  }
  
  delay(2000);
}
