import { useState, useCallback } from 'react';
import { authAPI } from '../services/api';

interface RegisterFormProps {
  onRegisterSuccess?: (user: any) => void;
  onSwitchToLogin?: () => void;
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

const InputField = ({ label, name, type = 'text', placeholder, required = false, formData, fieldErrors, handleChange }: any) => (
    <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input 
            type={type}
            name={name}
            value={formData[name as keyof typeof formData]}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full rounded-lg border px-4 py-3 outline-none transition placeholder-slate-400 ${
                fieldErrors[name]
                    ? 'border-red-500 bg-red-50 text-slate-900 focus:ring-2 focus:ring-red-500 dark:bg-red-950/40 dark:text-slate-100'
                    : 'border-slate-300 bg-white/80 text-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100'
            }`}
        />
        {fieldErrors[name] && required && <p className="text-red-500 text-sm mt-1">This field is required</p>}
    </div>
);

export default function RegisterForm({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'USER',
    });

    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
    const [toast, setToast] = useState({ message: '', type: '', visible: false });

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type, visible: true });
        const timer = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3500);
        return () => clearTimeout(timer);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, boolean> = {};
        if (!formData.username.trim()) {
            errors.username = true;
            showToast('Username is required', 'error');
        }
        if (formData.username.length < 3) {
            errors.username = true;
            showToast('Username must be at least 3 characters', 'error');
        }
        if (!formData.password) {
            errors.password = true;
            showToast('Password is required', 'error');
        }
        if (formData.password.length < 6) {
            errors.password = true;
            showToast('Password must be at least 6 characters', 'error');
        }
        if (!formData.confirmPassword) {
            errors.confirmPassword = true;
            showToast('Please confirm your password', 'error');
        }
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = true;
            showToast('Passwords do not match', 'error');
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await authAPI.register(formData);
            if (response.data.success) {
                showToast(`✅ Welcome, ${formData.username}! Account created successfully.`, 'success');
                setFormData({ username: '', password: '', confirmPassword: '', role: 'USER' });
                setFieldErrors({});
                
                setTimeout(() => {
                    if (onRegisterSuccess) onRegisterSuccess(response.data.data);
                }, 1000);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Registration failed. Please try again.';
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
                    <p className="text-sm text-slate-600 dark:text-slate-300">Create Your Smart Home Account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <InputField 
                        label="Username" 
                        name="username" 
                        placeholder="Choose a username (3+ characters)" 
                        required={true} 
                        formData={formData} 
                        fieldErrors={fieldErrors} 
                        handleChange={handleChange} 
                    />
                    <InputField 
                        label="Password" 
                        name="password" 
                        type="password" 
                        placeholder="Create a strong password (6+ characters)" 
                        required={true} 
                        formData={formData} 
                        fieldErrors={fieldErrors} 
                        handleChange={handleChange} 
                    />
                    <InputField 
                        label="Confirm Password" 
                        name="confirmPassword" 
                        type="password" 
                        placeholder="Re-enter your password" 
                        required={true} 
                        formData={formData} 
                        fieldErrors={fieldErrors} 
                        handleChange={handleChange} 
                    />

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Account Type</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/40 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100"
                        >
                            <option value="USER">Regular User</option>
                            <option value="ADMIN">System Administrator</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 font-bold text-white shadow-lg transition hover:scale-105 hover:from-cyan-400 hover:to-blue-500 disabled:from-slate-500 disabled:to-slate-600 disabled:hover:scale-100 disabled:shadow-none"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creating Account...
                            </span>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="mt-8 border-t border-slate-300/40 pt-6 text-center dark:border-slate-700/50">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onSwitchToLogin?.();
                            }}
                            className="cursor-pointer border-none bg-none font-bold text-cyan-500 transition hover:text-cyan-400 hover:underline"
                        >
                            Sign in here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
