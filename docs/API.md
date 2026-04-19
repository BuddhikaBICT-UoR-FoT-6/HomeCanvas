# 📡 API Documentation

Complete REST API reference for HomeCanvas Backend

---

## Base URL

```
http://localhost:8080/api  (Development)
https://api.homecanvas.io  (Production)
```

---

## Authentication

All API endpoints (except `/auth/register` and `/auth/login`) require JWT token in Authorization header:

```
Authorization: Bearer {token}
```

**Token Acquisition:**
1. Register new account via `POST /auth/register`
2. Login via `POST /auth/login`
3. Extract `token` from response
4. Include in all subsequent requests

---

## API Endpoints

### 1. Authentication

#### Register New User

```http
POST /auth/register
Content-Type: application/json

{
  "username": "user123",
  "password": "securepassword123",
  "role": "USER"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user123",
    "role": "USER",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJ1c2VyMTIzIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3MTI5NzMwNDUsImV4cCI6MTcxMzA1OTQ0NX0.abc123...",
    "createdAt": "2026-04-12T15:30:45"
  }
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Username already exists"
}
```

---

#### User Login

```http
POST /auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user123",
    "role": "USER",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "createdAt": "2026-04-12T15:30:45"
  }
}
```

**Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

---

### 2. Device Management

#### Get All Devices

```http
GET /devices
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Living Room IoT",
      "macAddress": "A0:B1:C2:D3:E4:F5",
      "onlineStatus": "ONLINE",
      "lastSeen": "2026-04-12T15:30:45",
      "createdAt": "2026-03-30T10:00:00",
      "lastTelemetry": {
        "id": 100,
        "timestamp": "2026-04-12T15:30:45",
        "lightLevel": 456,
        "noiseLevel": 125,
        "motionDetected": false
      }
    },
    {
      "id": 2,
      "name": "Bedroom Monitor",
      "macAddress": "F5:E4:D3:C2:B1:A0",
      "onlineStatus": "OFFLINE",
      "lastSeen": "2026-04-12T14:20:30",
      "createdAt": "2026-03-28T08:15:00",
      "lastTelemetry": null
    }
  ]
}
```

---

#### Get Device Details

```http
GET /devices/{id}
Authorization: Bearer {token}
```

**Path Parameters:**
- `id` (integer): Device ID

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
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
}
```

**Error (404 Not Found):**
```json
{
  "success": false,
  "message": "Device not found"
}
```

---

#### Get Device Telemetry History

```http
GET /devices/{id}/telemetry?page=0&size=20
Authorization: Bearer {token}
```

**Path Parameters:**
- `id` (integer): Device ID

**Query Parameters:**
- `page` (integer, default=0): Page number (0-indexed)
- `size` (integer, default=20): Records per page (max=100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 100,
        "timestamp": "2026-04-12T15:30:45",
        "lightLevel": 456,
        "noiseLevel": 125,
        "motionDetected": false
      },
      {
        "id": 99,
        "timestamp": "2026-04-12T15:30:43",
        "lightLevel": 455,
        "noiseLevel": 120,
        "motionDetected": false
      }
    ],
    "totalPages": 15,
    "totalElements": 290,
    "currentPage": 0,
    "pageSize": 20
  }
}
```

---

#### Get Device Action History

```http
GET /devices/{id}/actions?page=0&size=20
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (integer, default=0): Page number
- `size` (integer, default=20): Records per page

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 50,
        "action": "fanOn",
        "params": "{\"value\": true}",
        "executedAt": "2026-04-12T15:28:12",
        "status": "SUCCESS"
      },
      {
        "id": 49,
        "action": "ledOn",
        "params": "{\"value\": false}",
        "executedAt": "2026-04-12T15:25:45",
        "status": "SUCCESS"
      }
    ],
    "totalPages": 5,
    "totalElements": 92,
    "currentPage": 0,
    "pageSize": 20
  }
}
```

---

### 3. IoT Endpoints

#### Submit Device Telemetry

