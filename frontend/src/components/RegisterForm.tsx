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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input 
            type={type}
            name={name}
            value={formData[name as keyof typeof formData]}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition placeholder-gray-400 ${
                fieldErrors[name] ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
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
                    <p className="text-gray-600 text-sm">Create Your Smart Home Account</p>
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
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Account Type</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        >
                            <option value="USER">Regular User</option>
                            <option value="ADMIN">System Administrator</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-4 rounded-lg transition transform hover:scale-105 disabled:hover:scale-100 shadow-lg disabled:shadow-none"
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

                <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                    <p className="text-gray-600 text-sm">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onSwitchToLogin?.();
                            }}
                            className="text-blue-600 font-bold hover:text-blue-800 hover:underline bg-none border-none cursor-pointer transition"
                        >
                            Sign in here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
