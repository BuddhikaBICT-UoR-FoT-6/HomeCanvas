import { useEffect, useState } from 'react';
import { userAPI } from '../services/api';

interface User {
    id: number;
    username: string;
    role: string;
    createdAt: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await userAPI.getUsers();
            if (response.data.success) {
                setUsers(response.data.data);
            }
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch users');
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await userAPI.deleteUser(id);
            if (res.data.success) {
                setMessage('User deleted successfully');
                fetchUsers();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleRoleChange = async (id: number, newRole: string) => {
        try {
            const res = await userAPI.updateUserRole(id, newRole);
            if (res.data.success) {
                setMessage('User role updated successfully');
                fetchUsers();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update role');
        }
    };

    // Auto-clear messages
    useEffect(() => {
        if (message || error) {
            const timer = setTimeout(() => {
                setMessage('');
                setError('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, error]);

    if (loading) return <div className="p-4 text-center text-slate-900 dark:text-slate-100">Loading users...</div>;

    const currentUserStr = localStorage.getItem('user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const isAdmin = currentUser?.role === 'ADMIN';

    if (!isAdmin) {
        return (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg mx-auto mt-12">
                <span className="text-4xl mb-4 block">🚫</span>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h2>
                <p className="text-slate-500 dark:text-slate-400">You must be an administrator to view this page.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-white">User Management</h1>
            
            {message && (
                <div className="mb-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50">
                    {message}
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700/50">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                            <th className="p-4 font-semibold">ID</th>
                            <th className="p-4 font-semibold">Username</th>
                            <th className="p-4 font-semibold">Role</th>
                            <th className="p-4 font-semibold">Created At</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 font-mono text-sm text-slate-900 dark:text-slate-100">{user.id}</td>
                                <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{user.username}</td>
                                <td className="p-4">
                                    <select 
                                        value={user.role} 
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        disabled={user.id === currentUser?.id}
                                        className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-cyan-500 disabled:opacity-50"
                                    >
                                        <option value="USER">USER</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </td>
                                <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                    {new Date(user.createdAt).toLocaleString()}
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(user.id)}
                                        disabled={user.id === currentUser?.id}
                                        className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No users found.
                    </div>
                )}
            </div>
        </div>
    );
}
