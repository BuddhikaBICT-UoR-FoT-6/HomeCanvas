# 🏠 HomeCanvas - Smart Home Automation System

**An Intelligent IoT-Enabled Smart Home Management Platform with Real-Time Sensor Monitoring and Automated Device Control**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Hardware Setup](#hardware-setup)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

HomeCanvas is a complete smart home automation system that bridges IoT edge devices with a cloud-based backend and intuitive web interface. It enables real-time monitoring of environmental sensors (light, motion, sound) and provides automated control of physical devices through relay switches.

**Key Benefits:**
- 🚀 Real-time sensor data processing
- 🤖 Intelligent automation rules engine
- 📊 Beautiful dashboard for device management
- 🔐 Secure JWT-based authentication
- 📱 Responsive web interface
- ⚡ Hardware-agnostic design

---

## ✨ Features

### Backend Features
- **RESTful API** with Spring Boot 3.x
- **Telemetry Ingestion** from ESP32 devices
- **Auto-Device Registration** by MAC address
- **Automation Rules Engine** with 3 production-ready rules:
  - Motion detection → Smart vent activation
  - Acoustic anomalies → Security alerts
  - Low light → LED activation
- **JWT Authentication** for secure access
- **Time-series Sensor Data** storage
- **Paginated Device Management** APIs

### Frontend Features
- **Modern React Dashboard** with TypeScript
- **Real-Time Device Monitoring** (auto-refresh every 2 seconds)
- **Device Control Interface** (servo, LED)
- **Responsive Design** for mobile/tablet/desktop
- **Beautiful Login/Register** with background imagery
- **Live Toast Notifications** for user feedback
- **Sensor Data Visualization** with color-coded indicators

### IoT Features
- **ESP32 Microcontroller** support
- **Multiple Sensors:**
  - 💡 Light Level (LDR, GPIO 32)
  - 🚨 Motion Detection (PIR, GPIO 13)
  - 🔊 Acoustic Monitoring (KY-037, GPIO 35)
- **Device Control:**
  - 🌬️ Smart Vent/Servo (GPIO 14)
  - 💡 Status LED (GPIO 25)
- **4-Digit Display** (TM1637)
- **Serial Communication** with Arduino fallback console

---

## 🏗️ System Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│         Login → Dashboard → Device Details → Control         │
│              TypeScript + Vite + Tailwind CSS               │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────────┐
│                   Backend (Spring Boot)                      │
│          Auth → Device Management → Automation Rules        │
│              Java 17+ + PostgreSQL + JWT                    │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP POST
┌────────────────────▼────────────────────────────────────────┐
│              IoT Edge (ESP32 + Arduino)                      │
│    Sensors → WiFi → Backend | Serial → Arduino Console     │
│         ESP32-DevKitC + Arduino Uno + Relay Module         │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS | Web UI |
| **Backend** | Spring Boot 3.x, Spring Data JPA, PostgreSQL | API Server |
| **Authentication** | JWT (JSON Web Tokens) | Secure Access |
| **IoT** | ESP32, Arduino Uno, TM1637 Display | Hardware |
| **Communication** | HTTP REST, Serial UART | Data Transfer |
| **Build** | Maven, npm | Compilation |

---

## 📥 Installation

### Prerequisites

- **Java 17+** (for backend)
- **Node.js 16+** and npm (for frontend)
- **PostgreSQL 12+** (or use H2 for development)
- **Arduino IDE 1.8.x+** (for ESP32 programming)
- **Python 3.8+** (optional, for utilities)

### Backend Setup

```bash
cd backend

# Install dependencies with Maven
mvn clean install

# Configure database (application.properties)
# spring.datasource.url=jdbc:postgresql://localhost:5432/homecanvas
# spring.datasource.username=postgres
# spring.datasource.password=your_password

# Run Spring Boot
mvn spring-boot:run
```

Backend runs on: `http://localhost:8080`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API endpoint (src/services/api.ts)
# baseURL: 'http://localhost:8080/api'

# Run development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

### ESP32 Setup

1. Connect ESP32-DevKitC via USB
2. Install [Arduino IDE](https://www.arduino.cc/en/software)
3. Install ESP32 board in Arduino IDE
4. Install required libraries:
   - WiFi.h (built-in)
   - HTTPClient.h (built-in)
   - ESP32Servo.h
   - TM1637Display.h
5. Upload `firmware/esp32/Esp32_code/Esp32_code.ino`
6. Configure WiFi credentials in the sketch

---

## 🚀 Quick Start

### 1. Start Backend

```bash
cd backend
mvn spring-boot:run
```

✅ API Server ready at `http://localhost:8080`

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

✅ Web Interface ready at `http://localhost:5173`

### 3. Upload ESP32 Firmware

- Open `firmware/esp32/Esp32_code/Esp32_code.ino` in Arduino IDE
- Update WiFi SSID and password
- Click Upload (disconnect Arduino RX wire first to avoid sync errors)
- Open Serial Monitor (115200 baud) to verify

### 4. Access Dashboard

1. Open `http://localhost:5173`
2. Register a new account
3. Log in
4. View ESP32 device appearing in dashboard
5. Monitor sensors in real-time
6. Control devices (servo, LED)

---

## 📖 Usage

### User Workflow

1. **Register/Login**
   - Create account with username and password
   - Professional login page with background imagery
   - Toast notifications for feedback

2. **Device Dashboard**
   - View all connected devices
   - See online/offline status
   - Quick sensor indicators
   - Click device for detailed monitoring

3. **Device Details**
   - Real-time sensor cards (Light, Noise, Motion, Servo)
   - Auto-refreshing data (every 2 seconds)
   - Manual refresh button
   - Control buttons (Servo ON/OFF, LED ON/OFF)

4. **Data History**
   - Telemetry tab: Sensor readings over time
   - Display value matches 4-digit LCD on ESP32
   - Actions tab: Device control audit trail

---

## 🔧 Hardware Setup

### Bill of Materials (BOM)

| Component | Quantity | Purpose |
|-----------|----------|---------|
| ESP32-DevKitC | 1 | Main controller |
| Arduino Uno | 1 | Failover console |
| LDR (photoresistor) | 1 | Light detection |
| PIR Motion Sensor | 1 | Motion detection |
| KY-037 Sound Sensor | 1 | Acoustic monitoring |
| SG90 Servo Motor | 1 | Smart vent control |
| LED (any color) | 1 | Status indicator |
| TM1637 4-Digit Display | 1 | Sensor readout |
| 5V Relay Module | 1 | High-power switching |
| Breadboard & Wires | - | Connections |

### Pinout Configuration

**ESP32 GPIO Mapping:**
- GPIO 13: PIR Motion Sensor
- GPIO 14: Servo Motor (SG90)
- GPIO 17: TX2 (Serial to Arduino)
- GPIO 25: Status LED
- GPIO 26: Display CLK
- GPIO 32: LDR Sensor (INPUT_PULLUP)
- GPIO 33: Display DIO
- GPIO 35: Sound Sensor (AO - Analog Out)

### Wiring Diagram

```
┌─────────────────────────────────────────────────┐
│              ESP32-DevKitC                      │
│  ┌─────────────────────────────────────┐       │
│  │ 3.3V  GND  D13  D14  D25  D26  D32  D33 D35 │
│  │  │     │    │    │    │    │    │    │   │  │
└──┼─────┼────┼────┼────┼────┼────┼────┼───┼──┘
   │     │    │    │    │    │    │    │   │
   │    PIR SERVO LED  CLK  LDR  DIO SOUND
   ├─────────────┬─────────────────────────┐
   │             │                         │
  5V            GND                      Arduino
                                          (RX)
```

---

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "password": "securepassword123",
  "role": "USER"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user123",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "securepassword123"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user123",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Device Management Endpoints

#### Submit Telemetry (from ESP32)
```bash
POST /api/iot/telemetry
Authorization: Bearer {token}
Content-Type: application/json

{
  "macAddress": "A0:B1:C2:D3:E4:F5",
  "timestamp": "2026-04-12T15:30:45",
  "lightLevel": 456,
  "noiseLevel": 125,
  "motionDetected": false
}

Response:
{
  "fanOn": true,
  "ledOn": false,
  "lcdMessage": null
}
```

#### Get All Devices
```bash
GET /api/devices
Authorization: Bearer {token}

Response:
[
  {
    "id": 1,
    "name": "Living Room IoT",
    "macAddress": "A0:B1:C2:D3:E4:F5",
    "onlineStatus": "ONLINE",
    "lastSeen": "2026-04-12T15:30:45",
    "lastTelemetry": {
      "lightLevel": 456,
      "noiseLevel": 125,
      "motionDetected": false
    }
  }
]
```

#### Get Device Details
```bash
GET /api/devices/{id}
Authorization: Bearer {token}

Response:
{
  "id": 1,
  "name": "Living Room IoT",
  "macAddress": "A0:B1:C2:D3:E4:F5",
  "onlineStatus": "ONLINE",
  "lastSeen": "2026-04-12T15:30:45",
  "createdAt": "2026-03-30T10:00:00",
  "owner": {
    "id": 1,
    "username": "user123"
  },
  "lastTelemetry": {
    "id": 100,
    "timestamp": "2026-04-12T15:30:45",
    "lightLevel": 456,
    "noiseLevel": 125,
    "motionDetected": false
  }
}
```

#### Get Telemetry History
```bash
GET /api/devices/{id}/telemetry?page=0&size=20
Authorization: Bearer {token}

Response:
{
  "content": [
    {
      "id": 100,
      "timestamp": "2026-04-12T15:30:45",
      "lightLevel": 456,
      "noiseLevel": 125,
      "motionDetected": false
    }
  ],
  "totalPages": 5,
  "totalElements": 100
}
```

---

## 📂 Project Structure

```
HomeCanvas/
├── backend/                          # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/homecanvas/
│   │   │   │   ├── auth/            # Authentication
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── AuthService.java
│   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   └── User.java
│   │   │   │   └── iot/             # IoT Management
│   │   │   │       ├── DeviceController.java
│   │   │   │       ├── IotController.java
│   │   │   │       ├── DeviceService.java
│   │   │   │       ├── Device.java
│   │   │   │       └── TelemetryPayloadDTO.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   ├── pom.xml
│   └── README.md
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx        # Professional login page
│   │   │   ├── RegisterForm.tsx     # Professional register page
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── DeviceDashboard.tsx  # Device listing with live updates
│   │   │   ├── DeviceDetail.tsx     # Real-time device monitoring
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.ts              # API client
│   │   ├── App.tsx
│   │   ├── index.css               # Tailwind + animations
│   │   └── main.tsx
│   ├── public/
│   │   └── background.jpg          # Login/Register background
│   ├── package.json
│   └── README.md
├── firmware/                         # IoT Firmware
│   ├── esp32/
│   │   └── Esp32_code/
│   │       └── Esp32_code.ino      # Main ESP32 controller
│   └── arduino-uno/
│       └── alert-terminal/
│           └── alert-terminal.ino  # Arduino failover console
├── docs/                            # Documentation
│   ├── background.jpg              # UI background image
│   ├── SETUP.md                    # Setup instructions
│   ├── HARDWARE.md                 # Hardware details
│   ├── API.md                      # API documentation
│   └── TROUBLESHOOTING.md          # Troubleshooting guide
├── SQL.sql                         # Database migrations
├── README.md                       # This file
├── CHANGELOG.md                    # Version history
├── LICENSE                         # MIT License
└── .gitignore
```

---

## ⚙️ Configuration

### Backend Configuration (application.properties)

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/homecanvas
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update

# Server
server.port=8080
server.servlet.context-path=/api

# JWT
jwt.secret=your-super-secret-jwt-key-change-in-production
jwt.expiration=86400000

# Logging
logging.level.root=INFO
logging.level.com.homecanvas=DEBUG
```

### Frontend Configuration (src/services/api.ts)

```typescript
const API = axios.create({
    baseURL: 'http://localhost:8080/api',  // Backend URL
    headers: {
        'Content-Type': 'application/json',
    },
});
```

### ESP32 Configuration (Esp32_code.ino)

```cpp
const char* ssid = "Your-WiFi-SSID";
const char* password = "Your-WiFi-Password";
const String backendUrl = "http://192.168.0.101:8080/api/iot/telemetry";
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

For issues, questions, or suggestions:
- 📧 Email: support@homecanvas.io
- 🐛 GitHub Issues: [Report a Bug](https://github.com/homecanvas/issues)
- 💬 Discussions: [Ask a Question](https://github.com/homecanvas/discussions)

---

## 🙏 Acknowledgments

- Spring Boot documentation
- React.js community
- Arduino community
- Tailwind CSS
- All contributors and testers

---

**Last Updated:** April 12, 2026
**Version:** 1.0.0

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- npm or yarn
- PostgreSQL 12+ (or use H2 for local development)

### Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Core Features

### 1. User Management (Authentication)
- User registration and login
- JWT token-based authentication
- Role-based access control

### 2. Device Management
- Register IoT devices (ESP32)
- Monitor device status (ONLINE/OFFLINE)
- Track last seen timestamp

### 3. Sensor Telemetry
- Ingest light level, motion detection, noise level
- Time-series data storage
- Query sensors by time range

### 4. Automation Rules
- Create conditional rules (IF-THEN logic)
- Multiple conditions with operators (>, <, =, IS_TRUE)
- Trigger device actions (relay on/off)

### 5. Action Logging
- Audit trail of all executed actions
- Track rule triggers and results

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login with JWT

### Devices
- `GET /api/devices` - List user's devices
- `POST /api/devices` - Register new device
- `GET /api/devices/{id}` - Get device details
- `PATCH /api/devices/{id}/status` - Update device status

### Telemetry (IoT)
- `POST /api/telemetry` - Ingest sensor readings from ESP32
- `GET /api/telemetry/latest` - Get latest sensor readings
- `GET /api/telemetry/device/{id}` - Get readings for a device

### Rules
- `GET /api/rules` - List user's rules
- `POST /api/rules` - Create new rule
- `PUT /api/rules/{id}` - Update rule
- `DELETE /api/rules/{id}` - Delete rule

### Action Logs
- `GET /api/actions` - View action history
- `GET /api/actions/{id}` - View rule action logs

## Environment Variables

### Backend (`backend/src/main/resources/application.properties`)
```properties
server.port=8080
spring.datasource.url=jdbc:h2:mem:homecanvas
spring.jpa.hibernate.ddl-auto=update
jwt.secret=your_secret_key_here
jwt.expiration=86400000
app.cors.allowedOrigins=http://localhost:5173
```

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:8080
```

## Database Schema

### Users
- `id` (PK)
- `username` (unique)
- `password_hash`
- `role`
- `created_at`

### Devices
- `id` (PK)
- `owner_id` (FK → users)
- `mac_address` (unique)
- `room_name`
- `status` (ONLINE/OFFLINE)
- `last_seen`

### Sensor Events
- `id` (PK)
- `device_id` (FK → devices)
- `timestamp`
- `light_level`
- `noise_level`
- `motion_detected`

### Rules
- `id` (PK)
- `owner_id` (FK → users)
- `rule_name`
- `is_active`
- `created_at`

### Rule Conditions
- `id` (PK)
- `rule_id` (FK → rules)
- `metric_type` (LIGHT, MOTION, NOISE)
- `operator` (>, <, =)
- `threshold`

### Action Logs
- `id` (PK)
- `rule_id` (FK → rules)
- `target_device_id` (FK → devices)
- `action_taken` (e.g., RELAY_ON)
- `triggered_at`

## ESP32 Integration

### Telemetry Payload
```json
{
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "lightLevel": 750.5,
  "noiseLevel": 45.2,
  "motionDetected": true,
  "timestamp": "2025-06-07T14:30:00"
}
```

### Example Arduino Code
```cpp
void sendTelemetry() {
  HTTPClient http;
  String url = "http://192.168.1.100:8080/api/telemetry";
  
  String payload = "{\"macAddress\":\"" + WiFi.macAddress() + 
                   "\",\"lightLevel\":" + analogRead(LIGHT_PIN) +
                   ",\"noiseLevel\":" + getSoundLevel() +
                   ",\"motionDetected\":" + (digitalRead(MOTION_PIN) ? "true" : "false") +
                   "}";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST(payload);
  http.end();
}
```

## Development Workflow

1. **Feature Branch**: `git checkout -b feature/device-integration`
2. **Atomic Commits**: One file/feature per commit
3. **Pull Request**: Submit PR with clear description
4. **Code Review**: Peer review before merge
5. **Merge to Main**: Fast-forward or squash commits as needed

## Testing

### Backend
```bash
cd backend
mvn test
```

### Frontend
```bash
cd frontend
npm test
```

## Deployment

Deployment instructions coming soon...

## License

MIT License - See [LICENSE](./LICENSE) for details

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

## Authors

- **Project:** HomeCanvas Honours Thesis
- **Academic Year:** 2025-2026

---

**Last Updated**: April 2026
