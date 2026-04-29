import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Room component for the floor plan
interface RoomProps {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    occupied: boolean;
    light: boolean;
    fan: boolean;
    onToggleOccupancy: (id: string) => void;
}

const Room = ({ id, name, x, y, width, height, occupied, light, fan, onToggleOccupancy }: RoomProps) => {
    return (
        <g 
            className="cursor-pointer transition-all duration-500"
            onClick={() => onToggleOccupancy(id)}
        >
            {/* Room background */}
            <rect 
                x={x} y={y} width={width} height={height} 
                className={`fill-white/5 stroke-slate-500/30 transition-colors duration-500 ${occupied ? 'fill-cyan-500/20 stroke-cyan-500/50' : 'hover:fill-white/10'}`}
                rx="4"
            />
            
            {/* Room Name */}
            <text 
                x={x + 10} y={y + 20} 
                className="fill-slate-400 text-[10px] font-bold uppercase tracking-wider pointer-events-none"
            >
                {name}
            </text>

            {/* Status Indicators */}
            <g transform={`translate(${x + width - 35}, ${y + 10})`}>
                {/* Light Icon */}
                <circle cx="0" cy="0" r="8" className={`${light ? 'fill-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'fill-slate-700'} transition-colors duration-300`} />
                <text x="-4" y="4" className="text-[8px] pointer-events-none fill-slate-900">💡</text>
                
                {/* Fan Icon */}
                <g transform="translate(20, 0)">
                    <circle cx="0" cy="0" r="8" className={`${fan ? 'fill-emerald-400' : 'fill-slate-700'} transition-colors duration-300`} />
                    <text 
                        x="0" y="0" 
                        textAnchor="middle" 
                        dominantBaseline="central" 
                        className={`text-[10px] pointer-events-none fill-slate-900 ${fan ? 'animate-spin-slow' : ''}`}
                        style={{ transformOrigin: '0px 0px' }}
                    >
                        ⚙️
                    </text>
                </g>
            </g>

            {/* Motion Sensor Indicator */}
            {occupied && (
                <circle cx={x + width / 2} cy={y + height / 2} r="15" className="fill-cyan-500/20 animate-ping pointer-events-none" />
            )}
        </g>
    );
};

