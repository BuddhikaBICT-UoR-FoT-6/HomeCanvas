# HomeCanvas IoT Firmware

Complete firmware implementations for the dual-microcontroller failover architecture.

## Directory Structure

```
firmware/
├── esp32/                    # ESP32 Main Node (Primary Microcontroller)
│   └── main.cpp             # WiFi telemetry + servo/LED control
│
├── arduino-uno/             # Arduino Uno Alert Terminal (Failover Console)
│   └── alert-terminal.ino  # Serial listener + LED strobe alarming
│
└── README.md               # This file
```

## Quick Start

### 1. ESP32 Main Node Setup

**Requirements:**
- Arduino IDE with ESP32 boards installed
- Libraries: WiFi, HTTPClient, ESP32Servo
- USB-Micro cable for programming

**Steps:**
1. Open `firmware/esp32/main.cpp` in Arduino IDE
2. Update WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_NETWORK";
   const char* password = "YOUR_PASSWORD";
   const String backendUrl = "http://192.168.x.x:8080/api/iot/telemetry";
   ```
3. Verify board: Tools → Board → ESP32 Dev Module
4. Select COM port (CP210x if drivers installed)
5. Upload: Sketch → Upload

**Verification:**
- Open Serial Monitor (115200 baud)
- Look for WiFi connection messages
- Verify sensor readings appear every 2 seconds

### 2. Arduino Uno Alert Terminal Setup

**Requirements:**
- Arduino IDE (standard AVR)
- USB-Micro cable for programming
- **IMPORTANT:** GPIO 17 disconnected during upload (RX pin conflict)

**Steps:**
1. **DISCONNECT wire from Arduino Pin 0** ← Critical!
2. Open `firmware/arduino-uno/alert-terminal.ino` in Arduino IDE
3. Verify board: Tools → Board → Arduino Uno
4. Select COM port (different from ESP32)
5. Upload: Sketch → Upload
6. **RECONNECT wire to Arduino Pin 0** ← Critical!

**Verification:**
- Open Serial Monitor (9600 baud)
- Look for startup banner: "ENTERPRISE VENT NODE ONLINE"
- Trigger ESP32 alert (cover LDR sensor)
- Verify formatted alert appears + LED on Pin 13 flashes 5×

## Hardware Configuration Reference

### ESP32 Pin Mapping
```
GPIO 13  ← HC-SR501 PIR Motion Sensor (IN)
GPIO 14  ← Left Servo Control (PWM)
GPIO 17  → Arduino RX (TX2 serial out to Arduino Uno)
GPIO 25  ← Status LED (digital output)
GPIO 27  ← Right Servo Control (PWM)
GPIO 32  ← LDR Light Sensor (ADC input, with internal pull-up)
GPIO 35  ← KY-037 Sound Sensor (ADC input)
```

### Arduino Uno Pin Mapping
```
Pin 0    ← ESP32 GPIO 17 (RX serial in from ESP32)
Pin 13   ← Onboard LED (strobe alarm indicator)
USB      ← Connection to laptop Serial Monitor
```

### UART Serial Bridge (ESP32 ↔ Arduino)
```
ESP32 GPIO 17 (TX2) ──[wire]──→ Arduino Pin 0 (RX)
ESP32 GND           ──[wire]──→ Arduino GND (CRITICAL common ground)
Baud Rate: 9600
Data Format: Plain text + newline (e.g., "SECURITY ALERT!\n")
Direction: One-way (ESP32 → Arduino only)
```

## Communication Details

### Spring Boot Backend API

**Endpoint:** `http://YOUR_LAPTOP_IP:8080/api/iot/telemetry`

**Request (from ESP32):**
```json
{
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "lightLevel": 512,
  "noiseLevel": 234,
  "motionDetected": true
}
```

**Response (from Backend):**
```json
{
  "fanOn": true,
  "lcdMessage": "SECURITY_ALERT",
  "timestamp": 1713360000000
}
```

**Polling Interval:** 2 seconds (configurable in ESP32 `delay(2000)`)

### Serial Bridge Protocol

**Trigger:** When ESP32 detects `"lcdMessage"` in backend response

**Message Format:**
```
[plain text]\n
```

**Examples:**
```
SECURITY ALERT!
MOTION DETECTED!
NOISE THRESHOLD EXCEEDED!
```

**Arduino Processing:**
1. Reads line until newline character
2. Formats and prints to Serial Monitor
3. Flashes onboard LED 5 times rapidly (150ms on/off)

## Troubleshooting

### ESP32 Won't Upload
- **Issue:** COM port missing or device not recognized
- **Solution:** Install CP210x drivers from Silicon Labs: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
- Hold BOOT button while connecting USB
- Try different USB port/cable

