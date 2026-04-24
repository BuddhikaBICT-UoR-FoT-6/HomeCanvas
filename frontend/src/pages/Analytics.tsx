import { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

interface AnalyticsSummary {
    totalDevices: number;
    activeDevices: number;
    totalTelemetry: number;
    lightTrend: Array<{ hour: number; value: number }>;
    securityTrend: Array<{ hour: number; alerts: number }>;
    actionCounts: Record<string, number>;
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#eab308'];

export default function Analytics() {
    const [range, setRange] = useState<'5m' | '1h' | '24h'>('24h');
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAnalytics = async () => {
        try {
            const response = await analyticsAPI.getSummary(range);
            setSummary(response.data);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch analytics');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 10000);
        return () => clearInterval(interval);
    }, [range]);

    if (loading && !summary) return <div className="flex h-64 items-center justify-center dark:text-white">Analyzing system data...</div>;
    if (error) return <div className="p-4 text-center text-rose-500 bg-rose-500/10 rounded-xl">Error: {error}</div>;

    const cards = [
        { title: 'Total Devices', value: summary?.totalDevices || 0, icon: '📱', color: 'bg-blue-500 text-blue-500' },
        { title: 'Active (15m)', value: summary?.activeDevices || 0, icon: '🟢', color: 'bg-emerald-500 text-emerald-500' },
        { title: 'Total Events', value: summary?.totalTelemetry || 0, icon: '📡', color: 'bg-purple-500 text-purple-500' },
        { title: 'Security Alerts', value: summary?.securityTrend?.reduce((a,b) => a + (b.alerts || 0), 0) || 0, icon: '🚨', color: 'bg-rose-500 text-rose-500' },
    ];

    const pieData = Object.entries(summary?.actionCounts || {}).map(([name, value]) => ({ name, value }));

    return (
        <div className="min-h-screen -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 bg-hc-bg text-hc-text transition-colors duration-300">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">System Intelligence</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time performance and security overview</p>
                </div>

                <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl w-fit">
                    {(['5m', '1h', '24h'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => { setLoading(true); setRange(r); }}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                range === r 
                                    ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                        >
                            {r === '5m' ? '5 Minutes' : r === '1h' ? '1 Hour' : '24 Hours'}
                        </button>
                    ))}
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((card, idx) => (
                    <div key={idx} className="bg-hc-surface-strong rounded-2xl p-6 shadow-sm border border-hc-border hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{card.title}</h3>
                            <div className={`p-2 rounded-lg bg-opacity-10 dark:bg-opacity-20 ${card.color.split(' ')[0]}`}>
                                <span className="text-xl">{card.icon}</span>
                            </div>
                        </div>
                        <p className={`text-4xl font-bold ${card.color.split(' ')[1]}`}>
                            {card.value.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Light Intensity Trend */}
                <div className="bg-hc-surface-strong rounded-2xl p-6 shadow-sm border border-hc-border">
                    <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-white">💡 Light Intensity ({range})</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={summary?.lightTrend}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.1}/>
                                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8'}} />
                                <YAxis stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#eab308' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#eab308" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Security Alert Trend */}
                <div className="bg-hc-surface-strong rounded-2xl p-6 shadow-sm border border-hc-border">
                    <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-white">🚨 Security Alerts ({range})</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summary?.securityTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.1}/>
                                <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8'}} />
                                <YAxis stroke="#94a3b8" fontSize={10} tick={{fill: '#94a3b8'}} />
                                <Tooltip 
                                    cursor={{fill: '#94a3b8', opacity: 0.05}}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="alerts" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* System Actions Distribution */}
                <div className="bg-hc-surface-strong rounded-2xl p-6 shadow-sm border border-hc-border">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">⚙️ System Actions</h3>
                        {pieData.length === 0 && <span className="text-xs text-rose-500 font-bold">No logs for this range</span>}
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* System Health */}
                <div className="bg-hc-surface-strong rounded-2xl p-6 shadow-sm border border-hc-border flex flex-col justify-center text-center">
                    <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">Core Engine</h3>
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">OPERATIONAL</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-slate-500 dark:text-slate-400">MQTT: <span className="text-emerald-500">Online</span></p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">DB: <span className="text-emerald-500">Connected</span></p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Auto-Rules: <span className="text-emerald-500">Active</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
