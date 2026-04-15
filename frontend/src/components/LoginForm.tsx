import { useCallback, useState } from 'react';
import { authAPI } from '../services/api';

interface LoginFormProps {
    onLoginSuccess: (user: any) => void;
    onSwitchToRegister?: () => void;
}

// Professional Toast Notification Component
const Toast = ({ message, type, visible }: { message: string; type: string; visible: boolean }) => {
    if (!visible) return null;
    
    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
    const icon = type === 'error' ? '❌' : '✅';
    
    return (
        <div className={`fixed top-6 right-6 px-6 py-4 rounded-lg text-white font-semibold z-[60] shadow-xl flex items-center gap-3 animate-slideIn ${bgColor}`}>
            <span className="text-xl">{icon}</span>
            <span>{message}</span>
        </div>
    );
};

export default function LoginForm({ onLoginSuccess, onSwitchToRegister }: LoginFormProps) {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [toast, setToast] = useState({ message: '', type: '', visible: false });

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type, visible: true });
        const timer = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!username || !password) {
            showToast('Please enter both username and password', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.login({ username, password });

            if (response.data.success) {
                localStorage.setItem('token', response.data.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.data));
                localStorage.setItem('userId', response.data.data.id);
                
                showToast(`✅ Welcome back, ${response.data.data.username}!`, 'success');
                
                setUsername('');
                setPassword('');

                // Navigate after storing token
                setTimeout(() => {
                    if (onLoginSuccess) {
                        onLoginSuccess(response.data.data);
                    }
                }, 800);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            showToast(`❌ ${errorMsg}`, 'error');
            setLoading(false);
        }
    };

    return (
        <div 
            className="hc-page relative flex min-h-screen items-center justify-center bg-cover bg-center bg-fixed p-4"
            style={{ backgroundImage: 'url(/background.jpg)' }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

            <Toast message={toast.message} type={toast.type} visible={toast.visible} />

            <div className="hc-glass relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-4xl font-bold text-transparent">
                        🏠 HomeCanvas
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Smart Home Automation System</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username Input */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            className="w-full rounded-lg border border-slate-300 bg-white/80 px-4 py-3 text-slate-900 outline-none transition placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100"
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full rounded-lg border border-slate-300 bg-white/80 px-4 py-3 text-slate-900 outline-none transition placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-bold text-white shadow-lg transition hover:scale-105 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-500 disabled:to-slate-600 disabled:hover:scale-100 disabled:shadow-none"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Footer link */}
                <div className="mt-8 border-t border-slate-300/40 pt-6 text-center dark:border-slate-700/50">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onSwitchToRegister?.();
                            }}
                            className="cursor-pointer border-none bg-none font-bold text-cyan-500 transition hover:text-cyan-400 hover:underline"
                        >
                            Create one now
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}