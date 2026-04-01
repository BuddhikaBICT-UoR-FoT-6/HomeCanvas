# HomeCanvas Hardware Setup Guide

Complete step-by-step guide to build the HomeCanvas IoT smart home system hardware prototype.

---

## Table of Contents
1. [Component List](#component-list)
2. [Tools Required](#tools-required)
3. [Wiring Diagram](#wiring-diagram)
4. [Assembly Instructions](#assembly-instructions)
5. [Testing Procedures](#testing-procedures)
6. [Safety Notes](#safety-notes)
7. [Troubleshooting](#troubleshooting)

---

## Component List

### Microcontroller & Processing
| Component | Quantity | Specification | Notes |
|-----------|----------|---------------|-------|
| ESP32 DevKit | 1 | 36-pin, dual-core, WiFi/BLE | Main microcontroller |
| Arduino Nano (optional) | 1 | ATmega328P, 5V | Optional secondary processor |
| Breadboard | 2 | 400-830 tie-points | For prototyping connections |

### Sensors
| Component | Quantity | Range | Notes |
|-----------|----------|-------|-------|
| **PIR Motion Sensor** | 1 | 3-5m range | HC-SR501, 5VDC |
| **LDR Light Sensor** | 1 | 250-25000 Lux equivalent | Analog 0-1023 range |
| **Sound Sensor** | 1 | 30-130 dB | Analog 0-1023 output |

### Actuators & Outputs
| Component | Quantity | Specification | Notes |
|-----------|----------|---------------|-------|
| **5V Relay Module** | 1 | 1-channel, 250VAC/10A | For fan control |
| **LED Pack** | 3 | Red/Green/Blue 5mm | Visual status indicators |
| **16x2 LCD Display** | 1 | I2C module, 5VDC | Text output for alerts |
| **Buzzer** | 1 | 5V piezo | Audio alarm |

### Power & Connectivity
| Component | Quantity | Specification | Notes |
|-----------|----------|---------------|-------|
| **USB Power Supply** | 1 | 5V/2A minimum | ESP32 power |
| **Power Bank** | 1 | 10000mAh+ | Portable operation |
| **Resistors** | 10+ | 220Ω, 10kΩ, 1kΩ | Current limiting, pull-ups |
| **Capacitors** | 5+ | 10µF, 100µF | Noise filtering |
| **Jumper Wires** | 50+ | F-F, M-F | Breadboard connections |
| **USB Micro Cable** | 1 | Data + Power | ESP32 programming |
| **WiFi Network** | - | 2.4GHz | For ESP32 connectivity |

### Optional Components
| Component | Purpose |
|-----------|---------|
| DHT22 Temperature/Humidity | Extended telemetry |
| Soil Moisture Sensor | Garden automation |
| Water Level Sensor | Tank monitoring |
| OLED Display | Alternative to LCD |

---

## Tools Required

### Essential
- **Soldering Iron** (25-40W recommended)
- **Solder & Flux** (lead-free preferred)
- **Wire Strippers** (for 22-28 AWG)
- **Multimeter** (voltage/continuity testing)
- **Hot Glue Gun** (component mounting)

### Helpful
- **Breadboard Power Supply** (dedicated 5V/3.3V rails)
- **USB to Serial Adapter** (debugging)
- **Tweezers** (precision component placement)
- **PCB Holder/Helping Hands** (soldering assistance)
- **Safety Glasses** (eye protection)

---

## Wiring Diagram

### ESP32 Pin Assignments

```
┌─────────────────────────────────────┐
│       ESP32 DevKit (36-pin)         │
├─────────────────────────────────────┤
│ Power:                              │
│  5V  ────→ Breadboard 5V rail       │
│  GND ────→ Breadboard GND rail      │
│  3V3 ────→ 3.3V rail (sensors)      │
│                                     │
│ Sensors:                            │
│  GPIO 19 (ADC2_3) ─→ LDR (A0)       │
│  GPIO 32 (ADC1_4) ─→ Noise (A1)     │
│  GPIO 34 (ADC1_6) ─→ PIR (D1)       │
│                                     │
│ Outputs:                            │
│  GPIO 5  ─→ Relay Module (IN pin)   │
│  GPIO 18 ─→ Red LED (anode via R)   │
│  GPIO 19 ─→ Green LED (anode via R) │
│  GPIO 21 ─→ Blue LED (anode via R)  │
│  GPIO 22 ─→ LCD SDA (I2C)           │
│  GPIO 23 ─→ LCD SCL (I2C)           │
│  GPIO 25 ─→ Buzzer (pos via R)      │
│                                     │
│ Serial/JTAG:                        │
│  TX (GPIO 1) ─→ USB via auto-reset  │
│  RX (GPIO 3) ─→ USB via auto-reset  │
└─────────────────────────────────────┘
```

### Sensor Pinouts

#### **PIR Motion Sensor (HC-SR501)**
```
┌─────────────────┐
│  VCC  GND  OUT  │   (3-5V logic)
│  5V   GND  34   │   Connected to ESP32 GPIO 34
└─────────────────┘
```

#### **LDR Light Sensor**
```
Circuit:
  5V ─────[LDR]──┬─── ESP32 GPIO 19 (ADC)
                 │
              [10k Ω resistor]
                 │
                GND
```

#### **Sound Sensor (Analog)**
```
Circuit:
  5V ──→ VCC
  GND ──→ GND
  ESP32 GPIO 32 ──→ OUT (Analog signal)
  
Sensitivity: Adjustable via potentiometer on module
```

#### **16x2 LCD with I2C Module**
```
┌──────────────┐
│ GND  VCC SCL SDA │
│ GND  5V  23  22  │   Connected to ESP32 GPIO 22/23
└──────────────┘
```

#### **5V Relay Module**
```
┌───────────────────┐
│ GND  VCC  IN      │
│ GND  5V   GPIO 5  │   Low signal = relay activates
│                   │   Common, Normally Open, Normally Closed
├───────────────────┤
│  COM  NO   NC     │   Wire AC device to COM/NO
└───────────────────┘
```

#### **LED Connections (with current-limiting resistors)**
```
5V ─[220Ω]─[LED anode]─ GPIO 18 (Red)
5V ─[220Ω]─[LED anode]─ GPIO 19 (Green)
5V ─[220Ω]─[LED anode]─ GPIO 21 (Blue)
     Cathode to GND
```

#### **Buzzer**
```
5V ─[1kΩ resistor]─[Buzzer +]─ GPIO 25
     Buzzer - to GND
```

---

## Assembly Instructions

### Step 1: Prepare Breadboards & Power Rails

1. **Place first breadboard** horizontally with 30-pin end facing you
2. **Wire power rails**:
   ```
   USB 5V ─→ Red rail (+) on both breadboards
   GND    ─→ Blue rail (-) on both breadboards
   ```
3. **Add power supply**:
   - Connect USB 5V to breadboard power rail
   - Verify with multimeter: 5V between + and - rails
4. **Add 3.3V rail** (optional, for sensor power):
   - Use breadboard power supply module ESP32 3V3 output

### Step 2: Mount ESP32

1. **Insert ESP32** into breadboard center column (leave 2 rows on each side for hookups)
   ```
   Top row: Vcc, GND, D23, D22, D21, D20, D19, D18...
   Bottom row: EN, RST, GPIO35, GPIO34, GPIO32, GPIO33...
   ```
2. **Connect power**:
   - ESP32 5V pin → Breadboard 5V rail
   - ESP32 GND (2 pins) → Breadboard GND rail
   - ESP32 3V3 → 3.3V rail (if using separate rail)
3. **Verify**: Multimeter should show 5V between 5V and GND on ESP32

### Step 3: Connect Sensors

#### **PIR Motion Sensor**
1. Insert 3-pin header into breadboard
2. Wire terminals:
   - VCC (red) → 5V rail
   - GND (black) → GND rail
   - OUT (yellow) → ESP32 GPIO 34
3. Verify LED on sensor lights up (indicates power)

#### **LDR Light Sensor**
1. Place LDR photoresistor across breadboard gap
2. Connect one leg to 5V rail
3. Connect other leg to:
   - 10kΩ resistor → GND
   - Junction between resistor → ESP32 GPIO 19 (ADC)
4. Test: Multimeter shows ~ 1.5V in darkness, ~ 3V in bright light

#### **Sound Sensor**
1. Insert 4-pin sound sensor module into breadboard
2. Connect:
   - VCC → 5V rail
   - GND → GND rail
   - OUT (Analog) → ESP32 GPIO 32
   - GND (second pin) → GND rail
3. Adjust sensitivity potentiometer (CCW = more sensitive)

#### **LCD I2C Display**
1. Solder 4-pin header to LCD I2C module if not pre-soldered
2. Connect:
   - GND → GND rail
   - VCC → 5V rail
   - SCL → ESP32 GPIO 23
   - SDA → ESP32 GPIO 22
3. **Pro tip**: Add 100µF capacitor across I2C power pins for stability

### Step 4: Connect Actuators

#### **Relay Module (Fan Control)**
1. Insert 3-pin relay into second breadboard
2. Connect:
   - GND → GND rail
   - VCC → 5V rail
   - IN → ESP32 GPIO 5
3. Wire AC fan/device:
   - Connect to COM (common) and NO (normally open)
   - **Safety**: Enclose high-voltage connections in shrink tubing

#### **LEDs (Status Indicators)**
1. Insert 3 LEDs into breadboard pointing upward
2. For each LED:
   - **Anode (long leg)** → 220Ω resistor → 5V rail
   - **Cathode (short leg)** → ESP32 pin
     - Red LED → GPIO 18
     - Green LED → GPIO 19
     - Blue LED → GPIO 21
3. Test: Apply 5V across resistor should light LED

#### **Buzzer**
1. Insert piezo buzzer into breadboard
2. Connect:
   - **+** (positive) → 1kΩ resistor → ESP32 GPIO 25
   - **-** (negative) → GND
3. Test: Apply 5V signal should produce beep

### Step 5: Cable Management

1. **Group sensor wires** with zip ties:
   - All sensor signals together
   - All power/GND wires together
2. **Label wires** with tape markers (G19=LDR, G34=PIR, etc.)
3. **Prevent shorts** with isolating tape on exposed resistor leads
4. **Secure components** with hot glue:
   - Glue sensor modules to breadboard frame
   - Secure LCD display with double-sided tape

### Step 6: Connect Power Supply

1. Connect USB power source to breadboard 5V rail
2. **First power-on check**:
   - All LEDs should light dimly (they'll be on GPIO states)
   - LCD should backlight (may show garbage characters initially)
   - No smoke or burning smell!
3. Verify multimeter readings:
   - 5V between power rail and GND
   - 3.3V on ESP32 3V3 pin
   - ~2.5V on ESP32 ADC pins (mid-range)

---

## Testing Procedures

### Pre-Firmware Tests

#### **1. Power Distribution Test**
```
Multimeter (DC Voltage mode):
✓ 5V rail to GND: should read 5.0V ± 0.2V
✓ ESP32 5V pin to GND: should read 5.0V
✓ Sensor modules VCC to GND: should read 5.0V
✓ I2C devices: should read 5.0V
```

#### **2. Continuity Test**
```
Multimeter (Continuity/Ohms mode):
✓ All GND connections beep (indicate continuity)
✓ No beep between 5V and GND (good isolation)
✓ GPIO pins ~ 10kΩ to GND when idle
```

#### **3. Sensor Analog Readings**
```
Multimeter (ADC Voltage mode):
✓ LDR (GPIO 19): 1.5V dark → 3.5V bright
✓ Noise (GPIO 32): 1.0V silent → 3.0V loud
✓ PIR (GPIO 34): 0V no motion → 5V motion detected
```

#### **4. LED Test**
```
Manual test (apply power):
✓ Red LED illuminates when GPIO 18 pulled high
✓ Green LED illuminates when GPIO 19 pulled high  
✓ Blue LED illuminates when GPIO 21 pulled high
✓ All LEDs extinguish when GPIOs pulled low
```

#### **5. Relay Test**
```
Audible/Visual test:
✓ Click sound when GPIO 5 pulled high (relay activates)
✓ Multimeter shows continuity COM↔NO when activated
✓ Click sound when GPIO 5 pulled low (relay deactivates)
✓ Multimeter shows continuity COM↔NC when deactivated
```

#### **6. Buzzer Test**
```
Audio test:
✓ Buzzer beeps when GPIO 25 pulled high
✓ Quiet when GPIO 25 pulled low
✓ Volume is reasonable (not painful)
```

### Post-Firmware Tests (After Arduino IDE Upload)

#### **7. Serial Monitor Test**
```
Arduino IDE → Tools → Serial Monitor (115200 baud):
✓ Startup messages appear
✓ Sensor readings update every 1-2 seconds
✓ PIR triggers print motion detection
✓ Noise threshold triggers buzzer
✓ Light threshold triggers LED
```

#### **8. Sensor Accuracy Validation**
```
LDR Test:
  Cover sensor → voltage should drop
  Shine light → voltage should increase
  Vary intensity → readings should be proportional

Noise Test:
  Silence → low reading (< 200)
  Normal speech → ~500-600
  Loud noise → high reading (> 700)

PIR Test:
  Wave hand at sensor → triggers immediately
  Hold still → stops after ~2 seconds
  Test range (should be 3-5 meters)
```

#### **9. Automation Rules Test**
```
Test each rule independently:

Rule 1 (Motion→Fan):
  ✓ Wave at PIR sensor
  ✓ Verify relay clicks and RED LED illuminates
  ✓ Check backend received ActionLog entry

Rule 2 (Noise>700→Alert):
  ✓ Clap hands loudly near sensor
  ✓ Verify BLUE LED illuminates
  ✓ Verify LCD shows "ALERT" message
  ✓ Check backend received ActionLog

Rule 3 (Light<300→LED):
  ✓ Cover LDR sensor completely
  ✓ Verify GREEN LED illuminates
  ✓ Verify backend received ActionLog
```

#### **10. WiFi & API Connectivity Test**
```
Arduino Serial Monitor:
  ✓ "Connecting to WiFi: [SSID]..."
  ✓ "WiFi connected. IP: 192.168.x.x"
  ✓ "API endpoint: http://[backend-ip]:8080/api/iot/telemetry"

Test telemetry send:
  ✓ Trigger sensor event
  ✓ Should see JSON POST in backend logs
  ✓ Check MongoDB/SQL database for SensorEvent entry
```

---

## Safety Notes

### ⚠️ Electrical Safety
1. **Never** leave circuit powered unattended during assembly
2. **Always** disconnect USB before major rewiring
3. **Double-check** polarity before power-on (most critical!)
4. **Use 220Ω minimum** resistors for LED current limiting
5. **Enclose** high-voltage relay contacts (if using AC devices)
6. **Never** handle circuits while wet or barefoot

### ⚠️ Relay Safety (If Using AC)
1. **Label clearly**: "Danger - High Voltage"
2. **Enclose** AC wiring with shrink tubing or electrical tape
3. **Test relay operation** with multimeter before connecting live AC
4. **Use properly grounded** power outlets
5. **Install in protective enclosure** (plastic project box)
6. **Never mix** AC and DC wiring visually

### ⚠️ Component-Specific
1. **PIR Sensor**: Power on and wait 1 minute for stable state
2. **LCD Display**: Use heatsink if leaving powered for 6+ hours
3. **Buzzer**: Limit continuous operation to <10 seconds
4. **LDR**: Avoid exposing to extremely bright light (>50,000 Lux)
5. **ESP32**: Ensure adequate heat dissipation in enclosure

---

## Troubleshooting

### **ESP32 Not Recognized by Computer**
**Symptoms**: USB cable connected but no COM port in Device Manager
**Solutions**:
1. Install [CP210x USB driver](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)
2. Try different USB cable (data cable, not charge-only)
3. Try different USB port on computer
4. Hold BOOT button while connecting USB
5. Check Device Manager for "Unknown Device" → driver install

### **Sensors Reading Noise/Garbage Values**
**Symptoms**: ADC values jumping randomly, no pattern
**Solutions**:
1. Add 100µF capacitor across sensor power and GND
2. Keep sensor analog wires away from power/digital wires
3. Shorten cable lengths if possible
4. Check breadboard contact quality (replace if corroded)
5. Verify 5V supply is solid (multimeter should not fluctuate)
6. Try different GPIO pin for the problematic sensor

### **Relay Not Clicking**
**Symptoms**: GPIO 5 high but relay silent, multimeter shows no continuity
**Solutions**:
1. Verify 5V at relay module VCC pin
2. Test GPIO 5 with multimeter (should show 3.3V when high)
3. Check relay IN pin connection (should go LOW to activate, not HIGH)
4. Try lower GPIO pin like GPIO 2
5. Verify relay module is not defective (swap with new module)
6. Check for cold solder joints on relay module pins

### **LCD Shows Garbled Text or Backlight Only**
**Symptoms**: Backlight on but text unreadable or missing
**Solutions**:
1. Verify I2C address (should be 0x27 or 0x3F):
   ```
   Arduino I2C scanner: https://playground.arduino.cc/Main/I2cScanner
   ```
2. Adjust contrast potentiometer on I2C module (try all positions)
3. Verify SCL (GPIO 23) and SDA (GPIO 22) connected correctly
4. Add 100µF capacitor near LCD power pins
5. Try I2C pull-up resistors: 4.7kΩ on SCL and SDA to 5V
6. Replace I2C module if still garbled

### **PIR Sensor Always Triggered (No Motion Needed)**
**Symptoms**: RED LED stays on, motion rule always fires
**Solutions**:
1. Wait 1-2 minutes after power-on for stabilization
2. Reduce sensitivity: Rotate TIME pot CCW, SENS pot CCW
3. Keep sensor away from heat sources (sunlight, heaters)
4. Verify sensor not touching breadboard edge (vibration)
5. Try different GPIO pin
6. Replace PIR sensor if defective

### **Noise Sensor Has No Range**
**Symptoms**: Reading stuck at ~512 regardless of noise level
**Solutions**:
1. Adjust sensitivity potentiometer (marked SENSITIVITY)
2. Recalibrate: Set to medium, then noise should vary ±100 points
3. Verify OUT pin not floating (should have 1-4V reading)
4. Check microphone is not covered or blocked
5. Try different GPIO (GPIO 35 alternative)

### **LDR Reading Always High or Low**
**Symptoms**: ADC reading stuck at max (4095) or min (0)
**Solutions**:
1. Check resistor divider: LDR value should be 200Ω-500Ω
2. Try different resistor values:
   - Bright rooms: Use 18kΩ instead of 10kΩ
   - Dark rooms: Use 5.6kΩ instead of 10kΩ
3. Verify LDR not shorted to 5V or GND
4. Clean LDR lens (dust/dirt reduces sensitivity)
5. Try different ADC pin if available

### **WiFi Connection Fails**
**Symptoms**: "Failed to connect to WiFi" in serial monitor
**Solutions**:
1. Verify WiFi SSID and password correct in code
2. Ensure 2.4GHz band enabled (ESP32 doesn't support 5GHz only)
3. Check WiFi signal strength (should be -70 dBm or better)
4. Verify router MAC filtering disabled
5. Try connecting to phone hotspot to isolate router issues
6. Restart ESP32 (power cycle)
7. **Last resort**: Erase flash and re-upload firmware:
   ```bash
   esptool.py --chip esp32 erase_flash
   # Then re-upload via Arduino IDE
   ```

### **API Connection Timeout**
**Symptoms**: WiFi connected but "API connection failed" message
**Solutions**:
1. Verify backend server running on port 8080
2. Ping backend from computer: `ping 192.168.x.x`
3. Check network: ESP32 and server must be on same WiFi
4. If backend on different network, verify IP and port correct
5. Check backend logs for incoming requests
6. Try hardcoded IP instead of hostname (if using DNS)
7. Increase timeout value in firmware code

---

## Component Placement Diagram (Bird's Eye View)

```
┌─────────────────────────────────────────────────┐
│           BREADBOARD LAYOUT                      │
│                                                 │
│  [PIR Sensor]              [LCD Display]        │
│       |                          |              │
│  [USB]─[ESP32]─────[LDR]     [SCL/SDA]         │
│       |                          |              │
│   [Buzzer]   [Sound]        [Relay Module]      │
│       |         |                |              │
│   [LEDs]────[Power Rails]─[5V Supply]          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Verify all connections** using multimeter continuity test
2. **Power on** and confirm no smoke/burning smell
3. **Run all test procedures** before uploading firmware
4. **Upload Arduino firmware** to ESP32 via USB
5. **Monitor serial output** for sensor readings
6. **Connect backend server** (localhost:8080 or network IP)
7. **Test telemetry API** endpoint with sample sensor data
8. **Validate all 3 automation rules** fire correctly

---

## References

- **ESP32 Pinout**: https://randomnerdtutorials.com/esp32-pinout-reference-gpios/
- **PIR Sensor Datasheet**: HC-SR501 specifications
- **Arduino I2C Scanner**: https://playground.arduino.cc/Main/I2cScanner
- **Troubleshooting Guide**: https://randomnerdtutorials.com/

---

**Last Updated**: April 16, 2026  
**Status**: Complete - Ready for Assembly