```http
POST /iot/telemetry
Content-Type: application/json

{
  "macAddress": "A0:B1:C2:D3:E4:F5",
  "timestamp": "2026-04-12T15:30:45",
  "lightLevel": 456,
  "noiseLevel": 125,
  "motionDetected": false
}
```

**Request Fields:**
- `macAddress` (string): Device MAC address (format: "XX:XX:XX:XX:XX:XX")
- `timestamp` (string): ISO 8601 timestamp
- `lightLevel` (integer): 0-4095 (10-bit ADC)
- `noiseLevel` (integer): 0-1023 (10-bit ADC)
- `motionDetected` (boolean): true/false

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "deviceId": 1,
    "fanOn": true,
    "ledOn": false,
    "lcdMessage": null
  }
}
```

**Response with Sound Alert (200 OK):**
```json
{
  "success": true,
  "data": {
    "deviceId": 1,
    "fanOn": false,
    "ledOn": false,
    "lcdMessage": "sound: 125"
  }
}
```

**Automation Rules Applied:**
- If `motionDetected == true` → `fanOn = true`
- If `noiseLevel > 100` → Display value on LCD (else 0000)
- If `lightLevel < 300` → `ledOn = true`

---

#### Send Command to Device

```http
POST /devices/{id}/command
Authorization: Bearer {token}
Content-Type: application/json

{
  "command": "fanOn",
  "params": {
    "value": true
  }
}
```

**Path Parameters:**
- `id` (integer): Device ID

**Request Body:**
- `command` (string): "fanOn" or "ledOn"
- `params` (object): Command parameters

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "commandId": 50,
    "deviceId": 1,
    "command": "fanOn",
    "status": "QUEUED",
    "createdAt": "2026-04-12T15:32:20"
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "timestamp": "2026-04-12T15:30:45"
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Device fetched successfully |
| 201 | Created | User registered |
| 400 | Bad Request | Invalid JSON format |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Device not owned by user |
| 404 | Not Found | Device/User doesn't exist |
| 409 | Conflict | Username already exists |
| 500 | Server Error | Database connection failed |

---

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Telemetry Endpoint**: 1000 requests per minute
- **Auth Endpoints**: 10 requests per minute

Headers included in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1712973345
```

---

## Request/Response Examples

### cURL

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user123",
    "password": "securepassword",
    "role": "USER"
  }'

# Get Devices
curl -X GET http://localhost:8080/api/devices \
  -H "Authorization: Bearer {token}"

# Submit Telemetry
curl -X POST http://localhost:8080/api/iot/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "macAddress": "A0:B1:C2:D3:E4:F5",
    "timestamp": "2026-04-12T15:30:45",
    "lightLevel": 456,
    "noiseLevel": 125,
    "motionDetected": false
  }'
```

### JavaScript/Fetch

```javascript
// Login
const response = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'user123',
    password: 'securepassword'
  })
});

const data = await response.json();
const token = data.data.token;

// Get Devices
const devicesResponse = await fetch('http://localhost:8080/api/devices', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const devices = await devicesResponse.json();
```

### Python

```python
import requests

BASE_URL = 'http://localhost:8080/api'

# Login
response = requests.post(f'{BASE_URL}/auth/login', json={
    'username': 'user123',
    'password': 'securepassword'
})
token = response.json()['data']['token']

# Get Devices
headers = {'Authorization': f'Bearer {token}'}
devices = requests.get(f'{BASE_URL}/devices', headers=headers)
print(devices.json())
```

---

## WebSocket (Future Enhancement)

Real-time updates could be implemented via WebSocket:
```
ws://localhost:8080/api/devices/{id}/stream?token={token}

Event: {
  "type": "TELEMETRY_UPDATE",
  "data": { ... }
}
```

---

## Changelog

**v1.0.0 (2026-04-12)**
- Initial API release
- Device management endpoints
- Telemetry ingestion
- Command execution
- Pagination support

**v0.1.0 (2026-03-30)**
- MVP endpoints
