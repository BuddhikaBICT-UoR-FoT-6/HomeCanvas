import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deviceAPI } from '../services/api';

// TypeScript interfaces for device details, telemetry, and actions
interface SensorReading {
  id: number;
  timestamp: string;
  lightLevel: number;
  noiseLevel: number;
  motionDetected: boolean;
}

interface ActionLog {
  id: number;
  actionType: string;
  triggeredAt: string;
}

interface DeviceDetail {
  id: number;
  name: string;
  macAddress: string;
  onlineStatus: string;
  lastSeen: string;
  createdAt: string;
  lastTelemetry: SensorReading;
  owner: { id: number; username: string };
}

// DeviceDetail component with real-time sensor monitoring and device controls
export default function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [telemetry, setTelemetry] = useState<SensorReading[]>([]);
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'telemetry' | 'actions'>('overview');
  const [fanOn, setFanOn] = useState(false);
  const [ledOn, setLedOn] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [controlLoading, setControlLoading] = useState(false);

  // Constants for thresholds (matching ESP32 firmware)
  const SOUND_THRESHOLD = 100;

  // Auto-refresh telemetry every 2 seconds (matching ESP32 polling)
  useEffect(() => {
    fetchDeviceDetail();
    
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchDeviceDetail();
      }, 2000);
    }
    
    return () => clearInterval(interval);
  }, [id, autoRefresh]);

  const fetchDeviceDetail = async () => {
    try {
      const deviceId = Number(id);
      const [deviceRes, telemetryRes, actionsRes] = await Promise.all([
        deviceAPI.getDevice(deviceId),
        deviceAPI.getTelemetry(deviceId, 0, 10),
        deviceAPI.getActions(deviceId, 0, 10)
      ]);

      setDevice(deviceRes.data);
      setTelemetry(telemetryRes.data.content);
      setActions(actionsRes.data.content);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load device:', err);
      setLoading(false);
    }
  };

  // Send control command to device
  const handleCommand = async (command: string) => {
    try {
      setControlLoading(true);
      const deviceId = Number(id);
      const payload = 
        command === 'fan-on' ? { fanOn: true } : 
        command === 'fan-off' ? { fanOn: false } :
        command === 'led-on' ? { ledOn: true } :
        { ledOn: false };
      
      await deviceAPI.sendCommand(deviceId, payload);
      
      if (command.startsWith('fan')) {
        setFanOn(command === 'fan-on');
      } else {
        setLedOn(command === 'led-on');
      }
      
      await fetchDeviceDetail();
    } catch (err) {
      console.error('Failed to send command:', err);
    } finally {
      setControlLoading(false);
    }
  };

  // Calculate display value based on sound threshold
  const getDisplayValue = (noiseLevel: number) => {
    return noiseLevel > SOUND_THRESHOLD ? noiseLevel : 0;
  };

  if (loading) return <div className="p-4 text-center">Loading device...</div>;
  if (!device) return <div className="p-4 text-center">Device not found</div>;

  const lastReading = device.lastTelemetry;
  const statusColor = device.onlineStatus === 'ONLINE' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <button 
        onClick={() => navigate('/devices')} 
        className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
      >
        ← Back to Devices
      </button>
    
      <h1 className="text-4xl font-bold mb-2">{device.name}</h1>
      <p className="text-gray-600 mb-6">MAC: {device.macAddress}</p>

      {/* Status Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 border-l-4 border-blue-500">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-600">Device Status</p>
            <p className={`font-bold text-lg ${statusColor}`}>{device.onlineStatus}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Update</p>
            <p className="font-semibold">{lastReading ? new Date(lastReading.timestamp).toLocaleTimeString() : 'N/A'}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Auto Refresh</span>
            </label>
          </div>
        </div>
      </div>

      {/* Real-time Sensor Data Grid */}
      {lastReading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Light Level */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border-l-4 border-yellow-400 shadow">
            <p className="text-xs text-gray-700 font-bold">💡 LIGHT LEVEL</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{lastReading.lightLevel}</p>
            <p className="text-xs text-gray-600 mt-2">Range: 0-1023</p>
          </div>

          {/* Noise Level & Display */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-l-4 border-blue-400 shadow">
            <p className="text-xs text-gray-700 font-bold">🔊 NOISE LEVEL</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{lastReading.noiseLevel}</p>
            <p className="text-xs text-gray-600 mt-1">Threshold: {SOUND_THRESHOLD}</p>
            <p className="text-xl font-mono font-bold text-purple-600 mt-2">
              📺 {String(getDisplayValue(lastReading.noiseLevel)).padStart(4, '0')}
            </p>
          </div>

          {/* Motion Detection */}
          <div className={`rounded-lg p-4 border-l-4 shadow ${lastReading.motionDetected ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-400' : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-400'}`}>
            <p className="text-xs text-gray-700 font-bold">🚨 MOTION</p>
            <p className={`text-3xl font-bold mt-2 ${lastReading.motionDetected ? 'text-red-600' : 'text-gray-500'}`}>
              {lastReading.motionDetected ? 'Yes' : 'No'}
            </p>
            <p className="text-xs text-gray-600 mt-2">GPIO 13</p>
          </div>

          {/* Servo Status */}
          <div className={`rounded-lg p-4 border-l-4 shadow ${fanOn ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400' : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-400'}`}>
            <p className="text-xs text-gray-700 font-bold">🌬️ SERVO</p>
            <p className={`text-3xl font-bold mt-2 ${fanOn ? 'text-green-600' : 'text-gray-500'}`}>
              {fanOn ? '90°' : '0°'}
            </p>
            <p className="text-xs text-gray-600 mt-2">{fanOn ? 'OPEN' : 'CLOSED'}</p>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold text-lg mb-4">Device Controls</h3>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => handleCommand(fanOn ? 'fan-off' : 'fan-on')}
            disabled={controlLoading}
            className={`px-6 py-3 rounded font-semibold transition-all ${
              fanOn 
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            } disabled:opacity-50`}
          >
            🌬️ Servo: {fanOn ? 'ON (90°)' : 'OFF (0°)'}
          </button>
          <button
            onClick={() => handleCommand(ledOn ? 'led-off' : 'led-on')}
            disabled={controlLoading}
            className={`px-6 py-3 rounded font-semibold transition-all ${
              ledOn 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-md' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            } disabled:opacity-50`}
          >
            💡 LED: {ledOn ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => fetchDeviceDetail()}
            disabled={controlLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
          >
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-4 bg-white rounded-t-lg shadow-sm">
        {(['overview', 'telemetry', 'actions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-semibold transition-colors ${
              tab === t 
                ? 'border-b-4 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t === 'overview' && '📋 Overview'}
            {t === 'telemetry' && '📊 Telemetry'}
            {t === 'actions' && '⚙️ Actions'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg shadow p-6">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">MAC Address</p>
              <p className="font-mono font-semibold text-lg">{device.macAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`font-semibold text-lg ${statusColor}`}>{device.onlineStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Seen</p>
              <p className="font-semibold">{new Date(device.lastSeen).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-semibold">{new Date(device.createdAt).toLocaleString()}</p>
            </div>
            <div className="col-span-full pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Owner</p>
              <p className="font-semibold">{device.owner.username}</p>
            </div>
          </div>
        )}

        {tab === 'telemetry' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2">
                <tr>
                  <th className="p-3 text-left">Timestamp</th>
                  <th className="p-3 text-left">💡 Light</th>
                  <th className="p-3 text-left">🔊 Noise</th>
                  <th className="p-3 text-left">📺 Display</th>
                  <th className="p-3 text-left">🚨 Motion</th>
                </tr>
              </thead>
              <tbody>
                {telemetry.map((reading, idx) => (
                  <tr key={reading.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-3">{new Date(reading.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 font-semibold text-yellow-600">{reading.lightLevel}</td>
                    <td className="p-3 font-semibold text-blue-600">{reading.noiseLevel}</td>
                    <td className="p-3 font-mono font-bold text-purple-600">{String(getDisplayValue(reading.noiseLevel)).padStart(4, '0')}</td>
                    <td className="p-3">{reading.motionDetected ? '✓ Yes' : '✗ No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {telemetry.length === 0 && <p className="text-center py-6 text-gray-500">No telemetry data yet</p>}
          </div>
        )}

        {tab === 'actions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2">
                <tr>
                  <th className="p-3 text-left">Action Type</th>
                  <th className="p-3 text-left">Triggered At</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action, idx) => (
                  <tr key={action.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-3 font-semibold text-orange-600">{action.actionType}</td>
                    <td className="p-3">{new Date(action.triggeredAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {actions.length === 0 && <p className="text-center py-6 text-gray-500">No actions recorded yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}