import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceAPI } from '../services/api';

// Define the Device interface to match the expected structure of device data from 
// the backend API.
interface Device {
    id: number;
    macAddress: string;
    name: string;
    lastSeen: string | null;
    onlineStatus: string;
    lastTelemetry?: {
        lightLevel: number;
        noiseLevel: number;
        motionDetected: boolean;
    };
}

// Per-device control state
interface DeviceControls {
    ledOn: boolean;
    servoOn: boolean;
    displayValue: string;
    loading: boolean;
}

// Props for the theme toggle injected from App
interface DeviceDashboardProps {
    theme?: 'light' | 'dark';
    onToggleTheme?: () => void;
}

// The DeviceDashboard component fetches and displays a list of devices.
// It uses React hooks for state management and side effects.
// The component navigates to the device detail page when a device is clicked.
export default function DeviceDashboard({ theme, onToggleTheme }: DeviceDashboardProps) {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    // Per-device control states keyed by device id
    const [controls, setControls] = useState<Record<number, DeviceControls>>({});
    const navigate = useNavigate();

    // Fetch devices when the component mounts or when autoRefresh changes. 
    useEffect(() => {
        fetchDevices();
        
        let interval: any;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchDevices();
            }, 3000); // Refresh every 3 seconds
        }
        
        return () => clearInterval(interval);
    }, [autoRefresh]);

    const fetchDevices = async () => {
        try {
            const response = await deviceAPI.getDevices();
            setDevices(response.data);
            setLoading(false);
        } catch(err: any) {
            setError(err.response?.data?.message || 'Failed to fetch devices');
            setLoading(false);
        }
    };

    // Initialize control state for a device if not yet set
    const getControls = (id: number): DeviceControls => {
        return controls[id] ?? { ledOn: false, servoOn: false, displayValue: '0000', loading: false };
    };

    // Update a specific field in the control state for a device
    const updateControl = (id: number, patch: Partial<DeviceControls>) => {
        setControls(prev => ({
            ...prev,
            [id]: { ...getControls(id), ...patch }
        }));
    };

    // Send LED command to device
    const handleLED = async (e: React.MouseEvent, deviceId: number) => {
        e.stopPropagation(); // Prevent card click navigation
        const ctrl = getControls(deviceId);
        if (ctrl.loading) return;
        updateControl(deviceId, { loading: true });
        try {
            const newState = !ctrl.ledOn;
            await deviceAPI.sendCommand(deviceId, { ledOn: newState });
            updateControl(deviceId, { ledOn: newState, loading: false });
        } catch {
            updateControl(deviceId, { loading: false });
        }
    };

    // Send Servo command to device
    const handleServo = async (e: React.MouseEvent, deviceId: number) => {
        e.stopPropagation();
        const ctrl = getControls(deviceId);
        if (ctrl.loading) return;
        updateControl(deviceId, { loading: true });
        try {
            const newState = !ctrl.servoOn;
            await deviceAPI.sendCommand(deviceId, { fanOn: newState });
            updateControl(deviceId, { servoOn: newState, loading: false });
        } catch {
            updateControl(deviceId, { loading: false });
        }
    };

    // Send 4-digit display command to device
    const handleDisplay = async (e: React.MouseEvent, deviceId: number) => {
        e.stopPropagation();
        const ctrl = getControls(deviceId);
        if (ctrl.loading) return;
        updateControl(deviceId, { loading: true });
        try {
            const padded = ctrl.displayValue.padStart(4, '0').slice(-4);
            await deviceAPI.sendCommand(deviceId, { lcdMessage: padded });
            updateControl(deviceId, { loading: false });
        } catch {
            updateControl(deviceId, { loading: false });
        }
    };

    // Render loading, error, or the list of devices based on the current state. 
    if (loading) return <div className="hc-page p-4 text-center text-lg">Loading devices...</div>;
    if (error) return <div className="hc-page p-4 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="hc-page container mx-auto p-4 pt-16">
            {/* Header row: title + Live Updates + Theme Toggle inline */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-4xl font-bold">Smart Home Devices</h1>
                <div className="flex items-center gap-3">
                    {/* Live Updates toggle */}
                    <label className="hc-glass flex items-center gap-2 cursor-pointer rounded-xl px-4 py-2 shadow">
                        <input 
                            type="checkbox" 
                            checked={autoRefresh} 
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">Live Updates</span>
                    </label>
                    {/* Light/Dark mode toggle — inline with Live Updates */}
                    {onToggleTheme && (
                        <button
                            onClick={onToggleTheme}
                            className="hc-glass flex items-center gap-2 cursor-pointer rounded-xl px-4 py-2 shadow text-sm font-semibold transition hover:scale-105"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map(device => {
                    const isOnline = device.onlineStatus?.toLowerCase() === 'online';
                    const ctrl = getControls(device.id);
                    return (
                    <div 
                        key={device.id}
                        className="hc-card cursor-pointer p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-2xl"
                        onClick={() => navigate(`/devices/${device.id}`)}
                    >
                        {/* Device Header */}
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-xl">{device.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                isOnline
                                    ? 'bg-emerald-500/20 text-emerald-400' 
                                    : 'bg-rose-500/20 text-rose-400'
                            }`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                            <span className="font-mono">{device.macAddress}</span>
                        </p>

                        {/* Sensor Indicators */}
                        {device.lastTelemetry && (
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="rounded bg-amber-500/15 p-2 text-center">
                                    <p className="text-xs text-slate-500 dark:text-slate-300">Light</p>
                                    <p className="text-sm font-bold text-yellow-600">{device.lastTelemetry.lightLevel}</p>
                                </div>
                                <div className="rounded bg-blue-500/15 p-2 text-center">
                                    <p className="text-xs text-slate-500 dark:text-slate-300">Noise</p>
                                    <p className="text-sm font-bold text-blue-500">{device.lastTelemetry.noiseLevel}</p>
                                </div>
                                <div className={`rounded p-2 text-center ${device.lastTelemetry.motionDetected ? 'bg-rose-500/15' : 'bg-slate-500/15'}`}>
                                    <p className="text-xs text-slate-500 dark:text-slate-300">Motion</p>
                                    <p className={`text-sm font-bold ${device.lastTelemetry.motionDetected ? 'text-red-600' : 'text-gray-600'}`}>
                                        {device.lastTelemetry.motionDetected ? 'Yes' : 'No'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Quick Controls ─────────────────────────────────── */}
                        <div
                            className="mt-3 pt-3 border-t border-slate-300/30 dark:border-slate-600/30"
                            onClick={e => e.stopPropagation()} // Prevent card navigation when interacting with controls
                        >
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Controls</p>

                            {/* LED + Servo buttons — inline */}
                            <div className="flex gap-2 mb-3 flex-wrap">
                                {/* LED Toggle */}
                                <button
                                    onClick={(e) => handleLED(e, device.id)}
                                    disabled={ctrl.loading || !isOnline}
                                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all duration-200 ${
                                        ctrl.ledOn
                                            ? 'bg-yellow-400/90 text-yellow-900 shadow-md shadow-yellow-400/30'
                                            : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'
                                    } disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105`}
                                    title={isOnline ? 'Toggle LED' : 'Device offline'}
                                >
                                    <span className="text-base">💡</span>
                                    LED {ctrl.ledOn ? 'ON' : 'OFF'}
                                </button>

                                {/* Servo Toggle */}
                                <button
                                    onClick={(e) => handleServo(e, device.id)}
                                    disabled={ctrl.loading || !isOnline}
                                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all duration-200 ${
                                        ctrl.servoOn
                                            ? 'bg-emerald-400/90 text-emerald-900 shadow-md shadow-emerald-400/30'
                                            : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'
                                    } disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105`}
                                    title={isOnline ? 'Toggle Servo' : 'Device offline'}
                                >
                                    <span className="text-base">🔧</span>
                                    Servo {ctrl.servoOn ? '90°' : '0°'}
                                </button>
                            </div>

                            {/* 4-Digit Display Input + Send */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 flex-1 rounded-lg border border-slate-300/60 dark:border-slate-600 bg-slate-100/80 dark:bg-slate-800/60 px-2 py-1.5">
                                    <span className="text-sm">📺</span>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        value={ctrl.displayValue}
                                        onChange={e => {
                                            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                            updateControl(device.id, { displayValue: val });
                                        }}
                                        onClick={e => e.stopPropagation()}
                                        placeholder="0000"
                                        className="w-full bg-transparent text-sm font-mono font-bold text-purple-600 dark:text-purple-400 outline-none placeholder:text-slate-400"
                                    />
                                </div>
                                <button
                                    onClick={(e) => handleDisplay(e, device.id)}
                                    disabled={ctrl.loading || !isOnline}
                                    className="rounded-lg bg-purple-500/90 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-purple-600 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-400/20"
                                    title={isOnline ? 'Send to 4-digit display' : 'Device offline'}
                                >
                                    Send
                                </button>
                            </div>
                        </div>

                        <p className="mt-3 border-t border-slate-300/30 pt-2 text-xs text-slate-500 dark:border-slate-600/30 dark:text-slate-400">
                            Last updated: {device.lastSeen ? new Date(device.lastSeen).toLocaleTimeString() : 'N/A'}
                        </p>
                    </div>
                    );
                })}
            </div>
            {devices.length === 0 && (
                <div className="text-center py-12">
                    <p className="mb-4 text-2xl text-slate-500 dark:text-slate-300">No devices found</p>
                    <p className="text-slate-600 dark:text-slate-400">Register a device to get started</p>
                </div>
            )}
        </div>
    );
}
