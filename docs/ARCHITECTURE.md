# 🏗️ System Architecture

## Overview

HomeCanvas is a three-tier smart home automation system designed with scalability, security, and real-time responsiveness in mind.

---

## Architecture Layers

### 1. **Edge Layer (ESP32 + Arduino)**

**Purpose:** Hardware sensor data collection and device actuation

**Components:**
- ESP32-DevKitC microcontroller (240MHz dual-core, WiFi)
- Arduino Uno (fallback alert console)
- Sensors: Light (LDR), Motion (PIR), Sound (KY-037)
- Actuators: Servo motor, LED, Relay module
- Display: TM1637 4-digit display

**Responsibilities:**
- Poll sensors every 2 seconds
- Generate ISO 8601 timestamps (NTP synchronized)
- Send telemetry via HTTPS POST to backend
- Receive commands from backend
- Control physical devices based on commands
- Display real-time noise level on LCD

**Communication:**
- Outbound: WiFi HTTP POST to backend
- Inbound: Backend HTTP POST commands
- Fallback: Serial UART to Arduino (9600 baud)

---

### 2. **Application Layer (Spring Boot Backend)**

**Purpose:** Business logic, device management, automation rules

**Components:**
- Spring Boot 3.x REST API
- Spring Data JPA (database persistence)
- PostgreSQL database
- JWT authentication
- Automation rules engine

**Key Services:**

#### Device Management Service
- Auto-registers new devices by MAC address
- Tracks device online/offline status
- Stores device metadata
- Manages device ownership

#### Telemetry Service
- Validates incoming sensor data (timestamp format)
- Stores time-series readings
- Provides paginated history queries
- Calculates aggregated metrics

#### Automation Engine
```
Rule 1: if (motionDetected == true) → activate fanOn
Rule 2: if (noiseLevel > SOUND_THRESHOLD) → display value OR 0000
Rule 3: if (lightLevel < LIGHT_THRESHOLD) → activate ledOn
```

#### Command Processor
- Receives control requests from frontend
- Sends device commands to ESP32
- Logs action history
- Returns command status

**Database Schema:**
```
Users (id, username, password_hash, role, createdAt)
Devices (id, name, macAddress, owner_id, onlineStatus, lastSeen, createdAt)
SensorEvents (id, device_id, timestamp, lightLevel, noiseLevel, motionDetected)
ActionLogs (id, device_id, action, params, executedAt)
```

**Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/iot/telemetry` - Sensor data ingestion
- `GET /api/devices` - Device listing
- `GET /api/devices/{id}` - Device details
- `POST /api/devices/{id}/command` - Send command to device

---

### 3. **Presentation Layer (React Frontend)**

**Purpose:** User interface, real-time dashboard, device control

**Components:**
- React 18 with TypeScript
- Vite build tool
- Tailwind CSS styling
- Axios HTTP client with JWT interceptors

**Pages:**

#### Authentication Pages
- **LoginForm**: Professional login with background image, toast notifications
- **RegisterForm**: Account creation with enhanced validation

#### Device Dashboard
- Lists all user devices
- Shows online/offline status
- Displays quick sensor indicators
- Auto-refreshes every 3 seconds

#### Device Details
- Real-time sensor monitoring (Light, Noise, Motion, Servo)
- 4-digit display value matching LCD
- Manual/device control buttons
- 3 tabs: Overview, Telemetry, Actions
- Auto-refresh every 2 seconds

**State Management:**
- Local component state (React useState)
- Async data fetching (useEffect + Axios)
- Authentication via JWT tokens (localStorage)

---

## Data Flow

### Telemetry Submission Flow

```
ESP32 (every 2 seconds)
  ↓
1. Read sensors
   - Light: analogRead(GPIO 32) → 0-4095
   - Motion: digitalRead(GPIO 13) → 0/1
   - Sound: analogRead(GPIO 35) → 0-1023
  ↓
2. Get NTP time → ISO 8601 format
  ↓
3. POST to Backend
   POST /api/iot/telemetry
   {
     "macAddress": "A0:B1:C2:D3:E4:F5",
     "timestamp": "2026-04-12T15:30:45",
     "lightLevel": 456,
     "noiseLevel": 125,
     "motionDetected": false
   }
  ↓
