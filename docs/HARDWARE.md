# 🔧 Hardware Setup Guide

Complete hardware assembly and configuration instructions for HomeCanvas IoT System

---

## Bill of Materials (BOM)

| Qty | Component | Model | Purpose | Est. Cost |
|-----|-----------|-------|---------|-----------|
| 1 | Microcontroller | ESP32-DevKitC | Main IoT controller | $5-8 |
| 1 | Arduino | Arduino Uno | Fallback console | $5-8 |
| 1 | Light Sensor | LDR 5mm | Ambient light detection | $0.50 |
| 1 | Motion Sensor | HC-SR501 PIR | Motion detection | $3-5 |
| 1 | Sound Sensor | KY-037 | Acoustic monitoring | $2-4 |
| 1 | Servo Motor | SG90 | Smart vent control | $3-5 |
| 1 | LED | 5mm Any Color | Status indicator | $0.20 |
| 1 | Display | TM1637 4-Digit | Sensor readout | $2-4 |
| 1 | Relay Module | 5V 1-Channel | High-power switching | $2-3 |
| 1 | Breadboard | 830-pin | Prototyping | $3-5 |
| 1 | USB Cable | USB-A to Micro-B | ESP32 programming | $2 |
| 10 | Jumper Wires | M/M 20cm | Connections | $1 |
| 1 | Power Supply | 5V USB | System power | $3-5 |

**Total Estimated Cost: $30-50**

---

## Pinout Configuration

### ESP32 GPIO Mapping

```
ESP32-DevKitC Pin Configuration
┌─────────────────────────────────────────┐
│ GPIO  │ Function       │ Component      │
├─────────────────────────────────────────┤
│ GPIO 13 │ INPUT          │ PIR Motion    │
│ GPIO 14 │ PWM (LEDC)     │ Servo Motor   │
│ GPIO 17 │ TX2 (UART2)    │ Arduino RX    │
│ GPIO 25 │ OUTPUT         │ Status LED    │
│ GPIO 26 │ OUTPUT (I2C)   │ TM1637 CLK    │
│ GPIO 32 │ INPUT_PULLUP   │ LDR Light     │
│ GPIO 33 │ OUTPUT (I2C)   │ TM1637 DIO    │
│ GPIO 35 │ INPUT (ADC)    │ Sound AO      │
├─────────────────────────────────────────┤
│ 3.3V   │ Power          │ Sensors       │
│ GND    │ Ground         │ All           │
│ 5V     │ Power          │ Servo, Relay  │
└─────────────────────────────────────────┘
```

### Sensor Specifications

#### Light Sensor (LDR)
```
Part: LDR 5mm (GL5537)
Pin Configuration: GPIO 32 (INPUT_PULLUP)
Range: 0-4095 (10-bit ADC)
Response Time: <20ms
Usage: Ambient light detection for LED automation
Threshold: < 300 lux → turn LED ON
```

#### Motion Sensor (HC-SR501 PIR)
```
Part: HC-SR501 Infrared PIR
Pin Configuration: GPIO 13 (INPUT)
Range: 3-7 meters
Detection Angle: ~110°
Response Time: <1s
Usage: Motion detection for fan automation
Threshold: Motion detected → turn FAN ON
```

#### Sound Sensor (KY-037)
```
Part: KY-037 Acoustic Module
Pin Configuration: GPIO 35 (INPUT ADC) - Using AO (Analog Out)
Range: 0-1023 (10-bit ADC)
Sensitivity: Adjustable via potentiometer
Response Time: <10ms
Usage: Acoustic monitoring, security alerts
Threshold: > 100dB equivalent → display on LCD
```

#### 4-Digit Display (TM1637)
```
Part: TM1637 Display Module
CLK Pin: GPIO 26
DIO Pin: GPIO 33
Brightness: 0x00 (min) to 0x0f (max)
Refresh Rate: ~1kHz
Usage: Real-time sensor value display
Displays: Noise level when > threshold, else "0000"
```

