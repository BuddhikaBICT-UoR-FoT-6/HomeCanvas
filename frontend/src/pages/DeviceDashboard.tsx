import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceAPI, aiAPI } from '../services/api';

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
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [aiPredictions, setAiPredictions] = useState<Record<number, { action: string; confidence: number }>>({});
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [manualOverrides, setManualOverrides] = useState<Set<number>>(new Set());

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
        }
    }, []);

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


    // Guest Mode Simulation: Randomly toggle devices unless manually overridden
    useEffect(() => {
        if (userRole !== 'GUEST' || !autoRefresh) return;

        const interval = setInterval(() => {
            const onlineDevices = devices.filter(d => 
                d.onlineStatus?.toLowerCase() === 'online' && !manualOverrides.has(d.id)
            );
            
            if (onlineDevices.length === 0) return;

            const target = onlineDevices[Math.floor(Math.random() * onlineDevices.length)];
            const ctrl = getControls(target.id);
            const action = Math.random() > 0.5 ? 'light' : 'fan';
            
            if (action === 'light') {
                const newState = !ctrl.ledOn;
                deviceAPI.sendCommand(target.id, { ledOn: newState });
                updateControl(target.id, { ledOn: newState });
            } else {
                const newState = !ctrl.servoOn;
                deviceAPI.sendCommand(target.id, { fanOn: newState });
                updateControl(target.id, { servoOn: newState });
            }
        }, 8000); // Dynamic event every 8 seconds

        return () => clearInterval(interval);
    }, [userRole, autoRefresh, devices, manualOverrides, controls]);

    const fetchDevices = async () => {
        try {
            const response = await deviceAPI.getDevices();
            setDevices(response.data);
            setLoading(false);
            
            // Fetch AI predictions for online devices
            response.data.forEach((device: Device) => {
                if (device.onlineStatus?.toLowerCase() === 'online') {
                    fetchAIPrediction(device.id);
                }
            });
        } catch(err: any) {
            setError(err.response?.data?.message || 'Failed to fetch devices');
            setLoading(false);
        }
    };

    const fetchAIPrediction = async (id: number) => {
        try {
            const res = await aiAPI.getActionPrediction(id);
            setAiPredictions(prev => ({
                ...prev,
                [id]: { 
                    action: res.data.predicted_action, 
                    confidence: res.data.confidence_score 
                }
            }));
        } catch (e) {
            // silent fail for AI
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
            // User manual override persists
            if (userRole === 'GUEST') {
                setManualOverrides(prev => new Set(prev).add(deviceId));
            }
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
            // User manual override persists
            if (userRole === 'GUEST') {
                setManualOverrides(prev => new Set(prev).add(deviceId));
            }
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

    const handleRename = async (e: React.MouseEvent, deviceId: number) => {
        e.stopPropagation();
        try {
            await deviceAPI.updateDevice(deviceId, { name: editName });
            setEditingId(null);
            fetchDevices();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to rename device');
        }
    };

    const handleDelete = async (e: React.MouseEvent, deviceId: number) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this device?')) return;
        try {
            await deviceAPI.deleteDevice(deviceId);
            fetchDevices();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete device');
        }
    };

    // Render loading, error, or the list of devices based on the current state. 
    if (loading) return <div className="hc-page min-h-screen p-4 text-center text-lg text-slate-700 dark:text-slate-300">Loading devices...</div>;
    if (error) return <div className="hc-page min-h-screen p-4 text-center text-red-500 dark:text-red-400">Error: {error}</div>;

    return (
        <div className="hc-page min-h-screen bg-hc-bg text-hc-text transition-colors duration-300">
            {userRole === 'GUEST' && (
                <div className="bg-gradient-to-r from-cyan-600/90 to-blue-700/90 text-white px-4 py-2 text-center text-sm font-bold shadow-lg flex items-center justify-center gap-4 animate-fadeIn">
                    <span className="flex items-center gap-1">✨ <span className="hidden sm:inline">Guest Mode Active:</span> Controlling Virtual Hardware</span>
                    <button 
                        onClick={() => navigate('/login')}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition-colors border border-white/30"
                    >
                        Sign up for Real Hardware
                    </button>
                </div>
            )}
            <div className="container mx-auto p-4 pt-16">
            {/* Header row: title + Live Updates + Theme Toggle inline */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h1 className="text-4xl font-bold text-hc-text">Smart Home Devices</h1>
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

            {/* ── Guest-Only: Floor Map + AI Insights ─────────────────── */}
            {userRole === 'GUEST' && (() => {
                // Map device names to floor/room slots
                const roomSlots = [
                    { key: 'living',   label: 'LIVING ROOM',    floor: 1, nameMatch: 'living',   badge: null,               badgeColor: 'cyan',    aiTag: null },
                    { key: 'kitchen',  label: 'KITCHEN',        floor: 1, nameMatch: 'kitchen',  badge: '🔥 Fire Watch',    badgeColor: 'rose',    aiTag: '🔥' },
                    { key: 'entrance', label: 'MAIN ENTRANCE',  floor: 1, nameMatch: 'entrance', badge: '🚪 Guest Detect',  badgeColor: 'emerald', aiTag: '🚪' },
                    { key: 'nursery',  label: 'BABY ROOM',      floor: 2, nameMatch: 'baby',     badge: '👶 Movement',      badgeColor: 'pink',    aiTag: '👶' },
                    { key: 'bedroom',  label: 'MASTER BEDROOM', floor: 2, nameMatch: 'bedroom',  badge: null,               badgeColor: 'indigo',  aiTag: null },
                ];

                // Match each slot to a real device by name keyword
                const enriched = roomSlots.map(slot => {
                    const device = devices.find(d =>
                        d.name.toLowerCase().includes(slot.nameMatch)
                    );
                    const ctrl = device ? getControls(device.id) : null;
                    const motion = device?.lastTelemetry?.motionDetected ?? false;
                    return { ...slot, device, lightOn: ctrl?.ledOn ?? false, fanOn: ctrl?.servoOn ?? false, motion };
                });

                const floor1 = enriched.filter(r => r.floor === 1);
                const floor2 = enriched.filter(r => r.floor === 2);

                return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Left: Floor Plan + Analytics (2 cols) */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* SVG Floor Map */}
                        <div className="hc-glass rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                Live Floor Plan — 2 Floors · 5 Rooms
                            </h2>
                            <svg viewBox="0 0 620 320" className="w-full h-auto rounded-xl">
                                {/* Floor 1 */}
                                <text x="10" y="20" style={{fontSize:11,fontWeight:'bold',fill:'#a78bfa'}}>FLOOR 1</text>
                                <rect x="10" y="28" width="600" height="130" rx="6" fill="none" stroke="#334155" strokeWidth="3"/>
                                {/* Living Room */}
                                {(() => { const r = enriched[0]; return (<>
                                    <rect x="10" y="28" width="300" height="130" rx="4" fill={r.motion ? 'rgba(6,182,212,0.18)' : 'rgba(6,182,212,0.05)'} stroke={r.motion ? '#22d3ee' : '#0891b2'} strokeWidth="1.5"/>
                                    <text x="20" y="48" style={{fontSize:10,fill:'#94a3b8',fontWeight:'bold'}}>LIVING ROOM</text>
                                    <circle 
                                        cx="155" cy="85" r="16" 
                                        fill={r.lightOn ? 'rgba(250,204,21,0.3)' : 'rgba(100,116,139,0.1)'} 
                                        stroke={r.lightOn ? '#fbbf24' : '#475569'} strokeWidth="1.5"
                                        className="cursor-pointer hover:stroke-yellow-400 transition-colors"
                                        onClick={(e) => r.device && handleLED(e, r.device.id)}
                                    />
                                    <text x="147" y="89" style={{fontSize:12, pointerEvents:'none'}}>💡</text>
                                    <circle 
                                        cx="200" cy="85" r="16" 
                                        fill={r.fanOn ? 'rgba(52,211,153,0.3)' : 'rgba(100,116,139,0.1)'} 
                                        stroke={r.fanOn ? '#34d399' : '#475569'} strokeWidth="1.5"
                                        className="cursor-pointer hover:stroke-emerald-400 transition-colors"
                                        onClick={(e) => r.device && handleServo(e, r.device.id)}
                                    />
                                    <text x="192" y="89" style={{fontSize:12, pointerEvents:'none'}}>⚙️</text>
                                    {r.motion && <circle cx="155" cy="85" r="26" fill="rgba(6,182,212,0.1)" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 2"/>}
                                    <text x="108" y="145" style={{fontSize:9,fill: r.motion ? '#67e8f9' : '#64748b'}}>Motion: {r.motion ? '● ACTIVE' : '○ Clear'}</text>
                                </>); })()}
                                {/* Kitchen */}
                                {(() => { const r = enriched[1]; return (<>
                                    <rect x="310" y="28" width="150" height="130" rx="4" fill={r.motion ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.05)'} stroke="#dc2626" strokeWidth="1.5"/>
                                    <text x="320" y="48" style={{fontSize:10,fill:'#94a3b8',fontWeight:'bold'}}>KITCHEN</text>
                                    <text x="320" y="64" style={{fontSize:8,fill:'#fca5a5'}}>🔥 Fire Watch</text>
                                    <circle 
                                        cx="360" cy="95" r="14" 
                                        fill={r.lightOn ? 'rgba(250,204,21,0.3)' : 'rgba(100,116,139,0.1)'} 
                                        stroke={r.lightOn ? '#fbbf24' : '#475569'} strokeWidth="1.5"
                                        className="cursor-pointer hover:stroke-yellow-400 transition-colors"
                                        onClick={(e) => r.device && handleLED(e, r.device.id)}
                                    />
                                    <text x="353" y="99" style={{fontSize:11, pointerEvents:'none'}}>💡</text>
                                    <circle 
                                        cx="395" cy="95" r="14" 
                                        fill={r.fanOn ? 'rgba(52,211,153,0.3)' : 'rgba(100,116,139,0.1)'} 
                                        stroke={r.fanOn ? '#34d399' : '#475569'} strokeWidth="1.5"
                                        className="cursor-pointer hover:stroke-emerald-400 transition-colors"
                                        onClick={(e) => r.device && handleServo(e, r.device.id)}
                                    />
                                    <text x="387" y="99" style={{fontSize:11, pointerEvents:'none'}}>⚙️</text>
                                    <text x="316" y="145" style={{fontSize:9,fill:'#f87171'}}>Acoustic: Active</text>
                                </>); })()}
                                {/* Entrance */}
                                {(() => { const r = enriched[2]; return (<>
                                    <rect x="460" y="28" width="150" height="130" rx="4" fill={r.motion ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.05)'} stroke="#059669" strokeWidth="1.5"/>
                                    <text x="468" y="48" style={{fontSize:10,fill:'#94a3b8',fontWeight:'bold'}}>ENTRANCE</text>
                                    <text x="468" y="64" style={{fontSize:8,fill:'#6ee7b7'}}>🚪 PIR Sensor</text>
                                    <circle 
                                        cx="510" cy="95" r="14" 
                                        fill={r.lightOn ? 'rgba(250,204,21,0.3)' : 'rgba(100,116,139,0.1)'} 
                                        stroke={r.lightOn ? '#fbbf24' : '#475569'} strokeWidth="1.5"
                                        className="cursor-pointer hover:stroke-yellow-400 transition-colors"
                                        onClick={(e) => r.device && handleLED(e, r.device.id)}
                                    />
                                    <text x="503" y="99" style={{fontSize:11, pointerEvents:'none'}}>💡</text>
                                    <text x="466" y="145" style={{fontSize:9,fill: r.motion ? '#34d399' : '#64748b'}}>Motion: {r.motion ? '● DETECTED' : '○ Clear'}</text>
                                </>); })()}

                                {/* Floor 2 */}
                                <text x="10" y="178" style={{fontSize:11,fontWeight:'bold',fill:'#f472b6'}}>FLOOR 2</text>
                                <rect x="10" y="186" width="600" height="120" rx="6" fill="none" stroke="#334155" strokeWidth="3"/>
                                {/* Baby Room */}
                                {(() => { const r = enriched[3]; return (<>
                                    <rect x="10" y="186" width="300" height="120" rx="4" fill={r.motion ? 'rgba(236,72,153,0.18)' : 'rgba(236,72,153,0.05)'} stroke={r.motion ? '#ec4899' : '#db2777'} strokeWidth="1.5"/>
                                    <text x="20" y="206" style={{fontSize:10,fill:'#94a3b8',fontWeight:'bold'}}>BABY ROOM</text>
                                    <text x="20" y="221" style={{fontSize:8,fill:'#f9a8d4'}}>👶 Movement Monitor</text>
                                    <circle 
                                        cx="155" cy="252" r="14" 
                                        fill={r.lightOn ? 'rgba(250,204,21,0.3)' : 'rgba(100,116,139,0.1)'} 
                                        stroke={r.lightOn ? '#fbbf24' : '#475569'} strokeWidth="1.5"
                                        className="cursor-pointer hover:stroke-yellow-400 transition-colors"
                                        onClick={(e) => r.device && handleLED(e, r.device.id)}
                                    />
                                    <text x="148" y="256" style={{fontSize:11, pointerEvents:'none'}}>💡</text>
                                    <circle 
                                        cx="190" cy="252" r="14" 
                                        fill={r.fanOn ? 'rgba(52,211,153,0.3)' : 'rgba(100,116,139,0.1)'} 
                                        stroke={r.fanOn ? '#34d399' : '#475569'} strokeWidth="1.5"
                                        className="cursor-pointer hover:stroke-emerald-400 transition-colors"
                                        onClick={(e) => r.device && handleServo(e, r.device.id)}
                                    />
                                    <text x="182" y="256" style={{fontSize:11, pointerEvents:'none'}}>⚙️</text>
                                    {r.motion && <circle cx="155" cy="252" r="24" fill="rgba(236,72,153,0.1)" stroke="#ec4899" strokeWidth="0.5" strokeDasharray="4 2"/>}
                                    <text x="108" y="296" style={{fontSize:9,fill: r.motion ? '#f472b6' : '#64748b'}}>Motion: {r.motion ? '● ACTIVE' : '○ Clear'}</text>
                                </>); })()}
                                {/* Master Bedroom */}
                                {(() => { const r = enriched[4]; return (<>
                                    <rect x="310" y="186" width="300" height="120" rx="4" fill="rgba(99,102,241,0.05)" stroke="#4f46e5" strokeWidth="1.5"/>
                                    <text x="320" y="206" style={{fontSize:10,fill:'#94a3b8',fontWeight:'bold'}}>MASTER BEDROOM</text>
                                    <circle 
                                        cx="430" cy="252" r="14" 
                                        fill={r.lightOn ? 'rgba(250,204,21,0.3)' : 'rgba(100,116,139,0.1)'} 
                                        stroke={r.lightOn ? '#fbbf24' : '#475569'} strokeWidth="1.5"
                                        className="cursor-pointer hover:stroke-yellow-400 transition-colors"
                                        onClick={(e) => r.device && handleLED(e, r.device.id)}
                                    />
                                    <text x="423" y="256" style={{fontSize:11, pointerEvents:'none'}}>💡</text>
                                    <circle 
                                        cx="465" cy="252" r="14" 
                                        fill={r.fanOn ? 'rgba(52,211,153,0.3)' : 'rgba(100,116,139,0.1)'} 
                                        stroke={r.fanOn ? '#34d399' : '#475569'} strokeWidth="1.5"
                                        className="cursor-pointer hover:stroke-emerald-400 transition-colors"
                                        onClick={(e) => r.device && handleServo(e, r.device.id)}
                                    />
                                    <text x="457" y="256" style={{fontSize:11, pointerEvents:'none'}}>⚙️</text>
                                    <text x="318" y="296" style={{fontSize:9,fill:'#818cf8'}}>Temp: Nominal</text>
                                </>); })()}
                            </svg>
                        </div>

                        {/* Floor-wise Analytics Cards — live from state */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[{ label: 'Floor 1 — Room Status', color: 'violet', rooms: floor1 },
                              { label: 'Floor 2 — Room Status', color: 'pink',   rooms: floor2 }].map(floor => (
                                <div key={floor.label} className="hc-glass rounded-2xl p-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span className={`w-2 h-2 bg-${floor.color}-400 rounded-full`}></span>
                                        {floor.label}
                                    </h3>
                                    <div className="space-y-2">
                                        {floor.rooms.map(r => (
                                            <div key={r.key} className={`flex justify-between items-center p-2 rounded-lg border transition-all duration-300 ${r.motion ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-white/5 border-white/5'}`}>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-300">{r.device?.name ?? r.label}</span>
                                                    {r.badge && <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded bg-${r.badgeColor}-500/20 text-${r.badgeColor}-300 font-bold uppercase`}>{r.badge}</span>}
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${r.lightOn ? 'bg-yellow-400/20 text-yellow-300' : 'bg-slate-700 text-slate-500'}`}>💡 {r.lightOn ? 'ON' : 'OFF'}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${r.fanOn ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-700 text-slate-500'}`}>⚙️ {r.fanOn ? 'ON' : 'OFF'}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.motion ? 'bg-cyan-400/20 text-cyan-300 animate-pulse' : 'bg-slate-700 text-slate-500'}`}>{r.motion ? '● Active' : '○ Clear'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: AI Insights Sidebar */}
                    <div className="hc-glass rounded-2xl flex flex-col" style={{minHeight: '480px'}}>
                        <div className="p-5 border-b border-white/10 bg-gradient-to-br from-indigo-500/10 to-transparent flex-1">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-sm font-bold flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.5)]"></span>
                                    Gemini AI Insights
                                </h2>
                                <span className="text-xs font-mono text-indigo-400 font-bold">87%</span>
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span className="uppercase font-bold tracking-widest">API Rate Limit</span>
                                    <span className="font-mono">Ready · 15s cycle</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5">
                                    <div className="h-1.5 rounded-full bg-emerald-500/70 w-2/3"></div>
                                </div>
                            </div>
                            {/* Semantic insights — only show for AI-monitored rooms with motion */}
                            <div className="space-y-2 mb-4">
                                {enriched[1].motion && (
                                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
                                        🔥 <strong>Kitchen:</strong> Acoustic activity detected. Monitoring for fire signature.
                                    </div>
                                )}
                                {enriched[2].motion && (
                                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200">
                                        🚪 <strong>Entrance:</strong> Motion signature consistent with resident arrival.
                                    </div>
                                )}
                                {enriched[3].motion && (
                                    <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-xs text-pink-200">
                                        👶 <strong>Baby Room:</strong> Movement detected. Sleep disruption probability: 34%.
                                    </div>
                                )}
                                {!enriched[1].motion && !enriched[2].motion && !enriched[3].motion && (
                                    <div className="p-2 rounded-lg bg-slate-800/50 border border-white/5 text-xs text-slate-400 italic">
                                        No AI-monitored rooms active. Awaiting sensor events...
                                    </div>
                                )}
                            </div>
                            <div className="p-3 rounded-xl border bg-indigo-500/5 border-indigo-500/20">
                                <p className="text-xs text-indigo-100 leading-relaxed italic">
                                    &ldquo;{enriched.some(r => r.motion)
                                        ? `Activity detected in ${enriched.filter(r => r.motion).map(r => r.label).join(', ')}. Automation protocols active.`
                                        : 'System observing baseline patterns. Energy conservation mode active across all zones.'
                                    }&rdquo;
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-900/50 rounded-b-2xl border-t border-white/10">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Automation Rules</h4>
                            <ul className="text-[10px] space-y-1 text-slate-500">
                                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-400 rounded-full"></div>motion=TRUE → light=ON, fan=ON</li>
                                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-rose-400 rounded-full"></div>acoustic spike → fire/security alert</li>
                                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-indigo-400 rounded-full"></div>Gemini analyses every 15s (rate-limited)</li>
                            </ul>
                        </div>
                    </div>
                </div>
                );
            })()}
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
                            {editingId === device.id ? (
                                <div className="flex items-center gap-2 w-full mr-2" onClick={e => e.stopPropagation()}>
                                    <input 
                                        autoFocus
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 outline-none font-bold focus:ring-2 focus:ring-cyan-500"
                                    />
                                    <button onClick={(e) => handleRename(e, device.id)} className="bg-emerald-500 text-white rounded p-1 text-xs px-2 hover:bg-emerald-600 transition">Save</button>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded p-1 text-xs px-2 hover:bg-slate-400 dark:hover:bg-slate-600 transition">Cancel</button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group relative">
                                    <h3 className="font-bold text-xl text-hc-text">{device.name}</h3>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 absolute left-full ml-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEditingId(device.id); setEditName(device.name); }}
                                            className="text-slate-500 dark:text-slate-400 hover:text-cyan-500 transition" title="Rename"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(e, device.id)}
                                            className="text-slate-500 dark:text-slate-400 hover:text-rose-500 transition" title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            )}
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
                                isOnline
                                    ? 'bg-emerald-500/20 text-emerald-400' 
                                    : 'bg-rose-500/20 text-rose-400'
                            }`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        {/* AI Prediction Chip */}
                        {isOnline && aiPredictions[device.id] && (
                            <div className="mb-4 flex items-center gap-2">
                                <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-lg text-xs font-bold border border-purple-500/20 flex items-center gap-1.5 animate-pulse">
                                    ✨ {aiPredictions[device.id].action}
                                    <span className="text-[10px] opacity-60">({aiPredictions[device.id].confidence}%)</span>
                                </span>
                            </div>
                        )}

                        <p className="mb-4 text-sm text-hc-text-soft">
                            <span className="font-mono text-hc-text">{device.macAddress}</span>
                        </p>

                        {/* Sensor Indicators */}
                        {device.lastTelemetry && (
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="rounded bg-amber-500/15 dark:bg-amber-900/20 p-2 text-center">
                                    <p className="text-xs text-slate-600 dark:text-slate-300">Light</p>
                                    <p className="text-sm font-bold text-yellow-600">{device.lastTelemetry.lightLevel}</p>
                                </div>
                                <div className="rounded bg-blue-500/15 dark:bg-blue-900/20 p-2 text-center">
                                    <p className="text-xs text-slate-600 dark:text-slate-300">Noise</p>
                                    <p className="text-sm font-bold text-blue-500">{device.lastTelemetry.noiseLevel}</p>
                                </div>
                                <div className={`rounded p-2 text-center ${device.lastTelemetry.motionDetected ? 'bg-rose-500/15' : 'bg-slate-500/15'}`}>
                                    <p className="text-xs text-hc-text-soft">Motion</p>
                                    <p className={`text-sm font-bold ${device.lastTelemetry.motionDetected ? 'text-red-600' : 'text-hc-text-soft'}`}>
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
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Quick Controls</p>

                            {/* LED + Servo buttons — inline */}
                            <div className="flex gap-2 mb-3 flex-wrap">
                                {/* Light Toggle */}
                                <button
                                    onClick={(e) => handleLED(e, device.id)}
                                    disabled={ctrl.loading || !isOnline}
                                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all duration-200 ${
                                        ctrl.ledOn
                                            ? 'bg-yellow-400/90 text-yellow-900 shadow-md shadow-yellow-400/30'
                                            : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'
                                    } disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105`}
                                    title={isOnline ? 'Toggle Light' : 'Device offline'}
                                >
                                    <span className="text-base">💡</span>
                                    Light {ctrl.ledOn ? 'ON' : 'OFF'}
                                </button>

                                {/* Fan Toggle */}
                                <button
                                    onClick={(e) => handleServo(e, device.id)}
                                    disabled={ctrl.loading || !isOnline}
                                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all duration-200 ${
                                        ctrl.servoOn
                                            ? 'bg-emerald-400/90 text-emerald-900 shadow-md shadow-emerald-400/30'
                                            : 'bg-slate-200/70 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'
                                    } disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105`}
                                    title={isOnline ? 'Toggle Fan' : 'Device offline'}
                                >
                                    <span className={`text-base ${ctrl.servoOn ? 'animate-spin-slow' : ''}`}>⚙️</span>
                                    Fan {ctrl.servoOn ? 'ON' : 'OFF'}
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
                                        className="w-full bg-slate-100 dark:bg-slate-900 text-sm font-mono font-bold text-purple-600 dark:text-purple-400 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-purple-400"
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
        </div>
    );
}
