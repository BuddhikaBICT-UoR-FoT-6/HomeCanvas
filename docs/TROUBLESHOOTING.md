# 🐛 Troubleshooting Guide

Common issues and solutions for HomeCanvas Smart Home System

---

## Table of Contents

- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Hardware/ESP32 Issues](#hardwareesp32-issues)
- [Communication Issues](#communication-issues)
- [Database Issues](#database-issues)
- [Performance Issues](#performance-issues)

---

## Backend Issues

### Issue: Backend won't start - "Port 8080 already in use"

**Symptoms:**
```
Address already in use: bind
```

**Solutions:**

1. **Kill process using port:**
   ```bash
   # Windows
   netstat -ano | findstr :8080
   taskkill /PID {PID} /F
   
   # Linux/Mac
   lsof -i :8080
   kill -9 {PID}
   ```

2. **Use different port:**
   ```bash
   mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
   ```

3. **Restart computer:**
   - Sometimes processes don't release ports cleanly

---

### Issue: "Failed to initialize database"

**Symptoms:**
```
org.postgresql.util.PSQLException: Connection refused
```

**Solutions:**

1. **Verify PostgreSQL is running:**
   ```bash
   # Windows
   net start PostgreSQL
   
   # Linux
   sudo systemctl start postgresql
   
   # Mac
   brew services start postgresql
   ```

2. **Check connection string:**
   ```properties
   # application.properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/homecanvas
   spring.datasource.username=homecanvas_user
   spring.datasource.password=secure_password
   ```

3. **Verify database exists:**
   ```bash
   psql -U postgres -l | grep homecanvas
   ```

4. **Recreate database:**
   ```bash
   psql -U postgres
   DROP DATABASE IF EXISTS homecanvas;
   CREATE DATABASE homecanvas;
   GRANT ALL PRIVILEGES ON DATABASE homecanvas TO homecanvas_user;
   ```

---

### Issue: "Could not resolve org.springframework.boot"

**Symptoms:**
```
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin
```

**Solutions:**

1. **Update Maven:**
   ```bash
   mvn -v  # Check version
   mvn -U install  # Force download latest
   ```

2. **Clear Maven cache:**
   ```bash
   # Windows
   rmdir %USERPROFILE%\.m2\repository /s /q
   
   # Linux/Mac
   rm -rf ~/.m2/repository
   ```

3. **Check internet connection**
4. **Update Maven mirrors** in `.m2/settings.xml`

---

### Issue: "Unauthorized" error on API endpoints

**Symptoms:**
```json
{"success": false, "message": "Unauthorized"}
```

**Solutions:**

1. **Verify JWT token is included:**
   ```bash
   curl -H "Authorization: Bearer {token}" http://localhost:8080/api/devices
   ```

2. **Check token expiration:**
   ```bash
   # Token lasts 24 hours by default
   # Login again to get new token
   ```

3. **Verify secret key in application.properties:**
   ```properties
   jwt.secret=your-super-secret-jwt-key-change-in-production
   ```

---

### Issue: "Device not found" error

**Symptoms:**
```json
{"success": false, "message": "Device not found or not owned by user"}
```

**Solutions:**

1. **Verify device MAC address:**
   - Check ESP32 serial monitor
   - Format should be: `A0:B1:C2:D3:E4:F5`

2. **Wait for first telemetry:**
   - Device appears only after first sensor submission
   - ESP32 must connect to WiFi successfully

3. **Check device ownership:**
   - Device owner is the user who registered it
   - Check backend logs for device registration

---

## Frontend Issues

### Issue: "Cannot find module 'axios'"

**Symptoms:**
```
Module not found: Can't resolve 'axios'
```

**Solutions:**

```bash
# Install missing dependency
npm install axios

# Or reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: "Unable to connect to API"

**Symptoms:**
- Dashboard stays loading
- No devices appear
- Toast shows error message

**Solutions:**

1. **Verify backend is running:**
   ```bash
   curl http://localhost:8080/api/devices
   ```

2. **Check API URL in src/services/api.ts:**
   ```typescript
   const API = axios.create({
       baseURL: 'http://localhost:8080/api',  // Correct URL?
   });
   ```

3. **Check CORS configuration** in backend `SecurityConfig.java`

4. **Check browser console** (F12) for detailed error

---

### Issue: "Port 5173 already in use"

**Solutions:**

```bash
# Use different port
npm run dev -- --port 5174

# Or kill existing process
netstat -ano | findstr :5173
taskkill /PID {PID} /F
```

---

### Issue: "Background image not displaying"

**Symptoms:**
- Login/Register pages appear white
- No background image

**Solutions:**

1. **Verify image exists:**
   ```
   frontend/public/background.jpg
   ```

2. **Copy from docs:**
   ```bash
   copy docs\background.jpg frontend\public\background.jpg
   ```

3. **Check file permissions** - ensure readable

4. **Clear browser cache:**
   - F12 → Application → Clear storage
   - Or use Ctrl+Shift+Delete

---

### Issue: "Blank screen after login"

**Symptoms:**
- Successfully login but see nothing
- React component not rendering

**Solutions:**

1. **Check browser console (F12):**
   - Look for JavaScript errors
   - Check network tab for failed API calls

2. **Verify device data is available:**
   ```bash
   curl -H "Authorization: Bearer {token}" http://localhost:8080/api/devices
   ```

3. **Hard refresh page:**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

---

## Hardware/ESP32 Issues

### Issue: "not in sync: resp=0x00" during upload

**Symptoms:**
```
A fatal error occurred: Failed to connect to ESP32: Invalid head of packet (0x00)
A fatal error occurred: Failed to connect to ESP32: Invalid head of packet (0x00)
```

**Solutions:**

1. **Disconnect Arduino RX wire:**
   - RX wire on GPIO 17 interferes with bootloader
   - Disconnect before upload
   - Reconnect after successful upload

2. **Reset ESP32:**
   - Press RST button before uploading
   - Or disconnect USB for 5 seconds

3. **Try different USB cable:**
   - Some cables don't support data transfer

4. **Try different USB port:**
   - Avoid USB 3.0 hubs (use USB 2.0)

---

### Issue: ESP32 shows in device manager but won't upload

**Symptoms:**
```
COM port not recognized
Serial port COM3 not found
```

**Solutions:**

1. **Install CH340 drivers (if needed):**
   - Download from: [Driver Install](https://sparks.gogo.co.nz/ch340.html)
   - Restart computer after install

2. **Select correct COM port:**
   - Tools → Port → Select ESP32 port

3. **Check USB cable:**
   - Must be data cable (not charge-only)

---

### Issue: Serial monitor shows gibberish

**Symptoms:**
```
ÿ¶WÛ;yò¤d@@4¿…èíè
```

**Solutions:**

1. **Set correct baud rate:**
   - **Must be 115200** for ESP32
   - Select in Serial Monitor dropdown

2. **Restart ESP32:**
   - Press RST button
   - Or disconnect USB for 5 seconds

---

### Issue: ESP32 won't connect to WiFi

**Symptoms:**
- Serial monitor shows WiFi connection failures
- "WiFi connecting..." repeating endlessly
- Device doesn't appear in dashboard

**Solutions:**

1. **Verify WiFi credentials:**
   ```cpp
   // In Esp32_code.ino
   const char* ssid = "Buddhika";  // Your WiFi name
   const char* password = "your_password";  // Correct password?
   ```

2. **Check WiFi network:**
   - WiFi network must be 2.4GHz (not 5GHz)
   - Router must be powered on
   - Try restarting router

3. **Check signal strength:**
   - Move ESP32 closer to router
   - Remove obstacles

4. **Restart ESP32:**
   - Press RST button
   - Wait 30 seconds for connection

---

### Issue: No sensor readings in dashboard

**Symptoms:**
- Device appears online but shows all zeros
- Display always shows "0000"

**Solutions:**

1. **Verify sensor connections:**
   - Check GPIO pin assignments match firmware
   - Verify all wires are connected
   - Test with multimeter

2. **Check sensor calibration:**
   - Ensure sensors are properly initialized
   - Test with Serial Monitor output

3. **Verify backend receives telemetry:**
   ```bash
   # Check backend logs
   cat backend/logs/homecanvas.log
   ```

---

### Issue: TM1637 display shows nothing

**Symptoms:**
- Display initialized but blank
- No numbers visible on LCD

**Solutions:**

1. **Check wiring:**
   - CLK → GPIO 26
   - DIO → GPIO 33
   - VCC → 3.3V
   - GND → GND

2. **Verify display is powered:**
   - Multimeter on VCC/GND should read ~3.3V

3. **Check display address:**
   - Serial monitor should show "Display initialized"
   - Check library initialization code

4. **Try display diagnostic sketch:**
   ```cpp
   #include "TM1637Display.h"
   #define CLK 26
   #define DIO 33
   TM1637Display display(CLK, DIO);
   void setup() {
     display.setBrightness(0x0f);
     display.showNumberDec(1234);
   }
   ```

---

### Issue: Motion sensor always triggers

**Symptoms:**
- fanOn is always true
- Motion sensor in dashboard always shows "true"

**Solutions:**

1. **Wait 60 seconds after power:**
   - HC-SR501 needs warm-up time
   - Don't move ESP32 during initialization

2. **Check GPIO 13 connections:**
   - Verify PIR OUT pin → GPIO 13
   - No loose wires

3. **Adjust PIR sensitivity:**
   - Potentiometer on PIR module
   - Turn counterclockwise to reduce sensitivity

---

### Issue: Sound sensor reading = 0 always

**Symptoms:**
- Noise level always 0
- Sound detection not working

**Solutions:**

1. **Verify using AO pin (not DO):**
   - AO = Analog Output (variable 0-1023) ✓
   - DO = Digital Output (only 0/1) ✗

2. **Check GPIO 35 connection:**
   - Verify sound sensor AO → GPIO 35
   - GPIO 35 is ADC-capable ✓

3. **Test sound sensor:**
   ```cpp
   void setup() {
     Serial.begin(115200);
   }
   void loop() {
     int soundLevel = analogRead(35);
     Serial.println(soundLevel);  // Should change with sound
     delay(100);
   }
   ```

---

## Communication Issues

### Issue: Backend receives telemetry but frontend doesn't show

**Symptoms:**
- Backend logs show device data
- Dashboard shows "OFFLINE" device
- No sensor readings in UI

**Solutions:**

1. **Check device online status logic:**
   ```java
   // backend/src/.../Device.java
   // onlineStatus should be set based on lastSeen timestamp
   ```

2. **Check frontend telemetry fetch:**
   ```typescript
   // frontend/src/pages/DeviceDetail.tsx
   // Verify useEffect is calling getLatestTelemetry
   ```

3. **Check API response format:**
   ```bash
   curl http://localhost:8080/api/devices/{id}/telemetry
   # Should return array of sensor readings
   ```

---

### Issue: Frontend can't authenticate

**Symptoms:**
- Login fails with "Invalid credentials"
- Token not saved

**Solutions:**

1. **Verify user exists:**
   ```bash
   psql -U homecanvas_user -d homecanvas
   SELECT * FROM users WHERE username='testuser';
   ```

2. **Check password hashing:**
   - Backend should hash passwords before storage
   - Never store plaintext passwords

3. **Check localStorage:**
   - F12 → Application → Local Storage
   - Should see `token` key after login

---

## Database Issues

### Issue: "Column 'created_at' not found"

**Symptoms:**
```
ERROR: column "created_at" of relation "devices" does not exist
```

**Solutions:**

1. **Run migrations manually:**
   ```bash
   psql -U homecanvas_user -d homecanvas -f SQL.sql
   ```

2. **Check Hibernate DDL setting:**
   ```properties
   spring.jpa.hibernate.ddl-auto=update  # auto-create columns
   ```

3. **Restart backend:**
   - Hibernate should detect schema and update

---

### Issue: "Too many connections"

**Symptoms:**
```
FATAL: remaining connection slots are reserved for non-replication superuser connections
```

**Solutions:**

1. **Check connection pool size:**
   ```properties
   spring.datasource.hikari.maximum-pool-size=10
   ```

2. **Close unused connections:**
   ```bash
   psql -U postgres
   SELECT * FROM pg_stat_activity;
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid();
   ```

3. **Increase PostgreSQL max_connections:**
   - Edit `/etc/postgresql/postgresql.conf`
   - `max_connections = 200`
   - Restart PostgreSQL

---

## Performance Issues

### Issue: Dashboard slow/laggy

**Symptoms:**
- Real-time updates delayed
- UI freezes briefly

**Solutions:**

1. **Reduce auto-refresh frequency:**
   ```typescript
   // In DeviceDetail.tsx
   const REFRESH_INTERVAL = 5000;  // Increase from 2000ms to 5000ms
   ```

2. **Paginate telemetry queries:**
   ```bash
   GET /api/devices/{id}/telemetry?page=0&size=20
   # Only fetch last 20 readings, not all
   ```

3. **Check network latency:**
   ```bash
   # F12 → Network tab
   # Response time should be < 500ms
   ```

---

### Issue: Backend using excessive memory

**Symptoms:**
- Backend crashes after running hours
- Out of memory errors

**Solutions:**

1. **Increase heap size:**
   ```bash
   export JAVA_OPTS="-Xmx512m -Xms256m"
   mvn spring-boot:run
   ```

2. **Add connection pool limits:**
   ```properties
   spring.datasource.hikari.maximum-pool-size=20
   spring.datasource.hikari.minimum-idle=5
   ```

3. **Archive old telemetry:**
   ```sql
   -- Delete readings older than 30 days
   DELETE FROM sensor_events WHERE timestamp < NOW() - INTERVAL '30 days';
   ```

---

## Getting Additional Help

1. **Check logs:**
   ```bash
   # Backend
   cat backend/logs/homecanvas.log
   
   # ESP32 Serial Monitor (115200 baud)
   ```

2. **Enable debug logging:**
   ```properties
   logging.level.com.homecanvas=DEBUG
   logging.level.org.hibernate.SQL=DEBUG
   ```

3. **GitHub Issues:**
   - [HomeCanvas Issues](https://github.com/homecanvas/issues)
   - Include logs and error messages

4. **Contact Support:**
   - Email: support@homecanvas.io
   - Include: OS, Java version, error logs

---

## Checklist for New Setup

- [ ] PostgreSQL running and accessible
- [ ] Backend starts without errors
- [ ] Frontend loads at localhost:5173
- [ ] Can register new account
- [ ] Can login successfully
- [ ] ESP32 shows in device list
- [ ] Sensor readings appear in dashboard
- [ ] Can control devices (servo, LED)
- [ ] Arduino receives alerts (if using)
- [ ] All lights green ✅

If any item fails, follow the troubleshooting guide above.