#### Servo Motor (SG90)
```
Part: SG90 Micro Servo
Pin Configuration: GPIO 14 (PWM)
Control: 0° (closed) to 90° (open)
Frequency: 50Hz
Pulse Width: 1000-2000 microseconds
Power: 5V (1 Amp peak)
Torque: 1.8 kg·cm
Usage: Smart vent/window control
```

#### Status LED
```
Part: 5mm LED (any color)
Pin Configuration: GPIO 25 (OUTPUT)
Forward Voltage: 2-3.3V
Current: 20mA (through 100Ω resistor)
Usage: Status indicator (ON when lightLevel < 300)
```

---

## Wiring Diagram

### Physical Layout

```
┌─────────────────────────────────────────────────────────┐
│                    ESP32-DevKitC                        │
│  EN  Boot  GND  TX0 RX0 3.3V  23  19  18  17  16  4   │
│  D35  D34  D32  TX2 RX2  5V  12  14  27  26  25 D2   │
│                                                         │
│  A0:B1:C2:D3:E4:F5  (MAC Address)                      │
└─────────────────────────────────────────────────────────┘
 │      │     │     │     │      │     │     │     │
 │      │     │     │     │      │     │     │     └─ LED (+Anode)
 │      │     │     │     │      │     │     └─ Servo Signal
 │      │     │     │     │      │     └─ Display CLK
 │      │     │     │     │      └─ Display DIO
 │      │     │     │     └─ To Arduino RX
 │      │     │     └─ Motion Sensor
 │      │     └─ GND (All sensors)
 │      └─ Sound Sensor AO
 └─ Light Sensor (with 10k pullup)
```

### Connection Table

| ESP32 Pin | Component | Connection | Voltage |
|-----------|-----------|-----------|---------|
| 3.3V | All Sensors | VCC | 3.3V |
| GND | All | GND | 0V |
| GPIO 32 | LDR | Signal (with 10k pullup) | 0-3.3V |
| GPIO 13 | PIR | Signal | 0-5V (tolerant) |
| GPIO 35 | KY-037 | AO (Analog Out) | 0-3.3V |
| GPIO 26 | TM1637 | CLK | 3.3V |
| GPIO 33 | TM1637 | DIO | 3.3V |
| GPIO 14 | SG90 | Signal (PWM) | 0-3.3V |
| GPIO 25 | LED | Anode (+) via 100Ω R | 3.3V |
| GND | LED | Cathode (-) | 0V |
| 5V | SG90 | VCC | 5V |
| 5V | Relay | VCC | 5V |
| GPIO 17 | Arduino | RX | 0-3.3V |
| GND | Arduino | GND | 0V |

---

## Hardware Assembly Steps

### Step 1: Prepare Breadboard

1. Place ESP32-DevKitC on breadboard (left side)
2. Ensure power rails are accessible
3. Ground all GND pins together

### Step 2: Wire Power Rails

```
┌─────────────────────┐
│ 3.3V Rail (Top)    │  ← All sensor power
├─────────────────────┤
│ GND Rail (Bottom)  │  ← All grounds
├─────────────────────┤
│ 5V Rail (Right)    │  ← Servo & Relay power
└─────────────────────┘
```

### Step 3: Install Sensors

#### Light Sensor (LDR)
1. Insert LDR into breadboard
2. Wire one end to GPIO 32 with 10kΩ resistor pullup to 3.3V
3. Wire other end to GND

#### Motion Sensor (PIR)
1. Connect VCC to 3.3V rail
2. Connect GND to GND rail
3. Connect OUT pin to GPIO 13

#### Sound Sensor (KY-037)
1. Connect VCC to 3.3V rail
2. Connect GND to GND rail
3. Connect AO pin to GPIO 35
4. (Optionally: adjust sensitivity via onboard potentiometer)

### Step 4: Install Display

```
TM1637 Display Module
┌──────────────┐
│ GND  3.3V CLK DIO │
└──────────────┘
  │    │    │    │
  GND 3.3V GP26 GP33
```

