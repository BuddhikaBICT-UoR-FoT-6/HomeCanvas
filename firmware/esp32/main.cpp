#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>

// ==========================================
// ⚠️ NETWORK CONFIGURATION ⚠️
// ==========================================
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
// Ensure your Spring Boot server is running on this IP!
const String backendUrl = "http://YOUR_LAPTOP_IP:8080/api/iot/telemetry"; 

// ==========================================
// PIN DEFINITIONS
// ==========================================
const int PIR_PIN = 13;
const int LEFT_SERVO_PIN = 14;
const int RIGHT_SERVO_PIN = 27;
const int STATUS_LED_PIN = 25; 
const int LDR_PIN = 32;
const int SOUND_PIN = 35;

// Create the Servo objects for the Split Damper
Servo leftVent;
Servo rightVent;

void setup() {
  Serial.begin(115200);
  
  // Start the secondary Serial port to talk to the Arduino Uno (TX is GPIO 17)
  Serial2.begin(9600, SERIAL_8N1, 16, 17); 

  // Setup Sensor Pins
  pinMode(PIR_PIN, INPUT);
  pinMode(SOUND_PIN, INPUT);
  
  // Activate the internal pull-up resistor for the LDR
  pinMode(LDR_PIN, INPUT_PULLUP); 
  
  // Setup the Output LED
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);
  
  // Attach the Servos and set initial closed position (Mirrored angles)
  leftVent.attach(LEFT_SERVO_PIN);
  rightVent.attach(RIGHT_SERVO_PIN);
  leftVent.write(0); 
  rightVent.write(180);

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected! My IP is: " + WiFi.localIP().toString());
  Serial.println("My MAC Address is: " + WiFi.macAddress()); 
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(backendUrl);
    http.addHeader("Content-Type", "application/json");

    // 1. Read the Sensors
    int lightLevel = analogRead(LDR_PIN);
    int noiseLevel = analogRead(SOUND_PIN);
    bool motionDetected = digitalRead(PIR_PIN) == HIGH;

    // 2. Build the JSON Payload (Matching your Spring Boot DTO)
    String payload = "{";
    payload += "\"macAddress\":\"" + WiFi.macAddress() + "\",";
    payload += "\"lightLevel\":" + String(lightLevel) + ",";
    payload += "\"noiseLevel\":" + String(noiseLevel) + ",";
    payload += "\"motionDetected\":" + String(motionDetected ? "true" : "false");
    payload += "}";

    // 3. Send to Spring Boot
    int httpResponseCode = http.POST(payload);

    // 4. Process the Backend's Response
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Backend says: " + response);

      // Parse the JSON string to execute hardware actions
      if (response.indexOf("\"fanOn\":true") > 0) {
        // Sweep both doors to 90 degrees (Straight open!)
        leftVent.write(90); 
        rightVent.write(90);
        digitalWrite(STATUS_LED_PIN, HIGH); // Turn on the indicator LED
        Serial.println("⚙️ VENT COMMAND: SPLIT DOORS OPEN");
      } else {
        // Sweep doors back to opposite closed positions
        leftVent.write(0);  
        rightVent.write(180);
        digitalWrite(STATUS_LED_PIN, LOW); // Turn off the indicator LED
      }

      // If there is an LCD message, shout it to the Arduino over the wire
      if (response.indexOf("\"lcdMessage\":\"") > 0) {
        Serial2.println("SECURITY ALERT!"); 
      }
      
    } else {
      Serial.println("Error hitting backend: " + String(httpResponseCode));
    }
    http.end();
  }

  // Wait 2 seconds before sending the next telemetry ping
  delay(2000);
}
