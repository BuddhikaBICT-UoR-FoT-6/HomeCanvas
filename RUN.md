# HomeCanvas IoT Smart Home System - Complete Run Guide

Full end-to-end instructions for running the HomeCanvas hardware, backend, and frontend with real sensor data flowing through the React dashboard.

---

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Prerequisites](#prerequisites)
3. [Hardware Setup](#hardware-setup)
4. [Database Setup](#database-setup)
5. [Backend Startup](#backend-startup)
6. [Frontend Startup](#frontend-startup)
7. [Data Flow Walkthrough](#data-flow-walkthrough)
8. [How to Use the React Dashboard](#how-to-use-the-react-dashboard)
9. [Complete Testing Workflow](#complete-testing-workflow)
10. [Troubleshooting](#troubleshooting)

---

## Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         REACT FRONTEND                       │
│     (localhost:5173 - Vite development server)              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Login/Register → Device Dashboard → Device Detail  │   │
│  │  (shows live sensor data + controls servo)          │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬────────────────────────────────┘
                           │ 
                   HTTP REST API (axios)
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
┌───────▼────────────────────┐    ┌──────────▼─────────────┐
│   SPRING BOOT BACKEND       │    │   DATABASE (H2/MySQL)  │
│  (localhost:8080)           │    │  (Embedded or network) │
│                             │    │                        │
│  ┌─────────────────────┐   │    │  ┌──────────────────┐  │
│  │ /api/auth/login     │   │    │  │ Users            │  │
│  │ /api/auth/register  │   │    │  │ Devices          │  │
│  │ /api/iot/telemetry  │   │    │  │ SensorEvents     │  │
│  │ /api/devices        │   │    │  │ ActionLogs       │  │
│  └─────────────────────┘   │    │  └──────────────────┘  │
└───────┬────────────────────┘    └──────────────────────┘
        │
        │ UART Serial (9600 baud)
        │
   ┌────▼─────────────────────────────────────────┐
   │         HARDWARE LAYER                        │
   │  ┌──────────────────┐   ┌─────────────────┐  │
   │  │  ESP32 (Main)    │   │ Arduino Uno     │  │
   │  │  • WiFi telemetry│   │ • Serial console│  │
   │  │  • Servo control │   │ • LED strobe    │  │
   │  │  • Sensor polling│   │ • Alert display │  │
   │  │                  │   │                 │  │
   │  │ Sensors:         │   │ (Failover)      │  │
   │  │ • PIR (GPIO 13)  │   │                 │  │
   │  │ • Sound (GPIO 35)│   │                 │  │
   │  │ • LDR (GPIO 32)  │   │                 │  │
   │  │ • Servo (14, 27) │   │                 │  │
   │  │ • LED (GPIO 25)  │   │                 │  │
   │  └──────────────────┘   └─────────────────┘  │
   └─────────────────────────────────────────────┘
```

---

## Prerequisites

### Software Requirements
- **Java 11+** (for Spring Boot backend)
- **Node.js 18+** (for React frontend)
- **npm** (comes with Node.js)
- **Maven 3.8+** (for building Spring Boot)
- **Git** (for version control)
- **Arduino IDE** (for uploading firmware to ESP32/Arduino)

### Hardware Requirements (Your Current Setup)
- **ESP32 Development Board** (with WiFi & USB cable)
- **Arduino Uno** (with USB cable)
- **Sensors Connected to ESP32:**
  - HC-SR501 PIR Motion Sensor → GPIO 13
  - KY-037 Sound Sensor → GPIO 35 (ADC)
  - LDR Photoresistor → GPIO 32 (with INPUT_PULLUP)
- **Actuators Connected to ESP32:**
  - Left Servo (SG90) → GPIO 14 (PWM)
  - Right Servo (SG90) → GPIO 27 (PWM)
  - Status LED → GPIO 25 (with 330Ω resistor)
- **Arduino Uno (No sensors):**
  - RX Pin 0 ← ESP32 GPIO 17 (UART serial bridge)
  - On-board LED Pin 13 (strobe alarm)

### Network Requirements
- WiFi network accessible to both your laptop and ESP32
- 2.4GHz band (ESP32 doesn't support 5GHz only)
- Typical bandwidth: <1 Mbps (very minimal usage)

---

## Hardware Setup

### Quick Reference: Your Wiring

```
ESP32 WIRING (Main Node)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5V/GND ─ USB Power (2A minimum)
3.3V   ─ Sensor Rail (pull-up resistor power)

SENSORS:
GPIO 13 ← HC-SR501 PIR (from pin OUT)
GPIO 35 ← KY-037 Sound (to ADC from pin OUT)
GPIO 32 ← LDR photoresistor (via INPUT_PULLUP)

ACTUATORS:
GPIO 14 ← Left Servo (PWM signal)
GPIO 27 ← Right Servo (PWM signal)
GPIO 25 ← Status LED (via 330Ω resistor to GND)
GPIO 17 → Arduino Uno Pin 0 (RX) [UART TX2]

ARDUINO UNO WIRING (Failover Console)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5V/GND ─ USB Power (separate from ESP32)

SERIAL BRIDGE:
Pin 0 (RX) ← ESP32 GPIO 17 (TX2)
GND        ← ESP32 GND [CRITICAL COMMON GROUND]

INDICATORS:
Pin 13 (LED) ─ Onboard LED (built-in, no external wiring needed)
USB ──────── to laptop Serial Monitor (9600 baud)
```

### Verification Checklist
```bash
# Check all connections are secure
☐ ESP32 USB cable connected
☐ Arduino USB cable connected (separate from ESP32)
☐ Sensor power (VCC) connected to 3.3V rail
☐ Sensor ground connected to ESP32 GND
☐ Servo power (VCC) connected to ESP32 VIN (5V)
☐ Servo signal wires to GPIO 14 and 27
☐ UART bridge wire: GPIO 17 → Arduino Pin 0
☐ GND continuity between ESP32 and Arduino (multimeter test)

# Power on test
☐ Arduino Pin 13 LED lights up briefly
☐ Status LED (GPIO 25) lights up briefly  
☐ Servos twitch to neutral position
☐ No smoke or burning smell
```

---

## Database Setup

### Option A: H2 Embedded Database (Default - No Configuration Needed)
The Spring Boot backend comes pre-configured to use H2 in-memory database. This is perfect for development/testing.

**File:** `backend/src/main/resources/application.properties`

Already includes:
```properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.h2.console.enabled=true
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
```

**No additional setup required** - the database auto-initializes on startup.

### Option B: MySQL (For Production)
If you want persistent data storage:

```bash
# 1. Install MySQL (if not already installed)
# Windows: Download from https://dev.mysql.com/downloads/mysql/
# Or use: choco install mysql

# 2. Create database
mysql -u root -p
CREATE DATABASE homecanvas;
exit;

# 3. Update application.properties
# backend/src/main/resources/application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/homecanvas
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

**For this guide, we'll use H2 (Option A)** - no setup needed.

---

## Backend Startup

### Step 1: Navigate to Backend Directory
```bash
cd e:\Projects\HomeCanvas\backend
```

### Step 2: Update ESP32 Configuration
Edit `backend/src/main/resources/application.properties` to configure your WiFi:

```properties
# Optional: Configure ESP32 WiFi & Backend IP
# Add these custom properties (Spring Boot will pass them via REST)
esp32.wifi.ssid=YOUR_WIFI_NETWORK
esp32.wifi.password=YOUR_WIFI_PASSWORD
esp32.backend.ip=192.168.X.X  # Your laptop's IP address (find with: ipconfig)
esp32.backend.port=8080
```

### Step 3: Build and Run Spring Boot
```bash
# Method 1: Using Maven (recommended)
mvn clean spring-boot:run

# Method 2: Using IDE (IntelliJ IDEA)
# Right-click project → Run → HomeCanvasAuthApplication (if main class exists)
```

**Expected Output:**
```
...
2026-04-17 10:15:32 INFO  o.s.b.w.e.tomcat.TomcatWebServer : Tomcat started on port(s): 8080 (http)
2026-04-17 10:15:32 INFO  c.h.HomeCanvasAuthApplication : Started HomeCanvasAuthApplication in 3.456 seconds
```

### Step 4: Verify Backend is Running
```bash
# Test the API endpoint
curl -X GET http://localhost:8080/api/devices

# Or open in browser:
http://localhost:8080/h2-console  # H2 database console
```

**Backend is ready when:**
- ✅ Listening on `http://localhost:8080`
- ✅ H2 console accessible at `http://localhost:8080/h2-console`
- ✅ No errors in console

---

## Frontend Startup

### Step 1: Navigate to Frontend Directory
```bash
cd e:\Projects\HomeCanvas\frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

( First time only - installs axios, react-router-dom, tailwindcss, vite, etc.)

### Step 3: Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
  VITE v4.x.x  ready in 245 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Step 4: Open in Browser
Navigate to: **http://localhost:5173**

**Frontend is ready when:**
- ✅ Browser shows login page
- ✅ Console shows no 404 errors
- ✅ Backend API calls succeed (check Network tab in DevTools)

---

## Data Flow Walkthrough

### Complete Cycle: Sensor → Backend → React Dashboard (Every 2 Seconds)

```
STEP 1: ESP32 Reads Sensors (2-second interval)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESP32 Main Loop:
  └─ GPIO 13 (PIR): Read motion state (HIGH/LOW)
  └─ GPIO 35 (Sound): analog Read() → 0-4095 ADC value
  └─ GPIO 32 (LDR): analog Read() → 0-4095 ADC value
  └─ Status: motionDetected, noiseLevel, lightLevel

STEP 2: ESP32 Sends JSON to Backend (HTTP POST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST /api/iot/telemetry
Host: 192.168.1.X:8080  (your laptop IP)
Content-Type: application/json

{
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "lightLevel": 512,
  "noiseLevel": 234,
  "motionDetected": true
}

STEP 3: Backend Processes Telemetry
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IotController.processTelemetry()
  └─ Validates incoming payload
  └─ Creates SensorEvent in database
  └─ Applies automation rules:
     ├─ If motionDetected → fanOn = true
     ├─ If noiseLevel > 700 → lcdMessage = "ALERT"
     └─ If lightLevel < 300 → fanOn = false
  └─ Returns DeviceCommandDTO

STEP 4: Backend Sends Commands Back to ESP32
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response Example:
{
  "fanOn": true,
  "lcdMessage": "SECURITY_ALERT",
  "timestamp": 1713360000000
}

STEP 5: ESP32 Executes Commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If fanOn == true:
  └─ leftVent.write(90)   // Open left servo
  └─ rightVent.write(90)  // Open right servo
  └─ digitalWrite(GPIO 25, HIGH)  // Turn on LED

If lcdMessage present:
  └─ Serial2.println("SECURITY ALERT!")  // Send to Arduino

STEP 6: React Dashboard Receives Live Updates
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
React useEffect() polls backend every 2-5 seconds:
  └─ GET /api/devices
  └─ Fetches latest device state
  └─ Updates dashboard with:
     ├─ Sensor readings (motion, sound, light)
     ├─ Servo position (open/closed)
     ├─ Last sensor reading time
     └─ Status (online/offline)

STEP 7: Arduino Console Receives Alerts (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Arduino Uno reads from RX Pin 0 (UART):
  └─ Prints formatted alert to Serial Monitor
  └─ Flashes onboard LED 5 times rapidly
  └─ Console output visible in Arduino IDE
```

---

## How to Use the React Dashboard

### Login/Register

1. **First time setup:**
   - Click "Register" link at bottom of login page
   - Create account: email + password
   - Click "Login"
   - Enter credentials

2. **Credentials storage:**
   - JWT token saved to `localStorage`
   - Automatically sent with all API requests
   - Auto-logout on 401 errors

### Device Dashboard (Main View)

**URL:** `http://localhost:5173/devices` (after login)

```
┌─────────────────────────────────────────────────┐
│    Device Dashboard (Shows All Connected IoT    │
│           Devices & Sensor Readings)            │
├─────────────────────────────────────────────────┤
│                                                 │
│  Device Card: HomeCanvas Vent Node              │
│  ┌─────────────────────────────────────────┐  │
│  │ MAC: AA:BB:CC:DD:EE:FF                  │  │
│  │ Status: 🟢 Online                       │  │
│  │ Last Seen: 2 minutes ago                │  │
│  │                                         │  │
│  │ [Click to View Details & Control]       │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  Device Card: (Next device if added)           │
│  ...                                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Features:**
- Lists all registered devices (ESP32 nodes)
- Shows online/offline status based on latest telemetry
- Last seen timestamp for each device
- Click any device to view detailed controls

### Device Detail Page (Control & Monitor)

**URL:** `http://localhost:5173/devices/{deviceId}` (click a device)

```
┌──────────────────────────────────────────────────────────┐
│          HomeCanvas Vent Node - Control Panel            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📊 LIVE SENSOR READINGS                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Motion Detected:  ✅ YES                        │   │
│  │ Light Level:      512 / 4095 (mid brightness)  │   │
│  │ Noise Level:      234 / 4095 (quiet)           │   │
│  │ Last Updated:     2 seconds ago                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  🔧 DEVICE CONTROLS                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [Open Vent] [Close Vent] [Refresh]              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  📈 RECENT EVENTS (Last 24 hours)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 10:15 - Motion Detected (from PIR sensor)       │   │
│  │ 10:12 - Vent Closed (light was low)             │   │
│  │ 10:08 - Noise Alert (>700 threshold)            │   │
│  │ ...                                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Sensor Reading Interpretation:**
- **Motion Detected:** `true` = motion sensor triggered; `false` = no motion
- **Light Level:** 0-1023 range
  - < 300: Dark room (assume vacancy)
  - 300-700: Medium light
  - > 700: Bright room
- **Noise Level:** 0-1023 range
  - < 300: Silent
  - 300-700: Normal conversation
  - > 700: Loud (trigger alert)

**Vent Control:**
- **[Open Vent]** button → Sends command to open servos (90°)
- **[Close Vent]** button → Sends command to close servos (0°/180°)
- **[Refresh]** button → Manually fetch latest sensor data
- Auto-refresh: Every 5 seconds (can disable in code)

---

## Complete Testing Workflow

### Test 1: Verify All Systems Online

**Terminal 1 - Backend:**
```bash
cd e:\Projects\HomeCanvas\backend
mvn clean spring-boot:run
# Wait for: "Started HomeCanvasAuthApplication in X.XXX seconds"
```

**Terminal 2 - Frontend:**
```bash
cd e:\Projects\HomeCanvas\frontend
npm run dev
# Wait for: "➜ Local: http://localhost:5173/"
```

**Terminal 3 - Arduino Serial Monitor:**
```
Open Arduino IDE
Tools → Serial Monitor (9600 baud)
Look for: "ENTERPRISE VENT NODE ONLINE"
```

**Terminal 4 - Network Finder (find your laptop IP):**
```bash
ipconfig
# Look for: IPv4 Address: 192.168.X.X
# Note this IP for ESP32 WiFi configuration
```

### Test 2: Upload Firmware to ESP32

```bash
# 1. Open Arduino IDE
# 2. File → Open: e:\Projects\HomeCanvas\firmware\esp32\main.cpp
# 3. Update WiFi credentials:
#    const char* ssid = "YOUR_NETWORK";
#    const char* password = "YOUR_PASSWORD";
#    const String backendUrl = "http://192.168.X.X:8080/api/iot/telemetry";
#       ↑ Use laptop IP from ipconfig

# 4. Tools → Board: ESP32 Dev Module
# 5. Tools → COM Port: (select ESP32 port)
# 6. Sketch → Upload

# 7. Open Serial Monitor (115200 baud)
# Expected output:
# "Connecting to Wi-Fi..."
# "Connected! My IP is: 192.168.Y.Y"
# "My MAC Address is: AA:BB:CC:DD:EE:FF"
```

**Troubleshooting WiFi Issues:**
```cpp
// If WiFi won't connect, add this to setup():
WiFi.setAutoReconnect(true);
WiFi.persistent(true);

// Or try clearing WiFi memory:
WiFi.disconnect(true);  // true = turn off radio
delay(100);
WiFi.begin(ssid, password);
```

### Test 3: Upload Firmware to Arduino Uno

```bash
# 1. DISCONNECT GPIO 17 from Arduino Pin 0 (critical!)
# 2. Open Arduino IDE
# 3. File → Open: e:\Projects\HomeCanvas\firmware\arduino-uno\alert-terminal.ino
# 4. Tools → Board: Arduino Uno
# 5. Tools → COM Port: (select Arduino port - different from ESP32)
# 6. Sketch → Upload
# 7. RECONNECT GPIO 17 to Arduino Pin 0 (critical!)

# 8. Open Serial Monitor (9600 baud)
# Expected output:
# "=================================="
# " ENTERPRISE VENT NODE ONLINE "
# "=================================="
```

### Test 4: End-to-End Sensor Flow

```bash
# A. Open React Dashboard: http://localhost:5173
#    ├─ Login with your credentials
#    └─ Click on the device (HomeCanvas Vent Node)

# B. Monitor Backend Logs:
#    Watch for: "Processing telemetry: {"macAddress":"...", "lightLevel":...}"

# C. Trigger Sensor Events:

#    1. MOTION TEST:
#       └─ Wave hand in front of PIR sensor
#       └─ Watch React dashboard: "Motion Detected: YES"
#       └─ Watch backend logs: "motionDetected": true
#       └─ Servos should open (you'll hear clicking)
#       └─ Status LED on GPIO 25 turns on

#    2. NOISE TEST:
#       └─ Clap hands loudly near sound sensor
#       └─ Watch: "Noise Level" value spike > 700
#       └─ Watch Arduino console: "⚠️ SECURITY EVENT DETECTED"
#       └─ Arduino LED Pin 13 should flash 5 times

#    3. LIGHT TEST:
#       └─ Cover LDR sensor completely (darkness)
#       └─ Watch: "Light Level" drops below 300
#       └─ Servos should close (vent shut in dark)
#       └─ Repeat by exposing to bright light

# D. Test Servo Commands from Dashboard:
#    └─ Click [Open Vent] button
#    └─ Listen for servo clicking (motors moving)
#    └─ Watch LED Light Level update in real-time
#    └─ Click [Close Vent] button
#    └─ Servos should return to closed position
```

### Test 5: Verify Database Storage

```bash
# 1. Open H2 Console: http://localhost:8080/h2-console
# 2. Login with default credentials:
#    Driver: org.h2.Driver
#    JDBC URL: jdbc:h2:mem:testdb
#    User Name: sa
#    Password: (leave blank)
# 3. Execute SQL queries:

SELECT * FROM SENSOR_EVENTS ORDER BY TIMESTAMP DESC LIMIT 10;
# Shows all sensor readings from last ~20 seconds

SELECT * FROM ACTION_LOGS ORDER BY TIMESTAMP DESC LIMIT 10;
# Shows all actions taken (servo opens, alerts, etc.)

SELECT * FROM DEVICES;
# Shows registered devices with MAC addresses

SELECT * FROM USERS;
# Shows registered user accounts
```

---

## Complete Project Startup Script

**Create `run-all.sh` (macOS/Linux) or `run-all.bat` (Windows):**

### Windows Batch File: `run-all.bat`

```batch
@echo off
REM HomeCanvas Complete Startup Script

echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║    HomeCanvas IoT Smart Home System Startup       ║
echo ║    Starting all services (Backend, Frontend)      ║
echo ╚═══════════════════════════════════════════════════╝
echo.

REM Find IP address
echo Finding your IP address...
ipconfig | findstr "IPv4" | findstr /v "Tunnel"

echo.
echo =================================================
echo Starting Spring Boot Backend (Terminal 1)...
echo =================================================
start cmd /k "cd e:\Projects\HomeCanvas\backend && mvn clean spring-boot:run"

timeout /t 5 /nobreak
echo.
echo =================================================
echo Starting React Frontend Development Server (Terminal 2)...
echo =================================================  
start cmd /k "cd e:\Projects\HomeCanvas\frontend && npm run dev"

timeout /t 3 /nobreak
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║           STARTUP COMPLETE                        ║
echo ║                                                   ║
echo ║  Backend: http://localhost:8080                  ║
echo ║  Frontend: http://localhost:5173                 ║
echo ║  Database: http://localhost:8080/h2-console     ║
echo ║                                                   ║
echo ║  Next Steps:                                     ║
echo ║  1. Update WiFi credentials in firmware/esp32/main.cpp
echo ║  2. Replace YOUR_LAPTOP_IP with IP from ipconfig
echo ║  3. Upload ESP32 firmware                        ║
echo ║  4. Upload Arduino firmware                      ║
echo ║  5. Open http://localhost:5173 in browser       ║
echo ╚═══════════════════════════════════════════════════╝
echo.
echo Waiting for services to initialize...
echo Press Ctrl+C in the new terminals to stop
timeout /t 10 /nobreak
```

**To use it:**
```bash
# Save as: e:\Projects\HomeCanvas\run-all.bat
# Double-click to execute (opens 2 terminal windows)
```

---

## Troubleshooting

### Frontend Shows "Cannot GET /devices"
**Symptoms:** After login, page shows connection error

**Solutions:**
1. Verify backend is running: `http://localhost:8080` in browser
2. Check API base URL in `frontend/src/services/api.ts`:
   ```javascript
   const API = axios.create({
       baseURL: 'http://localhost:8080/api',  // ← Should be localhost:8080
   });
   ```
3. Check browser console (F12) for specific error message
4. Check backend logs for 404 or 500 errors

### ESP32 Won't Upload
**Symptoms:** "ERROR: Failed to connect to ESP32: Timed out waiting for packet header"

**Solutions:**
1. Install CP210x drivers: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
2. Hold BOOT button while uploading
3. Try different USB cable (must be data cable, not charge-only)
4. Try different USB port on laptop
5. Close any other serial monitors accessing the port

### Sensor Readings Always Zero
**Symptoms:** Dashboard shows `lightLevel: 0, noiseLevel: 0, motionDetected: false`

**Solutions:**
1. Verify GPIO pins match code:
   ```
   PIR → GPIO 13 ✓
   Sound → GPIO 35 ✓
   LDR → GPIO 32 ✓ (with INPUT_PULLUP)
   ```
2. Check power connections:
   - Sensor VCC → 3.3V rail ✓
   - Sensor GND → ESP32 GND ✓
3. Add 100µF capacitor across sensor power/GND for noise filtering
4. Verify breadboard contacts (corrosion on used boards)

### Arduino Console Never Receives Messages
**Symptoms:** "ENTERPRISE VENT NODE ONLINE" appears but nothing after that

**Solutions:**
1. Check UART connection:
   - ESP32 GPIO 17 → Arduino Pin 0 ✓
   - ESP32 GND → Arduino GND ✓
2. Verify baud rates match:
   - ESP32: `Serial2.begin(9600, ...)`
   - Arduino: `Serial.begin(9600);`
3. Check that message was actually sent by ESP32:
   - Open ESP32 Serial Monitor (115200 baud)
   - Look for: "lcdMessage" in response
4. Re-upload Arduino code if baud rate was wrong

### React Dashboard Not Updating (Stuck Values)
**Symptoms:** Displayed sensor data doesn't change for >10 seconds

**Solutions:**
1. Manually click [Refresh] button to fetch latest data
2. Check backend logs for error processing telemetry
3. Verify ESP32 is still connected to WiFi:
   - Check ESP32 Serial Monitor for connection messages
   - Look for error messages like "WiFi disconnected"
4. Check that 2-second polling interval is working:
   - Add `Serial.println()` in ESP32 loop() to verify it's running
5. Browser cache issue:
   - Clear browser cache (Ctrl+Shift+Delete / Cmd+Shift+Delete)
   - Hard reload: Ctrl+F5

### Database Shows No Sensor Events
**Symptoms:** H2 console has empty SENSOR_EVENTS table

**Solutions:**
1. Verify backend is processing telemetry:
   - Check backend logs for "Processing telemetry" messages
   - If nothing appears, ESP32 isn't sending data
2. Verify database is being written to:
   - Query: `SELECT COUNT(*) FROM SENSOR_EVENTS;`
   - Should increase every 2-5 seconds
3. Check HTTP POST from ESP32:
   - ESP32 Serial Monitor should show: "Backend says: {...}"
   - If error shown, check IP address and port

### Servos Don't Move When Testing Dashboard
**Symptoms:** Click [Open Vent] but servos stay still

**Solutions:**
1. Check servo power:
   - Verify 5V connected to servo VCC (both left & right)
   - USB power supply must be 2A+ during servo movement
2. Check GPIO connections:
   - Left servo signal → GPIO 14 ✓
   - Right servo signal → GPIO 27 ✓
3. Verify servo library is working:
   - Add test code in ESP32 setup():
     ```cpp
     leftVent.write(0); delay(1000);
     leftVent.write(90); delay(1000);
     leftVent.write(180);
     ```
4. Listen for servo noise:
   - Servos should click/buzz when moving
   - If silent, power isn't reaching them
5. Check backend is sending command:
   - Backend logs should show: `fanOn: true`
   - If not appearing, check automation rules in IotService

---

## Next Steps After Getting It Running

Once the system is working:

1. **Add More Sensors:**
   - DHT22 for temperature/humidity
   - Water level sensor for tank monitoring
   - Additional PIR sensors in different rooms

2. **Implement Advanced Automation Rules:**
   - Schedule rules (open vent at 8:00 AM)
   - Occupancy-based rules (close when no motion for 30 min)
   - Time-based rules (max opening time = 2 hours)

3. **Add Home Assistant Integration:**
   - Use MQTT bridge to expose to Home Assistant
   - Create automations using HA's powerful UI

4. **Deploy to Production:**
   - Use MySQL instead of H2
   - Add HTTPS/SSL certificates
   - Implement API key authentication
   - Deploy backend on cloud server (AWS, Azure, etc.)
   - Deploy frontend on web server (Netlify, Vercel, etc.)

---

## Quick Reference Commands

```bash
# Terminal 1: Run Backend
cd e:\Projects\HomeCanvas\backend && mvn clean spring-boot:run

# Terminal 2: Run Frontend  
cd e:\Projects\HomeCanvas\frontend && npm run dev

# Terminal 3: Check Backend Logs
Get-Content "e:\Projects\HomeCanvas\backend\nohup.out" -Tail 20 -Wait

# Find laptop IP (needed for ESP32 WiFi config)
ipconfig

# Check if backend is running
curl -I http://localhost:8080

# Check if frontend is running
curl -I http://localhost:5173

# Clear frontend cache
rm -r e:\Projects\HomeCanvas\frontend\node_modules\.vite

# Rebuild everything from scratch
cd e:\Projects\HomeCanvas && git clean -fdx && mvn clean install && npm install
```

---

## Architecture Diagram (Full System)

```
USER INTERACTION FLOW
━━━━━━━━━━━━━━━━━━━━━
User (at laptop)  
  ↓
Open http://localhost:5173
  ↓
React App loads
  ↓
Login/Register page
  ↓ (enter credentials)
Backend validates via /api/auth/login
  ↓
JWT token stored in localStorage
  ↓
Redirects to Device Dashboard
  ↓
Displays list of registered devices
  ↓ (click a device)
Opens Device Detail page
  ↓
Shows live sensor data + control buttons
  ↓ (user clicks [Open Vent])
React sends POST to /api/devices/{id}/command
  ↓
Backend marks device for opening
  ↓
Next ESP32 telemetry POST receives fanOn: true
  ↓
ESP32 opens servos
  ↓
Status LED turns on
  ↓
React dashboard refreshes (5-second cycle)
  ↓
Shows updated sensor values + "Vent: OPEN"
  ↓
User sees real-time status


HARDWARE INTERACTION FLOW
━━━━━━━━━━━━━━━━━━━━━━━━
ESP32 Main Loop (every 2 seconds)
  ↓
Read GPIO 13 (PIR motion) → digitalRead()
Read GPIO 35 (Sound) → analogRead()
Read GPIO 32 (LDR light) → analogRead() via INPUT_PULLUP
  ↓
Build JSON:
  {
    "macAddress": "MAC",
    "motionDetected": true/false,
    "noiseLevel": 0-1023,
    "lightLevel": 0-1023
  }
  ↓
POST to http://LAPTOP_IP:8080/api/iot/telemetry
  ↓
Backend receives + validates
  ↓
Stores in SENSOR_EVENTS table
  ↓
Applies automation rules
  ↓
Returns DeviceCommandDTO:
  {
    "fanOn": true/false,
    "lcdMessage": "...",
    "timestamp": ...
  }
  ↓
ESP32 receives response
  ↓
if fanOn: true → leftVent.write(90), rightVent.write(90)
if fanOn: false → leftVent.write(0), rightVent.write(180)
  ↓
if lcdMessage: → Serial2.println() to Arduino
  ↓
Arduino Uno receives via Pin 0 (RX)
  ↓
Prints to Serial Monitor
  ↓
Flashes Pin 13 LED 5 times
  ↓
User sees alert in Arduino IDE Serial Monitor
```

---

**Last Updated:** April 17, 2026  
**Version:** 2.0 - Production Ready  
**Author:** HomeCanvas Development Team