### ESP32 Can't Connect to WiFi
- **Issue:** "Connecting to Wi-Fi..." loops forever
- **Solution:** 
  - Verify SSID/password correct (case-sensitive)
  - Ensure router broadcasting 2.4GHz (ESP32 doesn't support 5GHz only)
  - Check WiFi signal strength: should be -70 dBm or better
  - Try phone hotspot to isolate router issues

### Arduino Receives Garbled/No Data
- **Issue:** "Arduino never receives messages" or corrupted text
- **Solution:**
  - Verify GPIO 17 physically connected to Arduino Pin 0
  - Check GND continuity between ESP32 and Arduino
  - Verify both using 9600 baud (Serial2 on ESP32, Serial on Arduino)
  - Make sure wire isn't unplugged
  - Re-upload Arduino code if baud rate was wrong

### Arduino Code Won't Upload
- **Issue:** Compilation or upload errors
- **Solution:**
  - **DISCONNECT GPIO 17 from Arduino Pin 0** before upload
  - Verify in Device Manager Arduino shows as valid COM port
  - **RECONNECT GPIO 17 immediately after** upload completes
  - Check Arduino board selection: Tools → Board → Arduino Uno

### Servos Don't Move
- **Issue:** Servos unresponsive to fanOn commands
- **Solution:**
  - Verify 5V power connected to servo VCC (both left & right)
  - Check GPIO 14 (left) and GPIO 27 (right) connections
  - Test with continuous sweep code:
    ```cpp
    for(int i=0; i<=180; i++) { leftVent.write(i); delay(10); }
    ```
  - Listen for servo jitter/clicking (means power is connected)
  - Verify USB power supply provides ≥2A during servo movement

### LED Stays Off
- **Issue:** "LED stays dark" even when fanOn: true
- **Solution:**
  - Verify 330Ω resistor polarity (stripe on resistor = to ground)
  - Check GPIO 25 digitalWrite is HIGH (not inverted logic)
  - Test with multimeter: GPIO 25 should show 3.3V when active
  - Try reducing resistor to 220Ω (if still within GPIO 40mA limit)

### Sensor Readings Nonsensical
- **Issue:** LDR maxed, PIR always triggered, Sound frozen at 0
- **Solution:**
  - **LDR:** Verify `pinMode(LDR_PIN, INPUT_PULLUP)` in setup()
  - **PIR:** Wait 1-2 minutes after power-on for stabilization; reduce sensitivity
  - **Sound:** Adjust sensitivity potentiometer on KY-037 module (CCW = more sensitive)
  - All sensors: Add 100µF capacitor across power/GND for noise filtering

## Code Architecture

### ESP32 Main Loop Flow
```
1. Read all sensors (PIR, LDR, Sound)
2. Build JSON payload
3. POST to Spring Boot backend
4. Parse response JSON
5. If fanOn==true:
   - Set servos to 90° (open)
   - Set LED HIGH
6. If fanOn==false:
   - Set servos to closed (0°/180°)
   - Set LED LOW
7. If lcdMessage present:
   - Send alert to Arduino via Serial2
8. Wait 2 seconds, repeat
```

### Arduino Loop Flow
```
1. Check if data available on Serial (from ESP32)
2. If message received:
   - Print formatted alert header to Serial Monitor
   - Print message content
   - Activate LED strobe (5× flashes)
3. Return to listening (blocking on Serial.available())
```

## Performance Considerations

- **Polling Interval:** 2 seconds - adjust in ESP32 `delay(2000)`
- **WiFi Reconnection:** Auto-reconnect enabled (1-3 second recovery)
- **Servo Movement:** ~1 second per 90° sweep
- **Serial Bridge:** Asynchronous - non-blocking, fire-and-forget
- **Power Draw:** ~500mA peak (during servo sweep), ~100mA idle

## Security Notes

- ⚠️ WiFi credentials stored in plaintext - use on trusted networks only
- ⚠️ Backend IP hardcoded - change for different deployments
- ⚠️ UART serial is unencrypted - physical wiring only
- ⚠️ No authentication on API endpoints - assume local network only
- Consider adding HTTPS, API key tokens, and secure credential storage for production

## Future Enhancements

- [ ] Add SD card logging for sensor history
- [ ] Implement Over-The-Air (OTA) firmware updates
- [ ] Add DHT22 temperature/humidity sensor
- [ ] Integrate with Home Assistant or MQTT broker
- [ ] Implement local edge logic (no backend required fallback)
- [ ] Add battery backup with low-power sleep modes
- [ ] Encrypt WiFi credentials in EEPROM

## References

- **ESP32 Arduino Documentation:** https://docs.espressif.com/
- **Arduino Uno Reference:** https://www.arduino.cc/reference/en/
- **WiFi Library:** https://github.com/esp8266/Arduino/tree/master/libraries/ESP8266WiFi
- **Servo Library:** https://github.com/esp-rs/esp-idf-hal
- **HC-SR501 Datasheet:** PIR Motion Sensor specifications
- **SG90 Servo Datasheet:** Micro servo motor specifications

---

**Last Updated:** April 17, 2026  
**Firmware Version:** 2.0 (Dual-Microcontroller Failover)  
**Status:** Production Ready
