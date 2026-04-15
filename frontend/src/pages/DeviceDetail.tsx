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
  lastSeen: string | null;
  createdAt: string;
  lastTelemetry: SensorReading | null;
  owner: { id: number; username: string } | null;
  lastCommandFanOn: boolean | null;
  lastCommandLedOn: boolean | null;
  lastCommandLcdMessage: string | null;
  lastCommandServoAngle: number | null;
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
  const [displayValue, setDisplayValue] = useState('0000');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [controlLoading, setControlLoading] = useState(false);
  const [displaySuccess, setDisplaySuccess] = useState(false);

  // Constants for thresholds (matching ESP32 firmware)
  const SOUND_THRESHOLD = 100;
  const LIGHT_THRESHOLD = 2000;

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
      
      // Synchronize local control state with backend overrides
      const dev = deviceRes.data;
      if (dev.lastCommandFanOn !== null) {
        setFanOn(dev.lastCommandFanOn);
      } else if (dev.lastTelemetry) {
        setFanOn(dev.lastTelemetry.motionDetected);
      }
      
      if (dev.lastCommandLedOn !== null) {
        setLedOn(dev.lastCommandLedOn);
      } else if (dev.lastTelemetry) {
        setLedOn(dev.lastTelemetry.lightLevel < LIGHT_THRESHOLD);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load device:', err);
      setLoading(false);
    }
  };

  // Send control command to device (servo, LED, or 4-digit display)
  const handleCommand = async (command: string) => {
    try {
      setControlLoading(true);
      const deviceId = Number(id);
      
      let payload = {};
      if (command === 'fan-on') payload = { fanOn: true };
      else if (command === 'fan-off') payload = { fanOn: false };
      else if (command === 'fan-auto') payload = { resetFanAuto: true };
      else if (command === 'led-on') payload = { ledOn: true };
      else if (command === 'led-off') payload = { ledOn: false };
      else if (command === 'led-auto') payload = { resetLedAuto: true };
      
      await deviceAPI.sendCommand(deviceId, payload);
      
      if (command.startsWith('fan')) {
        if (command === 'fan-auto') {
          // Optimization: refresh to see new auto state
          setTimeout(() => fetchDeviceDetail(), 500);
        } else {
          setFanOn(command === 'fan-on');
        }
      } else {
        if (command === 'led-auto') {
          setTimeout(() => fetchDeviceDetail(), 500);
        } else {
          setLedOn(command === 'led-on');
        }
      }
      
      await fetchDeviceDetail();
    } catch (err) {
      console.error('Failed to send command:', err);
    } finally {
      setControlLoading(false);
    }
  };

  // Send value to the 4-digit 7-segment display (via lcdMessage field)
  const handleSendDisplay = async () => {
    try {
      setControlLoading(true);
      const deviceId = Number(id);
      const padded = displayValue.replace(/[^0-9]/g, '').padStart(4, '0').slice(-4);
      await deviceAPI.sendCommand(deviceId, { lcdMessage: padded });
      setDisplaySuccess(true);
      setTimeout(() => setDisplaySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to send display command:', err);
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
  const statusColor = device.onlineStatus?.toLowerCase() === 'online' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="hc-page container mx-auto max-w-6xl p-4">
      <button 
        onClick={() => navigate('/devices')} 
        className="mb-4 rounded-xl border border-slate-300/60 bg-white/70 px-4 py-2 transition-colors hover:bg-white dark:border-slate-600 dark:bg-slate-900/70 dark:hover:bg-slate-900"
      >
        ← Back to Devices
      </button>
    
      <h1 className="text-4xl font-bold mb-2">{device.name}</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-300">MAC: {device.macAddress}</p>

      {/* Status Bar */}
      <div className="hc-card mb-6 border-l-4 border-cyan-500 p-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-300">Device Status</p>
            <p className={`font-bold text-lg ${statusColor}`}>{device.onlineStatus}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-300">Last Update</p>
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

      {/* Control Panel */}
      <div className="hc-card mb-6 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">Device Controls</h3>
          <button
            onClick={() => fetchDeviceDetail()}
            disabled={controlLoading}
            className="flex items-center gap-2 rounded-xl bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* LED Control */}
          <div className={`rounded-2xl border-2 p-4 transition-all duration-300 ${
            ledOn 
              ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20' 
              : 'border-slate-300/40 dark:border-slate-700/60 bg-slate-100/60 dark:bg-slate-800/40'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-2xl transition-all duration-300 ${ledOn ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]' : 'opacity-40'}`}>💡</span>
                <span className="font-bold text-sm">LED</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                ledOn ? 'bg-yellow-400/30 text-yellow-700 dark:text-yellow-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}>{ledOn ? 'ON' : 'OFF'}</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCommand(ledOn ? 'led-off' : 'led-on')}
                disabled={controlLoading}
                className={`w-full rounded-xl py-2.5 font-bold text-sm transition-all duration-200 ${
                  ledOn 
                    ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 shadow-md' 
                    : 'bg-slate-300/80 text-slate-700 hover:bg-slate-400/80 dark:bg-slate-700 dark:text-slate-200'
                } disabled:opacity-50 hover:scale-[1.02]`}
              >
                {ledOn ? 'Turn OFF' : 'Turn ON'}
              </button>
              <button
                onClick={() => handleCommand('led-auto')}
                disabled={controlLoading}
                className="w-full rounded-xl py-1.5 font-semibold text-xs border border-yellow-400/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-400/10 transition-all"
              >
                ✨ Set to Auto
              </button>
            </div>
          </div>

          {/* Servo Control */}
          <div className={`rounded-2xl border-2 p-4 transition-all duration-300 ${
            fanOn 
              ? 'border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-400/20' 
              : 'border-slate-300/40 dark:border-slate-700/60 bg-slate-100/60 dark:bg-slate-800/40'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-2xl transition-all duration-300 ${fanOn ? 'animate-spin' : 'opacity-40'}`} style={fanOn ? {animationDuration:'2s'} : {}}>⚙️</span>
                <span className="font-bold text-sm">Servo</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                fanOn ? 'bg-emerald-400/30 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}>{fanOn ? '90°' : '0°'}</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCommand(fanOn ? 'fan-off' : 'fan-on')}
                disabled={controlLoading}
                className={`w-full rounded-xl py-2.5 font-bold text-sm transition-all duration-200 ${
                  fanOn 
                    ? 'bg-emerald-400 text-emerald-900 hover:bg-emerald-500 shadow-md' 
                    : 'bg-slate-300/80 text-slate-700 hover:bg-slate-400/80 dark:bg-slate-700 dark:text-slate-200'
                } disabled:opacity-50 hover:scale-[1.02]`}
              >
                {fanOn ? 'Set to 0°' : 'Set to 90°'}
              </button>
              <button
                onClick={() => handleCommand('fan-auto')}
                disabled={controlLoading}
                className="w-full rounded-xl py-1.5 font-semibold text-xs border border-emerald-400/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-400/10 transition-all"
              >
                ✨ Set to Auto
              </button>
            </div>
          </div>

          {/* 4-Digit Display Control */}
          <div className="rounded-2xl border-2 border-purple-400/40 bg-purple-500/5 dark:bg-purple-900/10 p-4 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📺</span>
              <span className="font-bold text-sm">4-Digit Display</span>
            </div>
            {/* 7-segment style display preview */}
            <div className="mb-3 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-center">
              <span className="font-mono text-3xl font-bold tracking-widest text-red-400" style={{textShadow:'0 0 8px rgba(248,113,113,0.7)'}}>
                {displayValue.replace(/[^0-9]/g,'').padStart(4,'0').slice(-4)}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                value={displayValue}
                onChange={e => setDisplayValue(e.target.value.replace(/[^0-9]/g,'').slice(0,4))}
                placeholder="0000"
                className="flex-1 rounded-xl border border-slate-300/60 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono font-bold text-purple-600 dark:text-purple-400 outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                onClick={handleSendDisplay}
                disabled={controlLoading}
                className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50 shadow-md ${
                  displaySuccess ? 'bg-emerald-500 shadow-emerald-400/30' : 'bg-purple-500 hover:bg-purple-600 shadow-purple-400/20'
                }`}
              >
                {displaySuccess ? '✓' : 'Send'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs */}
      <div className="hc-card mb-4 flex gap-4 rounded-b-none border-b border-slate-300/40 bg-transparent shadow-sm dark:border-slate-700/60">
        {(['overview', 'telemetry', 'actions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 font-semibold transition-colors ${
              tab === t 
                ? 'border-b-4 border-cyan-500 text-cyan-500' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100'
            }`}
          >
            {t === 'overview' && '📋 Overview'}
            {t === 'telemetry' && '📊 Telemetry'}
            {t === 'actions' && '⚙️ Actions'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="hc-card rounded-t-none p-6">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-300">MAC Address</p>
              <p className="font-mono font-semibold text-lg">{device.macAddress}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-300">Status</p>
              <p className={`font-semibold text-lg ${statusColor}`}>{device.onlineStatus}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-300">Last Seen</p>
              <p className="font-semibold">{device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-300">Created</p>
              <p className="font-semibold">{new Date(device.createdAt).toLocaleString()}</p>
            </div>
            <div className="col-span-full pt-4 border-t">
              <p className="mb-2 text-sm text-slate-500 dark:text-slate-300">Owner</p>
              <p className="font-semibold">{device.owner?.username ?? 'Unclaimed device'}</p>
            </div>
          </div>
        )}

        {tab === 'telemetry' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-slate-300/50 bg-slate-200/70 dark:border-slate-700/60 dark:bg-slate-800/80">
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
                  <tr key={reading.id} className={idx % 2 === 0 ? 'bg-slate-100/70 dark:bg-slate-900/70' : 'bg-white/80 dark:bg-slate-800/70'}>
                    <td className="p-3">{new Date(reading.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 font-semibold text-yellow-600">{reading.lightLevel}</td>
                    <td className="p-3 font-semibold text-blue-600">{reading.noiseLevel}</td>
                    <td className="p-3 font-mono font-bold text-purple-600">{String(getDisplayValue(reading.noiseLevel)).padStart(4, '0')}</td>
                    <td className="p-3">{reading.motionDetected ? '✓ Yes' : '✗ No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {telemetry.length === 0 && <p className="py-6 text-center text-slate-500 dark:text-slate-400">No telemetry data yet</p>}
          </div>
        )}

        {tab === 'actions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-slate-300/50 bg-slate-200/70 dark:border-slate-700/60 dark:bg-slate-800/80">
                <tr>
                  <th className="p-3 text-left">Action Type</th>
                  <th className="p-3 text-left">Triggered At</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action, idx) => (
                  <tr key={action.id} className={idx % 2 === 0 ? 'bg-slate-100/70 dark:bg-slate-900/70' : 'bg-white/80 dark:bg-slate-800/70'}>
                    <td className="p-3 font-semibold text-orange-600">{action.actionType}</td>
                    <td className="p-3">{new Date(action.triggeredAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {actions.length === 0 && <p className="py-6 text-center text-slate-500 dark:text-slate-400">No actions recorded yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}