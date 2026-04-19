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
        setLoading(true);

        try {
            if (!username || !password) {
                showToast('Please enter both username and password', 'error');
                setLoading(false);
                return;
            }

            const response = await authAPI.login({ username, password });

            if (response.data.success) {
                showToast(`Welcome back, ${response.data.data.username}!`, 'success');
                localStorage.setItem('token', response.data.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.data));
                localStorage.setItem('userId', response.data.data.id);

                if (onLoginSuccess) {
                    onLoginSuccess(response.data.data);
                }

                setUsername('');
                setPassword('');

                setTimeout(() => {
                    window.location.href = '/devices';
                }, 2000);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-fixed"
            style={{ backgroundImage: 'url(/background.jpg)' }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

            <Toast message={toast.message} type={toast.type} visible={toast.visible} />

            <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                        🏠 HomeCanvas
                    </h1>
                    <p className="text-gray-600 text-sm">Smart Home Automation System</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-400"
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition placeholder-gray-400"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 disabled:hover:scale-100 shadow-lg disabled:shadow-none"
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
                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p className="text-gray-600 text-sm">
                        Don't have an account?{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="text-blue-600 font-bold hover:text-blue-800 hover:underline bg-none border-none cursor-pointer transition"
                        >
                            Create one now
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}