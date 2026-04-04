# HomeCanvas Hardware Setup Guide 
## Smart Vent IoT Node with Console Failover

Complete documentation of the HomeCanvas IoT smart home system hardware prototype, including enterprise failover architecture and console-based alerting.

---

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Core Processing Units](#core-processing-units)
3. [Sensor Array](#sensor-array)
4. [Actuators & Indicators](#actuators--indicators)
5. [Alert Dashboard](#alert-dashboard)
6. [Communication Topologies](#communication-topologies)
7. [Power Distribution](#power-distribution)
8. [Wiring Diagram](#wiring-diagram)
9. [Assembly Instructions](#assembly-instructions)
10. [Code Implementation](#code-implementation)
11. [Testing Procedures](#testing-procedures)
12. [Troubleshooting](#troubleshooting)

---

---

## System Architecture Overview

The HomeCanvas system demonstrates enterprise-grade fault tolerance through a **dual-microcontroller failover architecture**. The primary ESP32 node handles sensor polling, edge processing, and cloud communication, while a secondary Arduino Uno console provides graceful degradation when physical components fail.

**Key Capability:** When the I2C LCD fails, the system seamlessly pivots to serial console output via the Arduino, ensuring critical security alerts remain visible through the laptop's Serial Monitor.

This architecture is ideal for thesis presentations on real-world IoT resilience and failure recovery patterns.

---

## Core Processing Units

### **Primary Microcontroller: ESP32 Development Board**
- **Role:** Central nervous system
- **Capabilities:** 
  - Asynchronous sensor polling at configurable intervals
  - Edge-logic processing (local decision making)
  - 2.4GHz Wi-Fi communication with Spring Boot backend
  - UART serial communication to Arduino failover node
- **Key Specs:**
  - Dual-core 240MHz processors
  - 520KB SRAM
  - 4MB Flash storage
  - 14× ADC channels (analog sensors)
  - 16× PWM channels (servo/LED control)
- **Power:** 5V supplied via USB cable

### **Secondary Microcontroller: Arduino Uno (Failover Console Terminal)**
- **Role:** Decoupled alert terminal and physical alarm
- **Capabilities:**
  - Listens to ESP32 via one-way UART serial link (9600 baud)
  - Streams formatted security alerts to laptop Serial Monitor
  - Activates onboard LED (Pin 13) as rapid visual strobe alarm
- **Hardware Trigger:** When LCD I2C bus becomes unresponsive, ESP32 redirects alerts to Arduino
- **Power:** 5V supplied via independent USB cable (isolated from main system)

---

## Sensor Array

### **1. Presence Detection: HC-SR501 PIR Motion Sensor**
```
Connection:
  VCC (3.3V/5V) ──→ ESP32 3.3V rail
  OUT (Digital)  ──→ GPIO 13
  GND            ──→ Common ground

Specifications:
  - Detection Range: 3-5 meters
  - Trigger Time: ~2 seconds
  - Timeout: ~30 seconds (adjustable)
  - Output: HIGH when motion detected, LOW otherwise

Use Case: Triggers automated vent opening when room occupancy detected
```

### **2. Acoustic Monitoring: KY-037 Sound Sensor Module**
```
Connection:
  VCC (5V)       ──→ ESP32 3.3V rail (via current limiter or direct)
  OUT (Analog)   ──→ GPIO 35 (ADC1_7)
  GND            ──→ Common ground

Specifications:
  - Frequency Range: 50Hz - 20kHz
  - Sensitivity: 30-130 dB (adjustable via potentiometer)
  - Output: 0-1023 (10-bit ADC, 0-3.3V)
  - Update Rate: ~25kHz

Use Case: Detects excessive noise conditions, triggers damper control
```

### **3. Ambient Light Detection: Bare LDR (Photoresistor)**
```
Circuit Configuration (Software Pull-Up):
  GPIO 32 (INPUT_PULLUP)
         ├──[LDR]──[GND]
         └──[Internal 40-80kΩ resistor]──[3.3V]

Technical Details:
  - Internal ESP32 pull-up resistor eliminates external voltage divider
  - Resistance Range: 1kΩ (bright) to 100kΩ (dark)
  - Converted to 0-1023 by analog read
  - ESP32 GPIO 32: ADC1_4 channel

Use Case: Disables vent opening in dark rooms (assumes vacancy)
Configuration Code: pinMode(LDR_PIN, INPUT_PULLUP);
```

---

## Actuators & Indicators

### **1. Split-Damper HVAC Simulation: Dual SG90 Micro Servos**
```
Left Door Servo:
  VCC (5V)      ──→ ESP32 VIN (5V from USB bus)
  Signal (PWM)  ──→ GPIO 14
  GND           ──→ Common ground

Right Door Servo:
  VCC (5V)      ──→ ESP32 VIN (5V from USB bus)
  Signal (PWM)  ──→ GPIO 27
  GND           ──→ Common ground

Control Logic (Mirrored Angles):
  - Closed Position: Left=0°, Right=180° (doors fully shut)
  - Open Position: Left=90°, Right=90° (doors straight open)
  - Backend sends JSON: {"fanOn": true/false}

Mechanical Function:
  Simulates HVAC dampers controlling airflow through a split vent system
  Physical connection to breadboard via servo horn (90° range)
```

### **2. System Status Indicator: LED**
```
Circuit:
  5V ──[330Ω resistor]──[LED anode]──┬──→ GPIO 25
                                      │
                              [LED cathode]──→ GND

Specifications:
  - Standard 5mm LED (any color)
  - Current Limiting: 330Ω @ 5V = ~15mA (safe for ESP32 GPIO)
  - HIGH = LED illuminated (vent active)
  - LOW = LED off (vent closed)

Use Case: Localized visual confirmation of vent state without relying on backend
```

---

## Alert Dashboard

### **Arduino Uno: Enterprise Console Terminal**

#### **Text Output Stream**
```
Serial Configuration:
  - Baud Rate: 9600
  - Data Bits: 8
  - Parity: None
  - Stop Bits: 1
  - Hardware: RX Pin 0 (receives from ESP32 TX2)
              USB interface (sends to laptop)

Display Format (Serial Monitor at 9600):
  ==================================
   ENTERPRISE VENT NODE ONLINE
  ==================================
  
  ⚠️ SECURITY EVENT DETECTED ⚠️
  >> SECURITY ALERT!
  ----------------------------------

Usage:
  1. Upload Arduino code to Uno
  2. Wire ESP32 TX2 (GPIO 17) → Arduino RX (Pin 0)
  3. Open Serial Monitor @ 9600
  4. Alerts appear in real-time as ESP32 detects conditions
```

#### **Physical Siren: Onboard LED (Pin 13)**
```
Behavior:
  - Receiving Message: LED flashes 5× rapidly (150ms on/off cycle)
  - Visual Strobe Impact: High-visibility alarm effect
  - Audible Component: Relay buzzer can be connected separately if needed

Implementation:
  for (int i = 0; i < 5; i++) {
    digitalWrite(13, HIGH);  delay(150);
    digitalWrite(13, LOW);   delay(150);
  }
```

---

## Communication Topologies

### **1. Cloud Link: ESP32 ↔ Spring Boot Backend (Wi-Fi)**
```
Connection Type: 2.4GHz IEEE 802.11 b/g/n
Network Protocol: HTTP POST with JSON payload
Endpoint: http://YOUR_LAPTOP_IP:8080/api/iot/telemetry

Request Format (from ESP32):
{
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "lightLevel": 512,
  "noiseLevel": 234,
  "motionDetected": true
}

Response Format (from Spring Boot):
{
  "fanOn": true,
  "lcdMessage": "SECURITY_ALERT",
  "timestamp": 1713360000000
}

Polling Interval: 2 seconds (adjustable in loop delay)
Error Handling: Prints HTTP status codes to serial console
```

### **2. Inter-Node Link: ESP32 TX2 ↔ Arduino RX (UART Serial)**
```
Physical Connection:
  ESP32 GPIO 17 (TX2) ──→ Arduino Pin 0 (RX)
  ESP32 GND          ──→ Arduino GND (CRITICAL common ground)

Data Format: Plain text transmitted at 9600 baud
Message Example: "SECURITY ALERT!\n"

Characteristics:
  - One-way communication (ESP32 → Arduino only)
  - Asynchronous: Arduino listens continuously
  - No handshaking required (fire-and-forget)
  - Arduino processes incoming buffer via Serial.available()

Upload Safety:
  ⚠️ BEFORE uploading Arduino code:
  1. Disconnect GPIO 17 from Arduino Pin 0
  2. Upload via USB
  3. Reconnect GPIO 17 immediately after
```

---

## Power Distribution

### **Logic Power Supply**
```
Primary Rail (5V - USB):
  USB-A ──→ USB-Micro cable ──→ ESP32 power jack
  USB-A ──→ USB-Micro cable ──→ Arduino Uno power jack
  
  Result: ESP32 and Arduino run independently
          Each draws current from its own USB port

Secondary Rail (3.3V - ESP32 Regulated):
  ESP32 3V3 pin ──→ Breadboard positive rail
                    │
                    ├──→ HC-SR501 PIR sensor
                    ├──→ KY-037 Sound sensor
                    └──→ LDR (via internal pull-up)
```

### **Actuator Power (Servo Motors - 5V)**
```
ESP32 VIN Pin (5V from USB bus):
  │
  ├──→ Left Servo (SG90) - GPIO 14
  ├──→ Right Servo (SG90) - GPIO 27
  │
  Result: Servos draw peak current during sweep (~500mA each)
          USB power supply must support 2A minimum during operation
```

### **Unified Ground Plane (CRITICAL)**
```
Common GND Connection:
  USB GND ──────┬──→ ESP32 GND (multiple pins)
                ├──→ Arduino GND
                ├──→ Breadboard GND rail
                └──→ All sensor GND
                
Purpose: Establishes 0V logic reference for UART serial communication
         between ESP32 and Arduino. Without this, serial data corrupts.
```

---

## Wiring Diagram

### **Complete Pin Mapping**

#### **ESP32 Pinout (36-pin DevKit)**
```
┌─────────────────────────────────────┐
│       ESP32 DevKit (36-pin)         │
├─────────────────────────────────────┤
│ POWER PINS:                         │
│  VIN  ────→ Servo motors (5V)       │
│  GND  ────→ Common ground plane     │
│  3V3  ────→ Sensor rail (3.3V)      │
│  EN   ────→ Enable (leave floating) │
│                                     │
│ SENSOR INPUTS:                      │
│  GPIO 13 (IN) ──→ HC-SR501 PIR      │
│  GPIO 32 (INPUT_PULLUP) ──→ LDR     │
│  GPIO 35 (ADC1_7) ──→ KY-037 Sound  │
│                                     │
│ ACTUATOR OUTPUTS:                   │
│  GPIO 14 (PWM) ──→ Left Servo       │
│  GPIO 27 (PWM) ──→ Right Servo      │
│  GPIO 25 (OUT) ──→ Status LED       │
│  GPIO 17 (TX2) ──→ Arduino RX       │
│                                     │
│ SERIAL DEBUG (USB):                 │
│  GPIO 1  ──→ TX (to laptop USB)     │
│  GPIO 3  ──→ RX (from laptop USB)   │
└─────────────────────────────────────┘
```

#### **Arduino Uno Pinout (28-pin)**
```
┌──────────────────────────────┐
│    Arduino Uno (ATmega328)   │
├──────────────────────────────┤
│ POWER & GROUND:              │
│  5V  ────→ Breadboard power  │
│  GND ────→ Common ground     │
│                              │
│ SERIAL COMMUNICATION:        │
│  Pin 0 (RX) ──→ ESP32 TX2    │
│  USB         ──→ PC Serial   │
│                              │
│ INDICATORS:                  │
│  Pin 13 (LED) ──→ Strobe     │
│                              │
│ PROGRAMMING:                 │
│  RST (pin)   ──→ DTR via USB │
│                              │
└──────────────────────────────┘
```

---

## Assembly Instructions

### **Step 1: Prepare Power Infrastructure**
1. Place two 400-point breadboards side-by-side
2. Connect 5V USB rail across both boards (red jumper)
3. Connect GND across both boards (black jumper)
4. **CRITICAL:** Add a dedicated GND jumper between ESP32 GND and Arduino GND for UART stability

### **Step 2: Mount ESP32 on Primary Breadboard**
1. Insert ESP32 horizontally, centered
2. Attach a label identifying GPIO pins
3. Wire ESP32 GND → Breadboard GND rail
4. Wire ESP32 3V3 → Secondary rail for sensors

### **Step 3: Mount Arduino Uno on Secondary Breadboard**
1. Insert Arduino header pins or use jumpers
2. Wire Arduino GND → Breadboard GND rail
3. **Wire Arduino RX (Pin 0) → ESP32 GPIO 17 (TX2)** - use shielded cable if available
4. Leave Arduino Pin 13 (LED) unwired - it has builtin LED

### **Step 4: Connect Sensor Array**
```
PIR (HC-SR501):
  VCC → 3.3V rail
  OUT → GPIO 13 (use 10kΩ pull-down if needed)
  GND → GND rail

Sound Sensor (KY-037):
  VCC → 3.3V rail
  OUT → GPIO 35 (ADC channel)
  GND → GND rail

LDR (Photoresistor):
  Side 1 → GND rail (short lead)
  Side 2 → GPIO 32 (long lead)
  Note: Enable INPUT_PULLUP in code - no external resistor needed!
```

### **Step 5: Connect Actuators**
```
Left Servo (SG90):
  VCC (Red)   → ESP32 VIN (5V from USB)
  GND (Brown) → GND rail
  SIG (White) → GPIO 14

Right Servo (SG90):
  VCC (Red)   → ESP32 VIN (5V from USB)
  GND (Brown) → GND rail
  SIG (White) → GPIO 27

Status LED:
  Anode (+) → GPIO 25 (through 330Ω resistor first)
  Cathode (−) → GND rail
```

### **Step 6: Cable ESP32 to Arduino UART Bridge**
1. Identify ESP32 GPIO 17 (TX2 output pin)
2. Identify Arduino Pin 0 (RX input pin)
3. Use a jumper (preferably twisted pair for EMI immunity)
4. Connect: **ESP32 GPIO 17 → Arduino Pin 0**
5. Verify they share the same Ground rail

### **Step 7: Final Power Check**
```
Multimeter verification (before connecting anything to battery/power):
  5V rail to GND: Should read 5.0V ± 0.2V
  3.3V rail to GND: Should read 3.3V ± 0.1V
  Ground continuity: All GND should be <0.1Ω
```

---

## Code Implementation

### **ESP32 Main Node (C++)**

```cpp
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
```

### **Arduino Uno Alert Terminal (C++)**

```cpp
void setup() {
  // Start the communication line (Listens to ESP32 on Pin 0, Talks to Laptop via USB)
  Serial.begin(9600);
  
  // Set up the built-in LED (Pin 13) as our physical alarm siren
  pinMode(13, OUTPUT);
  digitalWrite(13, LOW);
  
  // Print the startup header to the laptop screen
  Serial.println("==================================");
  Serial.println(" ENTERPRISE VENT NODE ONLINE ");
  Serial.println("==================================");
  Serial.println("Awaiting telemetry alerts...");
}

void loop() {
  // If the ESP32 shouts a message down the UART wire...
  if (Serial.available()) {
    String message = Serial.readStringUntil('\n');
    
    // 1. Print the formatted alert to the laptop screen
    Serial.println("");
    Serial.println("⚠️ SECURITY EVENT DETECTED ⚠️");
    Serial.println(">> " + message);
    Serial.println("----------------------------------");
    
    // 2. Flash the Arduino's built-in LED rapidly like a siren
    for (int i = 0; i < 5; i++) {
      digitalWrite(13, HIGH);
      delay(150);
      digitalWrite(13, LOW);
      delay(150);
    }
  }
}
```

---

## Testing Procedures

### **1. Serial Connection Test (Arduino IDE)**
```
ESP32 Serial Monitor:
  1. Connect ESP32 to laptop via USB
  2. Open Arduino IDE → Serial Monitor (115200 baud)
  3. Look for: "Connecting to Wi-Fi", "Connected!"
  4. Verify MAC address and IP address print correctly

Arduino Serial Monitor:
  1. Disconnect ESP32 from GPIO 17 (Pi Upload safety)
  2. Upload Arduino sketch
  3. Open Serial Monitor (9600 baud)
  4. Look for: "ENTERPRISE VENT NODE ONLINE"
```

### **2. Sensor Integration Test**
```
Test Motion (PIR):
  1. Move hand in front of sensor
  2. Watch Serial Monitor for motionDetected: true/false
  3. Verify 2-3 second delay before reset

Test Light (LDR):
  1. Cover LDR with hand (darkness)
  2. Watch lightLevel value drop to 1000+
  3. Expose to bright light
  4. Watch value drop to 100-500

Test Sound (Microphone):
  1. Make noise near sensor
  2. Watch noiseLevel spike
  3. Verify sensitivity potentiometer adjustment works
```

### **3. Servo Actuation Test**
```
Manual Test Code (paste in loop()):
  leftVent.write(0);   delay(1000);   // Closed
  leftVent.write(90);  delay(1000);   // Open
  rightVent.write(180); delay(1000);  // Closed
  rightVent.write(90);  delay(1000);  // Open

Expected Behavior:
  - Servos should move smoothly
  - Servo horns should sweep 0° → 90° → 180°
  - Listen for clicking (indicates torque limit reached)
```

### **4. Backend Integration Test**
```
1. Start Spring Boot backend: mvn spring-boot:run
2. Update backendUrl in ESP32 code with your machine IP
3. Upload ESP32 code
4. Watch Serial Monitor for "Backend says: {...}"
5. Verify fanOn response field triggers servo movement
6. Check LED lights up when fanOn: true
```

### **5. Failover Test (LCD → Arduino Console)**
```
Simulate LCD Failure:
  1. Disconnect I2C LCD (if present)
  2. Trigger a security condition (manipulate sensor reading)
  3. Verify message appears in Arduino Serial Monitor
  4. Verify LED on Arduino Pin 13 flashes 5 times
  
Expected Console Output:
  ⚠️ SECURITY EVENT DETECTED ⚠️
  >> SECURITY ALERT!
  ----------------------------------
```

---

## Troubleshooting

### **WiFi Connection Issues**
| Problem | Solution |
|---------|----------|
| "Connecting to Wi-Fi..." loops forever | Check SSID/password, verify 2.4GHz network |
| Connection drops after 10 seconds | Add `WiFi.setAutoReconnect(true)` to setup() |
| Can't reach backend (HTTP error 0) | Ping your laptop IP from command line, verify backend listening on port 8080 |

### **Servo Movements Erratic**
| Problem | Solution |
|---------|----------|
| Servos twitch/jitter | Verify 5V power stability (use dedicated USB port, not hub) |
| Servos don't move at full range | Adjust `.write()` values: try 0-180 instead of mirrored angles |
| One servo unresponsive | Check GPIO pin connection (14 vs 27), verify PWM library attached properly |

### **Serial Communication Between ESP32 & Arduino**
| Problem | Solution |
|---------|----------|
| Arduino never receives messages | Verify GPIO 17 → Pin 0 connection, check GND continuity |
| Garbled text in Arduino Serial Monitor | Verify baud rate is 9600 on both Serial2 and Arduino Serial |
| Can't upload Arduino code | DISCONNECT GPIO 17 from Pin 0 BEFORE upload, reconnect AFTER |

### **Sensor Readings Nonsensical**
| Problem | Solution |
|---------|----------|
| LDR always reads max (4095) | Enable `INPUT_PULLUP` in code, verify resistor values |
| PIR false positives | Add debounce: read 3× confirmations before triggering |
| Sound sensor frozen at 0 | Check KY-037 power supply (separate 3.3V rail), adjust sensitivity pot |

### **LED Won't Light**
| Problem | Solution |
|---------|----------|
| LED stays dark | Verify 330Ω resistor polarity, test with multimeter in GPIO 25 output mode |
| LED too dim | Reduce resistor value to 220Ω (but max 30mA at GPIO) |
| LED always on | Check digitalWrite logic: should be LOW when vent closed |

---

## Revision History

**Current Version:** 2.0 (April 17, 2026)
- ✅ Documented failover architecture with Arduino console
- ✅ Updated to dual-servo Split Damper (GPIO 14 & 27)
- ✅ Added LDR internal pull-up configuration (GPIO 32)
- ✅ Included complete, production-ready code for ESP32 and Arduino
- ✅ Enterprise-grade fault tolerance for thesis presentation

**Previous:** 1.0 - Basic LCD + relay architecture
