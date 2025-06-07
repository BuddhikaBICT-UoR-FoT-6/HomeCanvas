# HomeCanvas - Adaptive Ambient Intelligence System

An intelligent room automation system that monitors environmental sensors and executes custom rules to control physical devices via relay switches.

## System Architecture

### Tech Stack

**Backend:**
- Spring Boot 3.x (Java 17+)
- Spring Web, Spring Data JPA, Spring WebSockets
- PostgreSQL / H2 (development)
- JWT Authentication

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS
- Axios (HTTP client)

**IoT Edge:**
- ESP32 microcontroller
- Sensors: Light, Motion, Noise
- REST API integration

## Project Structure

```
HomeCanvas/
├── backend/              # Spring Boot application
│   ├── src/
│   │   ├── main/java/com/homecanvas/
│   │   │   ├── auth/                # User authentication & registration
│   │   │   └── iot/                 # Device, sensors, rules, actions
│   │   └── resources/
│   ├── pom.xml
│   └── README.md
├── frontend/             # React application
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── pages/
│   ├── package.json
│   └── README.md
├── SQL.sql               # Database migrations
├── .gitignore
├── README.md
├── CHANGELOG.md
└── LICENSE
```

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
