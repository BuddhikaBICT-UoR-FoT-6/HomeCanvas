import { useState, useCallback } from 'react';
import { authAPI } from '../services/api';

interface RegisterFormProps {
  onRegisterSuccess?: (user: any) => void;
  onSwitchToLogin?: () => void;
}

// Simplified RegisterForm for HomeCanvas Adaptive Ambient Intelligence System.
// Matches the schema: username, password_hash, role.
const InputField = ({ label, name, type = 'text', placeholder, required = false, formData, fieldErrors, handleChange }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
            {label} {required && fieldErrors[name] && <span className="text-red-500">*</span>}
        </label>
        <input 
            type={type}
            name={name}
            value={formData[name as keyof typeof formData]}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition ${
                fieldErrors[name] ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
        />
    </div>
);

export default function RegisterForm({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps){
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
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if(fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, boolean> = {};
        if(!formData.username.trim()) errors.username = true;
        if(!formData.password) errors.password = true;
        if(!formData.confirmPassword) errors.confirmPassword = true;
        if(formData.password !== formData.confirmPassword) errors.confirmPassword = true;

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            showToast('Please fix the errors in the form', 'error');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(!validateForm()) return;

        setLoading(true);
        try{
            const response = await authAPI.register(formData);
            if(response.data.success){
                showToast('Registration successful!', 'success');
                if(onRegisterSuccess) onRegisterSuccess(response.data.data);
                setTimeout(() => onSwitchToLogin?.(), 2000);
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return(
        <div className="min-h-screen flex items-center justify-center p-4">
            {toast.visible && (
                <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold z-[60] ${
                    toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                }`}>
                    {toast.message}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
                    HomeCanvas
                </h1>
                <p className="text-center text-gray-600 mb-6">Create your Honours Thesis account</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Username" name="username" placeholder="your_username" required={true} formData={formData} fieldErrors={fieldErrors} handleChange={handleChange} />
                    <InputField label="Password" name="password" type="password" placeholder="••••••••" required={true} formData={formData} fieldErrors={fieldErrors} handleChange={handleChange} />
                    <InputField label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" required={true} formData={formData} fieldErrors={fieldErrors} handleChange={handleChange} />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Role
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        >
                            <option value="USER">Student/Researcher (User)</option>
                            <option value="ADMIN">System Administrator</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition mt-6"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className="text-center text-gray-600 mt-6 pt-4 border-t">
                    Already have an account?{' '}
                    <button
                        onClick={onSwitchToLogin}
                        className="text-blue-500 hover:underline font-bold bg-none border-none cursor-pointer"
                    >
                        Login here
                    </button>
                </p>
            </div>
        </div>
    );
}