export default function SimulationMode() {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState({
        living: { id: 'living', name: 'Living Room', occupied: false, light: false, fan: false },
        bedroom: { id: 'bedroom', name: 'Master Bedroom', occupied: false, light: false, fan: false },
        kitchen: { id: 'kitchen', name: 'Kitchen', occupied: false, light: false, fan: false, aiSpecialty: 'fire_detection' },
        entrance: { id: 'entrance', name: 'Main Entrance', occupied: false, light: false, fan: false, aiSpecialty: 'guest_detection' },
        nursery: { id: 'nursery', name: 'Baby Room', occupied: false, light: false, fan: false, aiSpecialty: 'movement_monitoring' },
    });
    
    const [logs, setLogs] = useState<{time: string, msg: string, type: string}[]>([]);
    const [soundLevels, setSoundLevels] = useState<Record<string, number>>({
        window1: 450,
        window2: 480
    });
    
    // AI States
    const [aiInsights, setAiInsights] = useState<string>("Analyzing initial environment...");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSimulating, setIsSimulating] = useState(true);
    const [confidenceScore, setConfidenceScore] = useState(0.85);
    const [threatLevel, setThreatLevel] = useState<'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('NONE');
    
    // Window Interaction State
    const [windowInteractions, setWindowInteractions] = useState<Record<string, { count: number, lastClick: number }>>({
        window1: { count: 0, lastClick: 0 },
        window2: { count: 0, lastClick: 0 }
    });
    
    const logContainerRef = useRef<HTMLDivElement>(null);

    // AI Logic: Periodic Insight Generation
    useEffect(() => {
        const aiInterval = setInterval(() => {
            generateAIInsight();
        }, 15000);

        return () => clearInterval(aiInterval);
    }, [rooms]);

    const generateAIInsight = () => {
        setIsAnalyzing(true);
        // Simulate network delay
        setTimeout(() => {
            const occupiedRooms = Object.values(rooms).filter(r => r.occupied);
            let insight = "";
            
            if (occupiedRooms.length === 0) {
                insight = "System observing baseline patterns. Energy conservation mode active across all zones.";
            } else if (occupiedRooms.length > 2) {
                insight = "High activity detected in multiple zones. Gemini predicts peak evening occupancy pattern.";
            } else {
                insight = `Motion localized in ${occupiedRooms[0].name}. Automation optimizing climate and lighting for this sector.`;
            }
            
            setAiInsights(insight);
            setIsAnalyzing(false);
            setConfidenceScore(0.85 + Math.random() * 0.1);
        }, 2000); // Faster feedback for demo
    };

    // Simulation logic: Automation rules
    useEffect(() => {
        const interval = setInterval(() => {
            // Random sound variation
            setSoundLevels(prev => ({
                window1: Math.max(300, Math.min(3500, prev.window1 + (Math.random() * 200 - 100))),
                window2: Math.max(300, Math.min(3500, prev.window2 + (Math.random() * 200 - 100)))
            }));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Dynamic "Auto-Pilot" Logic for Guest Mode
    useEffect(() => {
        if (!isSimulating) return;

        const interval = setInterval(() => {
            const roomKeys = Object.keys(rooms);
            const randomRoomId = roomKeys[Math.floor(Math.random() * roomKeys.length)];
            const action = Math.random() > 0.5 ? 'light' : 'fan';

            // Toggle device inline (avoids circular dependency)
            setRooms(prev => {
                const room = prev[randomRoomId as keyof typeof prev];
                return { ...prev, [randomRoomId]: { ...room, [action]: !room[action as keyof typeof room] } };
            });

            setLogs(prev => [{
                time: new Date().toLocaleTimeString(),
                msg: `AI Auto-Pilot: Toggled ${action} in ${rooms[randomRoomId as keyof typeof rooms].name}`,
                type: 'info' as const
            }, ...prev].slice(0, 50));
        }, 12000);

        return () => clearInterval(interval);
    }, [isSimulating]);

    const addLog = (msg: string, type: 'info' | 'warn' | 'success' | 'ai' = 'info') => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [{ time, msg, type }, ...prev].slice(0, 50));
    };

    const toggleOccupancy = (id: string) => {
        setRooms(prev => {
            const room = prev[id as keyof typeof prev];
            const newOccupied = !room.occupied;
            
            // Automation logic
            const newLight = newOccupied; // Turn on light if occupied
            const newFan = newOccupied;   // Turn on fan if occupied
            
            addLog(`${room.name}: ${newOccupied ? 'Motion Detected' : 'Room Vacated'}`, newOccupied ? 'success' : 'info');
            if (newOccupied) {
                addLog(`Automation: Activating light and fan in ${room.name}`, 'info');
            } else {
                addLog(`Automation: Standby mode for ${room.name}`, 'info');
            }

            return {
                ...prev,
                [id]: { ...room, occupied: newOccupied, light: newLight, fan: newFan }
            };
        });
    };

    // Window Click Handler (Repetitive impact logic)
    const handleWindowClick = (id: 'window1' | 'window2') => {
        const now = Date.now();
        const interaction = windowInteractions[id];
        
        // Spike sound on click
        setSoundLevels(prev => ({ ...prev, [id]: 1500 + Math.random() * 500 }));
        
        // Reset if interval is too long (> 2 seconds)
        const isRapid = now - interaction.lastClick < 2000;
        const newCount = isRapid ? interaction.count + 1 : 1;
        
        setWindowInteractions(prev => ({
            ...prev,
            [id]: { count: newCount, lastClick: now }
        }));

        if (newCount >= 5) {
            // BREAK IN DETECTED
            setSoundLevels(prev => ({ ...prev, [id]: 3800 })); // Maximum spike
            setThreatLevel('CRITICAL');
            addLog(`🚨 SECURITY ALERT: Repetitive impact pattern at ${id === 'window1' ? 'Window 1' : 'Window 2'}!`, "warn");
            addLog("System: Pattern matches forced entry attempt (5 rapid impacts)", "warn");
            
            setTimeout(() => {
                addLog("Gemini AI: Analyzing impact frequency and cadence...", "ai");
                setTimeout(() => {
                    addLog("AI Result: [CRITICAL] High-confidence Break-In signature detected.", "warn");
                    setAiInsights("FORCED ENTRY DETECTED: Repetitive mechanical impacts confirmed. Emergency protocols suggested.");
                }, 1500);
            }, 500);

            // Reset count
            setWindowInteractions(prev => ({
                ...prev,
                [id]: { count: 0, lastClick: 0 }
            }));
            
            setTimeout(() => setThreatLevel('NONE'), 10000);
        } else {
            // MINOR VIBRATION
            addLog(`Sensor: Minor vibration detected at ${id === 'window1' ? 'Window 1' : 'Window 2'} (${newCount}/5)`, "info");
            setAiInsights("Minor acoustic disturbance. Classification: Environmental noise (e.g. insect or wind).");
        }
    };

    // Glass break simulation
    const simulateGlassBreak = () => {
        setSoundLevels(prev => ({ ...prev, window1: 3200 + Math.random() * 300 }));
        setThreatLevel('CRITICAL');
        addLog("🚨 ALERT: High intensity acoustic event detected at Window 1!", "warn");
        
        // AI Anomaly Analysis
        setTimeout(() => {
            addLog("Gemini AI: Analyzing anomaly signatures...", "ai");
            setTimeout(() => {
                addLog("AI Classification: [CRITICAL] Probable Glass Break Detected (94% confidence)", "warn");
                setAiInsights("CRITICAL SECURITY ANOMALY: Immediate response suggested for Window 1 sector.");
            }, 1500);
        }, 800);
        
        // Reset threat level after some time
        setTimeout(() => setThreatLevel('NONE'), 10000);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans selection:bg-cyan-500/30">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/login')}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        ←
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Simulation Mode
                        </h1>
                        <p className="text-slate-400 text-sm">Interactive Smart Home Prototype</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={simulateGlassBreak}
                        className="px-4 py-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/30 transition-all font-semibold"
                    >
                        Simulate Glass Break
                    </button>
                    <div className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        SIMULATOR ACTIVE
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Map Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="hc-glass rounded-2xl p-8 min-h-[500px] flex items-center justify-center relative overflow-hidden">
                        {/* Floor Plan SVG */}
                        <svg viewBox="0 0 600 400" className="w-full h-auto max-w-2xl">
                            {/* Exterior Walls */}
                            <rect x="50" y="50" width="500" height="300" fill="none" stroke="#334155" strokeWidth="4" rx="8" />
                            
                            {/* Rooms */}
                            <Room {...rooms.living} x={50} y={50} width={300} height={200} onToggleOccupancy={toggleOccupancy} />
                            <Room {...rooms.entrance} x={350} y={50} width={200} height={100} onToggleOccupancy={toggleOccupancy} />
                            <Room {...rooms.nursery} x={350} y={150} width={200} height={100} onToggleOccupancy={toggleOccupancy} />
                            <Room {...rooms.kitchen} x={50} y={250} width={250} height={100} onToggleOccupancy={toggleOccupancy} />
                            <Room {...rooms.bedroom} x={300} y={250} width={250} height={100} onToggleOccupancy={toggleOccupancy} />
                            
                            {/* Windows & Sensors */}
                            <g>
                                {/* Window 1 (Living Room) */}
                                <g 
                                    className="cursor-crosshair group" 
                                    onClick={(e) => { e.stopPropagation(); handleWindowClick('window1'); }}
                                >
                                    <rect 
                                        x="45" y="100" width="10" height="40" 
                                        className={`transition-all duration-300 ${soundLevels.window1 > 3000 ? 'fill-rose-500 shadow-lg shadow-rose-500' : 'fill-cyan-400/50 group-hover:fill-cyan-300'}`} 
                                    />
                                    <text x="15" y="125" className="fill-slate-500 text-[8px] font-bold pointer-events-none">W1</text>
                                    <title>Window 1: Click 5x rapidly to simulate break-in</title>
                                </g>
                                
                                {/* Window 2 (Bedroom) */}
                                <g 
                                    className="cursor-crosshair group" 
                                    onClick={(e) => { e.stopPropagation(); handleWindowClick('window2'); }}
                                >
                                    <rect 
                                        x="545" y="100" width="10" height="40" 
                                        className={`transition-all duration-300 ${soundLevels.window2 > 3000 ? 'fill-rose-500 shadow-lg shadow-rose-500' : 'fill-cyan-400/50 group-hover:fill-cyan-300'}`} 
                                    />
                                    <text x="525" y="125" className="fill-slate-500 text-[8px] font-bold pointer-events-none">W2</text>
                                    <title>Window 2: Click 5x rapidly to simulate break-in</title>
                                </g>
                            </g>
                        </svg>

                        {/* Interactive Overlay Info */}
                        <div className="absolute bottom-6 left-6 text-xs text-slate-500 bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/5 flex gap-4">
                            <span>🖱️ Click rooms: Motion</span>
                            <span className="text-slate-700">|</span>
                            <span>⚡ Click windows 5x: Break-in</span>
                        </div>
                    </div>

                    {/* Sensor Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {threatLevel !== 'NONE' && (
                            <div className="md:col-span-2 hc-glass p-4 rounded-xl border-2 border-rose-500/50 bg-rose-500/10 animate-pulse flex items-center justify-between mb-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-xl">🚨</div>
                                    <div>
                                        <h4 className="text-rose-400 font-bold uppercase tracking-tighter text-xs">Gemini Threat Analysis</h4>
                                        <p className="text-sm font-bold text-rose-100">CRITICAL: High-frequency acoustic spike confirmed at Window 1.</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] text-rose-400/70 font-bold uppercase">Confidence</span>
                                    <span className="text-lg font-mono font-bold text-rose-200">94.2%</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Floor-wise Per-Room Analytics */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-violet-400 rounded-full"></span>
                                Floor 1 — Room Analytics
                            </h3>
                            <div className="space-y-2">
                                {[rooms.kitchen, rooms.entrance, rooms.living].map(room => (
                                    <div key={room.id} className={`hc-glass p-3 rounded-xl border transition-all duration-300 ${
                                        room.occupied ? 'border-cyan-500/40 bg-cyan-500/5' : 'border-white/5'
                                    }`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-xs font-bold text-slate-300">{room.name}</span>
                                                {'aiSpecialty' in room && (
                                                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase font-bold">
                                                        {(room as any).aiSpecialty === 'fire_detection' ? '🔥 Fire Watch' :
                                                         (room as any).aiSpecialty === 'guest_detection' ? '🚪 Guest Detect' : 'AI'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                    room.light ? 'bg-yellow-400/20 text-yellow-300' : 'bg-slate-700 text-slate-500'
                                                }`}>💡 {room.light ? 'ON' : 'OFF'}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                    room.fan ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-700 text-slate-500'
                                                }`}>⚙️ {room.fan ? 'ON' : 'OFF'}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                    room.occupied ? 'bg-cyan-400/20 text-cyan-300 animate-pulse' : 'bg-slate-700 text-slate-500'
                                                }`}>{room.occupied ? '● Active' : '○ Clear'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                                Floor 2 — Room Analytics
                            </h3>
                            <div className="space-y-2">
                                {[rooms.nursery, rooms.bedroom].map(room => (
                                    <div key={room.id} className={`hc-glass p-3 rounded-xl border transition-all duration-300 ${
                                        room.occupied ? 'border-pink-500/40 bg-pink-500/5' : 'border-white/5'
                                    }`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-xs font-bold text-slate-300">{room.name}</span>
                                                {'aiSpecialty' in room && (
                                                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 uppercase font-bold">
                                                        👶 Movement
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                    room.light ? 'bg-yellow-400/20 text-yellow-300' : 'bg-slate-700 text-slate-500'
                                                }`}>💡 {room.light ? 'ON' : 'OFF'}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                    room.fan ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-700 text-slate-500'
                                                }`}>⚙️ {room.fan ? 'ON' : 'OFF'}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                    room.occupied ? 'bg-pink-400/20 text-pink-300 animate-pulse' : 'bg-slate-700 text-slate-500'
                                                }`}>{room.occupied ? '● Active' : '○ Clear'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="hc-glass rounded-2xl flex flex-col h-[900px]">

                    {/* Section 1: Rate-Limited AI Insights */}
                    <div className="p-5 border-b border-white/10 bg-gradient-to-br from-indigo-500/10 to-transparent">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-base font-bold flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(129,140,248,0.5)]"></span>
                                Gemini AI Insights
                            </h2>
                            <span className="text-sm font-mono text-indigo-400 font-bold">{Math.round(confidenceScore * 100)}%</span>
                        </div>

                        {/* API Cooldown Bar */}
                        <div className="mb-3">
                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                <span className="uppercase font-bold tracking-widest">API Rate Limit</span>
                                <span className="font-mono">{isAnalyzing ? 'Processing...' : 'Ready · 15s cycle'}</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full transition-all duration-1000 ${
                                    isAnalyzing ? 'bg-indigo-500 w-full animate-pulse' : 'bg-emerald-500/70 w-2/3'
                                }`}></div>
                            </div>
                        </div>

                        {/* Semantic insights per AI-monitored room */}
                        <div className="space-y-2 mb-3">
                            {rooms.kitchen.occupied && (
                                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
                                    🔥 <strong>Kitchen:</strong> Acoustic pattern matches cooking. No fire anomaly.
                                </div>
                            )}
                            {rooms.entrance.occupied && (
                                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200">
                                    🚪 <strong>Entrance:</strong> Motion matches resident arrival pattern.
                                </div>
                            )}
                            {rooms.nursery.occupied && (
                                <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-xs text-pink-200">
                                    👶 <strong>Baby Room:</strong> Movement detected. Sleep disruption: 34%.
                                </div>
                            )}
                            {!rooms.kitchen.occupied && !rooms.entrance.occupied && !rooms.nursery.occupied && (
                                <div className="p-2 rounded-lg bg-slate-800/50 border border-white/5 text-xs text-slate-400 italic">
                                    No AI-monitored rooms are active. Click a room on the map to trigger analysis.
                                </div>
                            )}
                        </div>

                        {/* General Gemini Summary */}
                        <div className={`p-3 rounded-xl border transition-all duration-500 ${
                            isAnalyzing ? 'bg-slate-800/30 border-white/5 opacity-50' : 'bg-indigo-500/5 border-indigo-500/20'
                        }`}>
                            {isAnalyzing ? (
                                <div className="flex items-center gap-3 py-1">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                    </div>
                                    <span className="text-xs text-indigo-300/70 font-mono italic">Gemini analysing telemetry...</span>
                                </div>
                            ) : (
                                <p className="text-xs text-indigo-100 leading-relaxed italic">&ldquo;{aiInsights}&rdquo;</p>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Live Events Header */}
                    <div className="p-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                            Live Events
                        </h2>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                            {logs.length} events
                        </span>
                    </div>

                    {/* Section 2: Live Events Log */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar" ref={logContainerRef}>
                        {logs.map((log, i) => (
                            <div key={i} className={`p-3 rounded-lg text-sm border transition-all ${
                                log.type === 'warn' ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' :
                                log.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' :
                                log.type === 'ai' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200' :
                                'bg-slate-800/50 border-white/5 text-slate-300'
                            }`}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-mono text-[10px] opacity-50">{log.time}</span>
                                    {log.type === 'warn' && <span className="text-[10px] font-bold uppercase text-rose-400">Alert</span>}
                                    {log.type === 'ai' && <span className="text-[10px] font-bold uppercase text-indigo-400">AI</span>}
                                </div>
                                <p className={`text-xs ${log.type === 'ai' ? 'italic' : ''}`}>{log.msg}</p>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="text-center py-10 text-slate-600">
                                <p>No events yet.</p>
                                <p className="text-xs mt-2">Click rooms on the map to begin</p>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Rules Footer */}
                    <div className="p-4 bg-slate-900/50 rounded-b-2xl border-t border-white/10">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Automation Rules</h4>
                        <ul className="text-[10px] space-y-1 text-slate-500">
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-cyan-400 rounded-full"></div>motion=TRUE → light=ON, fan=ON</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-rose-400 rounded-full"></div>sound &gt; 3000Hz → security alert</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-indigo-400 rounded-full"></div>AI analyses every 15s (rate-limited)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
