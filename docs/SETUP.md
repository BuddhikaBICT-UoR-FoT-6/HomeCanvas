# ⚙️ Setup Guide

Complete step-by-step setup instructions for HomeCanvas

---

## Prerequisites

Before starting, ensure you have installed:

- **Java 17+** 
  - Download: [oracle.com/java](https://www.oracle.com/java/technologies/downloads/)
  - Verify: `java -version`

- **Node.js 16+**
  - Download: [nodejs.org](https://nodejs.org/)
  - Verify: `node -v` and `npm -v`

- **PostgreSQL 12+** (or H2 for development)
  - Download: [postgresql.org](https://www.postgresql.org/download/)
  - Verify: `psql --version`

- **Arduino IDE 1.8.x+**
  - Download: [arduino.cc](https://www.arduino.cc/en/software)

- **Git**
  - Download: [git-scm.com](https://git-scm.com/)
  - Verify: `git --version`

---

## Backend Setup

### 1. Clone Repository

```bash
git clone https://github.com/homecanvas/homecanvas.git
cd homecanvas
```

### 2. Database Setup

#### Option A: PostgreSQL (Production)

```bash
# Create database
psql -U postgres -c "CREATE DATABASE homecanvas;"

# Create user
psql -U postgres -c "CREATE USER homecanvas_user WITH PASSWORD 'secure_password';"

# Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE homecanvas TO homecanvas_user;"
```

#### Option B: H2 (Development - No Setup Needed)

H2 database runs in-memory automatically.

### 3. Backend Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
# For PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/homecanvas
spring.datasource.username=homecanvas_user
spring.datasource.password=secure_password
spring.datasource.driver-class-name=org.postgresql.Driver

# For H2 Development
spring.datasource.url=jdbc:h2:mem:homecanvas
spring.h2.console.enabled=true

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQL13Dialect

# Server
server.port=8080
server.servlet.context-path=/api

# JWT Configuration
jwt.secret=your-super-secret-jwt-key-change-in-production
jwt.expiration=86400000

# Logging
logging.level.root=INFO
logging.level.com.homecanvas=DEBUG
```

### 4. Build Backend

```bash
cd backend
mvn clean install
```

Expected output:
```
BUILD SUCCESS
Total time: XX.XXs
```

### 5. Run Backend

```bash
mvn spring-boot:run
```

Expected output:
```
Started HomeCanvasAuthApplication in X.XXs (JVM running for X.XXs)
```

✅ Backend API ready: `http://localhost:8080/api`

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

Expected output:
```
added XXX packages in X.XXs
```

### 2. Frontend Configuration

Edit `frontend/src/services/api.ts`:

```typescript
const API = axios.create({
    baseURL: 'http://localhost:8080/api',  // Backend URL
    headers: {
        'Content-Type': 'application/json',
    },
});
```

### 3. Run Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

✅ Frontend ready: `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

Outputs to `frontend/dist/` directory.

---

## ESP32 Firmware Setup

### 1. Install Arduino IDE

Download from: [arduino.cc/en/software](https://www.arduino.cc/en/software)

### 2. Add ESP32 Board

1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional boards manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click OK
5. Go to **Tools → Board → Boards Manager**
6. Search for "ESP32"
7. Install "ESP32 by Espressif Systems"

### 3. Install Libraries

1. Go to **Sketch → Include Library → Manage Libraries**
2. Search and install:
   - `ESP32Servo` by Kevin Harrington
   - `TM1637Display` by Avishay Orpaz

### 4. Configure Sketch

Edit `firmware/esp32/Esp32_code/Esp32_code.ino`:

```cpp
// WiFi Configuration
const char* ssid = "Your-WiFi-SSID";
const char* password = "Your-WiFi-Password";

// Backend Configuration
const String backendUrl = "http://192.168.0.101:8080/api/iot/telemetry";

// Timezone Configuration
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 5*3600 + 30*60;  // IST UTC+5:30
```

### 5. Upload Firmware

1. Connect ESP32 via USB cable
2. Go to **Tools → Port** and select the COM port
3. Select **Tools → Board → ESP32 Dev Module**
4. Select **Tools → Upload Speed → 115200**
5. **Important**: Disconnect Arduino RX wire from GPIO 17 before uploading
6. Click **Upload** button
7. Wait for "Hard resetting via RTS pin..." message
8. Reconnect Arduino RX wire after upload completes

### 6. Verify Installation

1. Open **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. Reset ESP32 (press RST button)
4. You should see WiFi connection logs

---

## Arduino Setup (Optional)

For security alert console:

1. Open `firmware/arduino-uno/alert-terminal/alert-terminal.ino` in Arduino IDE
2. Select **Tools → Board → Arduino Uno**
3. Select appropriate COM port
4. Upload sketch
5. Connect RX pin to ESP32 GPIO 17 (TX2)

---

## First Run Checklist

- [ ] Backend running on `http://localhost:8080/api`
- [ ] Frontend running on `http://localhost:5173`
- [ ] Database created and accessible
- [ ] ESP32 connected to WiFi
- [ ] Arduino (if used) receiving serial data

---

## Accessing the Application

1. Open browser: `http://localhost:5173`
2. Click **"Sign up here"** or Register
3. Create account:
   - Username: `testuser`
   - Password: `password123`
   - Role: `Regular User`
4. Click **"Create Account"**
5. Login with credentials
6. Wait for ESP32 to send first telemetry (appears in device list)
7. Click device to view real-time monitoring

---

## Troubleshooting

### Backend Issues

**Port 8080 already in use:**
```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill process (Windows)
taskkill /PID {PID} /F
```

**Database connection error:**
```
Check connection string in application.properties
Verify PostgreSQL is running
Verify credentials are correct
```

**Maven build fails:**
```bash
# Clear Maven cache
mvn clean
mvn install -U
```

### Frontend Issues

**Port 5173 already in use:**
```bash
npm run dev -- --port 5174
```

**API not responding:**
- Verify backend is running on port 8080
- Check `src/services/api.ts` baseURL setting
- Check browser console for CORS errors

### ESP32 Issues

**Upload fails - "not in sync: resp=0x00":**
- Disconnect Arduino RX wire (GPIO 17 pin)
- Try again
- Reconnect after successful upload

**No telemetry in dashboard:**
- Check ESP32 serial monitor for WiFi connection
- Verify backend URL in sketch
- Verify ESP32 IP can reach backend IP
- Check backend API logs

**Display shows nothing:**
- Verify TM1637 wiring (CLK GPIO 26, DIO GPIO 33)
- Check I2C pull-up resistors (4.7kΩ recommended)
- Verify library version

---

## Development Tips

### Backend
- Use **application-dev.properties** for development-specific config
- Enable SQL logging: `logging.level.org.hibernate.SQL=DEBUG`
- Use Postman to test API endpoints

### Frontend
- Use React DevTools browser extension
- Enable Redux DevTools if using Redux
- Check browser console for errors
- Use `npm run preview` to test production build locally

### ESP32
- Use Serial Monitor (115200 baud) for debugging
- Add `Serial.println()` statements for logging
- Use `#define DEBUG` for conditional debug output

---

## Next Steps

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
2. Read [API.md](./API.md) for API reference
3. Read [HARDWARE.md](./HARDWARE.md) for hardware setup
4. Customize automation rules in backend
5. Deploy to production

---

## Getting Help

- Check [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Review logs: `backend/logs/homecanvas.log`
- Search GitHub Issues: [homecanvas/issues](https://github.com/homecanvas/issues)
