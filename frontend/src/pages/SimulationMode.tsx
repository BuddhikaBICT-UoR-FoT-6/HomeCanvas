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
        kitchen: { id: 'kitchen', name: 'Kitchen', occupied: false, light: false, fan: false },
        bathroom: { id: 'bathroom', name: 'Bathroom', occupied: false, light: false, fan: false },
    });
    
    const [logs, setLogs] = useState<{time: string, msg: string, type: string}[]>([]);
    const [soundLevels, setSoundLevels] = useState<Record<string, number>>({
        window1: 450,
        window2: 480
    });
    const logContainerRef = useRef<HTMLDivElement>(null);

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

    const addLog = (msg: string, type: 'info' | 'warn' | 'success' = 'info') => {
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

    // Glass break simulation
    const simulateGlassBreak = () => {
        setSoundLevels(prev => ({ ...prev, window1: 3200 + Math.random() * 300 }));
        addLog("🚨 ALERT: High intensity acoustic event detected at Window 1!", "warn");
        addLog("Security Protocol: Potential glass break detected", "warn");
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
                            <Room {...rooms.bedroom} x={350} y={50} width={200} height={200} onToggleOccupancy={toggleOccupancy} />
                            <Room {...rooms.kitchen} x={50} y={250} width={250} height={100} onToggleOccupancy={toggleOccupancy} />
                            <Room {...rooms.bathroom} x={300} y={250} width={250} height={100} onToggleOccupancy={toggleOccupancy} />
                            
                            {/* Windows & Sensors */}
                            <g>
                                {/* Window 1 (Living Room) */}
                                <rect x="45" y="100" width="10" height="40" className={`${soundLevels.window1 > 3000 ? 'fill-rose-500 shadow-lg shadow-rose-500' : 'fill-cyan-400/50'}`} />
                                <text x="15" y="125" className="fill-slate-500 text-[8px] font-bold">W1</text>
                                
                                {/* Window 2 (Bedroom) */}
                                <rect x="545" y="100" width="10" height="40" className={`${soundLevels.window2 > 3000 ? 'fill-rose-500 shadow-lg shadow-rose-500' : 'fill-cyan-400/50'}`} />
                                <text x="525" y="125" className="fill-slate-500 text-[8px] font-bold">W2</text>
                            </g>
                        </svg>

                        {/* Interactive Overlay Info */}
                        <div className="absolute bottom-6 left-6 text-xs text-slate-500 bg-slate-900/80 px-3 py-1.5 rounded-full border border-white/5">
                            Tip: Click any room to simulate motion detection
                        </div>
                    </div>

                    {/* Sensor Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="hc-glass p-5 rounded-xl border-l-4 border-cyan-500">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Sound Monitor: Window 1</h3>
                            <div className="flex items-end gap-1 h-12 mb-2">
                                {Array.from({length: 20}).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-full transition-all duration-300 ${soundLevels.window1 > 3000 ? 'bg-rose-500' : 'bg-cyan-500'}`}
                                        style={{ height: `${(soundLevels.window1 / 3500) * (Math.random() * 100)}%` }}
                                    ></div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={`text-2xl font-mono font-bold ${soundLevels.window1 > 3000 ? 'text-rose-400' : 'text-cyan-400'}`}>
                                    {Math.round(soundLevels.window1)} Hz
                                </span>
                                <span className="text-xs text-slate-500">KY-037 Acoustic Sensor</span>
                            </div>
                        </div>

                        <div className="hc-glass p-5 rounded-xl border-l-4 border-blue-500">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Sound Monitor: Window 2</h3>
                            <div className="flex items-end gap-1 h-12 mb-2">
                                {Array.from({length: 20}).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-full transition-all duration-300 ${soundLevels.window2 > 3000 ? 'bg-rose-500' : 'bg-blue-500'}`}
                                        style={{ height: `${(soundLevels.window2 / 3500) * (Math.random() * 100)}%` }}
                                    ></div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={`text-2xl font-mono font-bold ${soundLevels.window2 > 3000 ? 'text-rose-400' : 'text-blue-400'}`}>
                                    {Math.round(soundLevels.window2)} Hz
                                </span>
                                <span className="text-xs text-slate-500">KY-037 Acoustic Sensor</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar / Logs */}
                <div className="hc-glass rounded-2xl flex flex-col h-[700px]">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                            Live Simulation Log
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" ref={logContainerRef}>
                        {logs.map((log, i) => (
                            <div key={i} className={`p-3 rounded-lg text-sm border ${
                                log.type === 'warn' ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' :
                                log.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' :
                                'bg-slate-800/50 border-white/5 text-slate-300'
                            }`}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-mono text-[10px] opacity-50">{log.time}</span>
                                    {log.type === 'warn' && <span className="text-[10px] font-bold uppercase">Critical</span>}
                                </div>
                                <p>{log.msg}</p>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="text-center py-10 text-slate-600">
                                <p>No events recorded yet.</p>
                                <p className="text-xs mt-2">Trigger sensors to see data</p>
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-slate-900/50 rounded-b-2xl border-t border-white/10">
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Simulated Rules</h4>
                                <ul className="text-xs space-y-1.5 text-slate-400">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                                        IF motion=TRUE THEN light=ON, fan=ON
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 bg-rose-400 rounded-full"></div>
                                        IF sound{'>'}3000 THEN trigger_alert=TRUE
                                    </li>
                                </ul>
                            </div>
                            <div className="pt-4 border-t border-white/5">
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    This simulation runs on program-level logic to demonstrate system capabilities without hardware dependency.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