Backend
  ↓
4. Validate timestamp format
  ↓
5. Find/create device by MAC address
  ↓
6. Store in SensorEvents table
  ↓
7. Evaluate automation rules:
   - if (motionDetected) → set fanOn = true
   - if (noiseLevel > 100) → display value
   - if (lightLevel < 300) → set ledOn = true
  ↓
8. Return response
   {
     "fanOn": true,
     "ledOn": false,
     "lcdMessage": "sound: 125"
   }
  ↓
ESP32
  ↓
9. Execute commands:
   - if (fanOn) → servo.write(90)
   - if (ledOn) → digitalWrite(GPIO 25, HIGH)
   - Display message on TM1637
```

### Device Control Flow

```
User (Frontend)
  ↓
Clicks "Servo ON" button
  ↓
Frontend
  ↓
POST /api/devices/{id}/command
{
  "command": "fanOn",
  "params": { "value": true }
}
  ↓
Backend
  ↓
1. Validate JWT token
  ↓
2. Verify device ownership
  ↓
3. Log action to ActionLogs table
  ↓
4. Send command to ESP32 (next telemetry response)
  ↓
5. Return success/error to frontend
  ↓
Frontend
  ↓
Show toast notification: "✅ Servo turned ON"
```

---

## Security Model

### Authentication & Authorization

**JWT Token Flow:**
1. User login with credentials
2. Backend validates username/password
3. Backend generates JWT token (exp: 24 hours)
4. Frontend stores token in localStorage
5. Axios interceptor adds Authorization header to all requests
6. Backend validates token signature and expiration
7. Request denied if token invalid/expired

**JWT Payload:**
```json
{
  "sub": "1",
  "username": "user123",
  "role": "USER",
  "iat": 1712973045,
  "exp": 1713059445
}
```

### Device Ownership Validation

- Device owner: User who first registered the device
- Command requests: Backend verifies device ownership
- Telemetry read: Users can only see their own devices' data

### Secure Communication

- ESP32 → Backend: HTTPS (TLS 1.2+)
- Frontend → Backend: HTTPS (in production)
- CORS enabled for frontend domain only

---

## Deployment Architecture

### Development Environment
```
Laptop/Desktop
├── Backend: localhost:8080
├── Frontend: localhost:5173
├── Database: PostgreSQL (localhost:5432 or H2)
└── ESP32: WiFi connected (192.168.0.102)
```

### Production Environment (Recommended)
```
Cloud Infrastructure
├── Frontend: CDN + Web Server (nginx)
├── Backend: Container (Docker) + Load Balancer
├── Database: Managed PostgreSQL
└── IoT Device: Secured WiFi + VPN/TLS

ESP32 → Backend API
```

---

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Telemetry Interval | 2 seconds | ESP32 polling rate |
| Display Refresh | 2 seconds | React auto-refresh |
| API Response Time | <500ms | Typical backend response |
| Database Query | <100ms | Indexed queries |
| JWT Expiry | 24 hours | Token lifetime |
| Device Limit | 1000+ | Per user (configurable) |
| Sensor Resolution | 10-bit (1024) | ADC resolution |

---

## Scalability Considerations

### Horizontal Scaling
- Multiple backend instances behind load balancer
- Database connection pooling (HikariCP)
- Stateless design (JWT tokens)

### Database Optimization
- Index on device.macAddress
- Index on sensorEvents.deviceId
- Partition sensorEvents by date (for old data)
- Archive old telemetry to data warehouse

### Frontend Optimization
- Code splitting via Vite
- Lazy loading of device detail pages
- Real-time updates via polling (could migrate to WebSocket)
- Service Worker for offline support

---

## Monitoring & Observability

**Recommended Tools:**
- Backend Logging: SLF4J + Logback
- Metrics: Prometheus + Grafana
- Tracing: Jaeger/OpenTelemetry
- Frontend Analytics: Sentry for error tracking
- Infrastructure: Kubernetes + Prometheus

---

## References

- [Spring Boot Architecture Best Practices](https://spring.io/projects/spring-boot)
- [React Performance Optimization](https://react.dev/reference/react/memo)
- [JWT Token Security](https://tools.ietf.org/html/rfc7519)
- [ESP32 Hardware Reference](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)
