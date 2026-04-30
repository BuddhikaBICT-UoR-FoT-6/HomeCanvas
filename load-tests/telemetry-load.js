import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '10s', target: 0 },  // Ramp down
  ],
};

const BASE_URL = 'http://localhost:8080/api';

export default function () {
  // 1. Guest Login
  const loginRes = http.post(`${BASE_URL}/auth/demo`);
  
  check(loginRes, {
    'logged in successfully': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });

  const token = loginRes.json('token');
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // 2. Fetch Devices
  const devicesRes = http.get(`${BASE_URL}/devices`, params);
  check(devicesRes, {
    'fetched devices': (r) => r.status === 200,
  });

  // 3. Simulate Dashboard Polling
  const devices = devicesRes.json();
  if (devices && devices.length > 0) {
    const deviceId = devices[0].id;
    
    // Poll telemetry
    const telemetryRes = http.get(`${BASE_URL}/devices/${deviceId}/telemetry`, params);
    check(telemetryRes, {
      'telemetry fetched': (r) => r.status === 200,
    });

    // Ask AI (Load test the Gemini endpoint)
    const aiRes = http.get(`${BASE_URL}/ai/predict-action/${deviceId}`, params);
    check(aiRes, {
      'ai prediction fetched': (r) => r.status === 200,
    });
  }

  sleep(1);
}