1. Connect GND to GND rail
2. Connect VCC to 3.3V rail
3. Connect CLK to GPIO 26
4. Connect DIO to GPIO 33

### Step 5: Install Servo Motor

```
SG90 Servo Motor
┌────────────────┐
│ Brown Red Orange │
│ GND   5V  Signal  │
└────────────────┘
   │    │    │
  GND  5V  GPIO14
```

1. Connect Brown (GND) to GND rail
2. Connect Red (5V) to 5V rail
3. Connect Orange (Signal) to GPIO 14

### Step 6: Install Status LED

```
LED with 100Ω Current-Limiting Resistor
┌─────────────────────┐
│ LED+ ──┬── 100Ω ── GPIO25
│ LED-       │
└─────┬─────┴────── GND
      │
     GND
```

1. Connect LED Anode (+) through 100Ω resistor to GPIO 25
2. Connect LED Cathode (-) to GND

### Step 7: Connect Arduino (Optional)

1. Connect Arduino RX pin to ESP32 GPIO 17
2. Connect Arduino GND to ESP32 GND
3. Upload Arduino code (`alert-terminal.ino`)

### Step 8: Connect Power

1. Connect USB power supply to ESP32
2. Verify LED powers on (optional check)
3. ESP32 should boot automatically

---

## Calibration & Testing

### Light Sensor Calibration

```cpp
// Determine baseline values
Serial.println("Light levels:");
while(true) {
  int lightLevel = analogRead(GPIO_32);
  Serial.println(lightLevel);  // Range: 0-4095
  delay(1000);
}
```

Typical values:
- Bright sunlight: 3500-4095
- Normal daylight: 2000-3500
- Dim indoor: 500-2000
- Dark room: 0-500

### Motion Sensor Calibration

1. Wait 60 seconds after power-on (HC-SR501 warm-up)
2. PIR should not trigger on initial movement
3. Adjust sensitivity via onboard potentiometer if needed

### Sound Sensor Calibration

```cpp
// Determine noise baseline
Serial.println("Sound levels:");
while(true) {
  int noiseLevel = analogRead(GPIO_35);
  Serial.println(noiseLevel);  // Range: 0-1023
  delay(1000);
}
```

Typical values:
- Quiet room: 0-100
- Normal conversation: 100-300
- Loud noise: 300-600
- Very loud: 600-1023

### Servo Testing

```cpp
// Test servo movement
servo.write(0);    // Open position
delay(1000);
servo.write(90);   // Closed position
delay(1000);
```

---

## Troubleshooting Hardware

| Problem | Cause | Solution |
|---------|-------|----------|
| No power LED | USB cable not connected | Check USB connection |
| Serial monitor blank | Wrong baud rate | Set to 115200 |
| Display shows nothing | Wrong pins | Verify GPIO 26/33 |
| Motion sensor always on | Initialization period | Wait 60 seconds after power |
| LED too dim | Current limiting R too high | Use 100-220Ω resistor |
| Servo not moving | GPIO 14 not PWM | Check PWM configuration |
| WiFi connects then drops | Power supply insufficient | Use ≥1A supply |
| Sound sensor reading 0 | Using DO instead of AO | Switch to AO pin |

---

## Safety Considerations

1. **Never** leave LiPo batteries unattended while charging
2. **Verify** 5V relay is rated for your load
3. **Use** proper heat-shrink tubing on solder joints
4. **Ground** all components properly to prevent static damage
5. **Monitor** current draw (ESP32: 80-160mA, servo: up to 1A)
6. **Ventilate** area if using high-power relay

---

## Next Steps

1. Follow [SETUP.md](./SETUP.md) for firmware upload
2. Test using Serial Monitor at 115200 baud
3. View real-time sensor data in React dashboard
4. Monitor logs at backend logs/ directory

---

## Reference Documents

- [ESP32 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)
- [HC-SR501 PIR Sensor](https://www.mpja.com/download/31227sc.pdf)
- [TM1637 Display](https://github.com/avishay/TM1637)
- [SG90 Servo](https://github.com/RoboticsBrno/ESP32Servo)
