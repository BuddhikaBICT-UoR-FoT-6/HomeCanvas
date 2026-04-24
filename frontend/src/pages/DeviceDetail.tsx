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
  ventAngle: number;
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
  const LIGHT_THRESHOLD = 350;

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

  // Logic for advanced sound event detection
  const getSoundStatus = () => {
    if (!lastReading) return 'Silent';
    const noise = lastReading.noiseLevel;
    
    // Check for "Someone near" (continuous high sound in recent history)
    const recentHighSounds = telemetry.slice(0, 3).filter(r => r.noiseLevel > 400).length;
    if (recentHighSounds >= 3) return 'There might be someone near the window!';
    
    // Check for "Something hit" (sudden spike)
    const prevNoise = telemetry.length > 1 ? telemetry[1].noiseLevel : 0;
    if (noise > 700 && prevNoise < 150) return 'Something hit the window!';
    
    // Check for "Flies" (low buzzing)
    if (noise > 5 && noise < 60) return 'Flies near window';
    
    if (noise <= 5) return 'Silent';
    return 'Normal Ambient';
  };

  // Logic for ample light status
  const getLightStatus = () => {
    if (!lastReading) return 'N/A';
    // Based on typical home lighting standards (~300 lux), 
    // assuming 2000 is a mid-point for the sensor's range
    return lastReading.lightLevel >= LIGHT_THRESHOLD ? 'There is ample light' : 'Not ample light';
  };

  if (loading) return <div className="p-4 text-center text-slate-900 dark:text-slate-100">Loading device...</div>;
  if (!device) return <div className="p-4 text-center text-slate-900 dark:text-slate-100">Device not found</div>;

  const lastReading = device.lastTelemetry;
  const statusColor = device.onlineStatus?.toLowerCase() === 'online' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="hc-page container mx-auto max-w-6xl p-4">
      <button 
        onClick={() => navigate('/devices')} 
        className="mb-4 rounded-xl border border-hc-border bg-hc-surface-strong px-4 py-2 transition-colors hover:bg-hc-bg text-hc-text shadow-sm"
      >
        ← Back to Devices
      </button>
    
      <h1 className="text-4xl font-bold mb-2 text-hc-text">{device.name}</h1>
      <p className="mb-6 text-hc-text-soft">MAC: {device.macAddress}</p>

      {/* Status Bar */}
      <div className="hc-card mb-6 border-l-4 border-cyan-500 p-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <p className="text-sm text-hc-text-soft">Device Status</p>
            <p className={`font-bold text-lg ${statusColor}`}>{device.onlineStatus}</p>
          </div>
          <div>
            <p className="text-sm text-hc-text-soft">Last Update</p>
            <p className="font-semibold text-hc-text">{lastReading ? new Date(lastReading.timestamp).toLocaleTimeString() : 'N/A'}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-hc-text">Auto Refresh</span>
            </label>
          </div>
        </div>
      </div>

      {/* Real-time Sensor Data Grid */}
      {lastReading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Light Level */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 border-l-4 border-yellow-400 shadow">
            <p className="text-xs text-gray-700 dark:text-yellow-300 font-bold">💡 LIGHTING SYSTEM</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{lastReading.lightLevel}</p>
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mt-1">{getLightStatus()}</p>
            <p className="text-xs text-gray-600 dark:text-yellow-200/60 mt-1">Sensor Value (0-4095)</p>
          </div>

          {/* Window Security */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border-l-4 border-blue-400 shadow">
            <p className="text-xs text-gray-700 dark:text-blue-300 font-bold">🔊 WINDOW SECURITY SENSOR</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-2 leading-tight">{getSoundStatus()}</p>
            <p className="text-xs text-gray-600 dark:text-blue-200/60 mt-1">Noise Level: {lastReading.noiseLevel}</p>
            <p className="text-xl font-mono font-bold text-purple-600 dark:text-purple-400 mt-2" title="Security Board">
              📺 {String(getDisplayValue(lastReading.noiseLevel)).padStart(4, '0')}
            </p>
          </div>

          {/* Motion Detection */}
          <div className={`rounded-lg p-4 border-l-4 shadow transition-all duration-300 ${lastReading.motionDetected ? 'bg-amber-400/90 dark:bg-amber-500/80 border-amber-600' : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border-gray-400 dark:border-slate-600'}`}>
            <p className="text-xs text-gray-900 dark:text-black font-bold">🚨 OCCUPANCY STATUS</p>
            <p className={`text-2xl font-bold mt-2 ${lastReading.motionDetected ? 'text-black' : 'text-gray-500 dark:text-slate-500'}`}>
              {lastReading.motionDetected ? 'House is occupied' : 'House is empty'}
            </p>
            <p className="text-xs text-gray-800 dark:text-black/70 mt-2 font-medium">PIR Status: Active</p>
          </div>

          {/* Air Vent Status */}
          <div className={`rounded-lg p-4 border-l-4 shadow transition-all duration-300 ${lastReading.ventAngle > 0 ? 'bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/20 border-cyan-400' : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 border-gray-400 dark:border-slate-600'}`}>
            <p className="text-xs text-gray-700 dark:text-cyan-300 font-bold">🌬️ SMART AIR VENT</p>
            <p className={`text-3xl font-bold mt-2 ${lastReading.ventAngle > 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-slate-500'}`}>
              {lastReading.ventAngle > 0 ? 'Flowing' : 'Blocked'}
            </p>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-600 dark:text-cyan-200/60">Angle: {lastReading.ventAngle}°</p>
              <p className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                {device.lastCommandFanOn !== null ? 'MANUAL' : 'AUTO'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="hc-card mb-6 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg text-hc-text">Device Controls</h3>
          <button
            onClick={() => fetchDeviceDetail()}
            disabled={controlLoading}
            className="flex items-center gap-2 rounded-xl bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/30 transition-all disabled:opacity-50"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* LED Control -> Smart Lights */}
          <div className={`rounded-2xl border-2 p-4 transition-all duration-300 ${
            ledOn 
              ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20' 
              : 'border-slate-300/40 dark:border-slate-700/60 bg-slate-100/60 dark:bg-slate-800/40'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-2xl transition-all duration-300 ${ledOn ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]' : 'opacity-40'}`}>💡</span>
                <span className="font-bold text-sm text-hc-text">Smart Lights</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                ledOn ? 'bg-yellow-400/30 text-yellow-700 dark:text-yellow-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}>{ledOn ? 'ACTIVE' : 'OFF'}</span>
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

          {/* Servo Control -> Smart Air Vent */}
          <div className={`rounded-2xl border-2 p-4 transition-all duration-300 ${
            fanOn 
              ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20' 
              : 'border-slate-300/40 dark:border-slate-700/60 bg-slate-100/60 dark:bg-slate-800/40'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-2xl transition-all duration-300 ${fanOn ? 'hc-fan-spin' : 'opacity-40'}`}>🌬️</span>
                <span className="font-bold text-sm text-hc-text">Smart Air Vent</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                fanOn ? 'bg-cyan-400/30 text-cyan-700 dark:text-cyan-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}>{fanOn ? 'OPEN' : 'CLOSED'}</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCommand(fanOn ? 'fan-off' : 'fan-on')}
                disabled={controlLoading}
                className={`w-full rounded-xl py-2.5 font-bold text-sm transition-all duration-200 ${
                  fanOn 
                    ? 'bg-cyan-400 text-cyan-900 hover:bg-cyan-500 shadow-md' 
                    : 'bg-slate-300/80 text-slate-700 hover:bg-slate-400/80 dark:bg-slate-700 dark:text-slate-200'
                } disabled:opacity-50 hover:scale-[1.02]`}
              >
                {fanOn ? 'Close Vent' : 'Open Vent'}
              </button>
              <button
                onClick={() => handleCommand('fan-auto')}
                disabled={controlLoading}
                className="w-full rounded-xl py-1.5 font-semibold text-xs border border-cyan-400/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-400/10 transition-all"
              >
                ✨ Ventilation Auto
              </button>
            </div>
          </div>

          {/* 4-Digit Display Control -> Security Panel */}
          <div className="rounded-2xl border-2 border-purple-400/40 bg-purple-500/5 dark:bg-purple-900/10 p-4 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🚨</span>
              <span className="font-bold text-sm text-hc-text">Security Alert Panel</span>
            </div>
            {/* 7-segment style display preview */}
            <div className="mb-3 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-center">
              <span className="font-mono text-3xl font-bold tracking-widest text-red-500 hc-security-glow">
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
                className="flex-1 rounded-xl border border-slate-300/60 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono font-bold text-red-600 dark:text-red-400 outline-none focus:ring-2 focus:ring-red-400 placeholder:opacity-30"
              />
              <button
                onClick={handleSendDisplay}
                disabled={controlLoading}
                className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50 shadow-md ${
                  displaySuccess ? 'bg-emerald-500 shadow-emerald-400/30' : 'bg-red-500 hover:bg-red-600 shadow-red-400/20'
                }`}
              >
                {displaySuccess ? '✓' : 'ALERT'}
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
                ? 'border-b-4 border-cyan-500 text-cyan-600 dark:text-cyan-400' 
                : 'text-hc-text-soft hover:text-hc-text'
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
              <p className="text-sm text-hc-text-soft">MAC Address</p>
              <p className="font-mono font-semibold text-lg text-hc-text">{device.macAddress}</p>
            </div>
            <div>
              <p className="text-sm text-hc-text-soft">Status</p>
              <p className={`font-semibold text-lg ${statusColor}`}>{device.onlineStatus}</p>
            </div>
            <div>
              <p className="text-sm text-hc-text-soft">Last Seen</p>
              <p className="font-semibold text-hc-text">{device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-hc-text-soft">Created</p>
              <p className="font-semibold text-hc-text">{new Date(device.createdAt).toLocaleString()}</p>
            </div>
            <div className="col-span-full pt-4 border-t border-hc-border">
              <p className="mb-2 text-sm text-hc-text-soft">Owner</p>
              <p className="font-semibold text-hc-text">{device.owner?.username ?? 'Unclaimed device'}</p>
            </div>
          </div>
        )}

        {tab === 'telemetry' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-slate-300/50 bg-slate-200/70 dark:border-slate-700/60 dark:bg-slate-800/80">
                <tr>
                  <th className="p-3 text-left text-slate-900 dark:text-slate-100 font-bold">Timestamp</th>
                  <th className="p-3 text-left text-slate-900 dark:text-slate-100 font-bold">💡 Light</th>
                  <th className="p-3 text-left text-slate-900 dark:text-slate-100 font-bold">🔊 Noise</th>
                  <th className="p-3 text-left text-slate-900 dark:text-slate-100 font-bold">📺 Display</th>
                  <th className="p-3 text-left text-slate-900 dark:text-slate-100 font-bold">🚨 Motion</th>
                  <th className="p-3 text-left text-slate-900 dark:text-slate-100 font-bold">🌬️ Vent</th>
                </tr>
              </thead>
              <tbody>
                {telemetry.map((reading, idx) => (
                  <tr key={reading.id} className={idx % 2 === 0 ? 'bg-slate-100/70 dark:bg-slate-900/70' : 'bg-white/80 dark:bg-slate-800/70'}>
                    <td className="p-3 text-slate-900 dark:text-slate-100">{new Date(reading.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 font-semibold text-yellow-600 dark:text-yellow-500">{reading.lightLevel}</td>
                    <td className="p-3 font-semibold text-blue-600 dark:text-blue-500">{reading.noiseLevel}</td>
                    <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-500">{String(getDisplayValue(reading.noiseLevel)).padStart(4, '0')}</td>
                    <td className="p-3 text-slate-900 dark:text-slate-100">{reading.motionDetected ? '✓ Yes' : '✗ No'}</td>
                    <td className="p-3 font-semibold text-cyan-600 dark:text-cyan-500">{reading.ventAngle}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {telemetry.length === 0 && <p className="py-6 text-center text-slate-500 dark:text-slate-400">No telemetry data available</p>}
          </div>
        )}

        {tab === 'actions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-slate-300/50 bg-slate-200/70 dark:border-slate-700/60 dark:bg-slate-800/80">
                <tr>
                  <th className="p-3 text-left text-slate-900 dark:text-slate-100 font-bold">Action Type</th>
                  <th className="p-3 text-left text-slate-900 dark:text-slate-100 font-bold">Triggered At</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action, idx) => (
                  <tr key={action.id} className={idx % 2 === 0 ? 'bg-slate-100/70 dark:bg-slate-900/70' : 'bg-white/80 dark:bg-slate-800/70'}>
                    <td className="p-3 font-semibold text-orange-600 dark:text-orange-500">{action.actionType}</td>
                    <td className="p-3 text-slate-900 dark:text-slate-100">{new Date(action.triggeredAt).toLocaleTimeString()}</td>
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