import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
    const { login } = useAuth();
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'INTERN' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isRegistering) {
                const res = await apiClient.post('/auth/register', formData);
                login(res.data);
            } else {
                const res = await apiClient.post('/auth/login', { email: formData.email, password: formData.password });
                login(res.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Authentication failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-slate-200">
            <div className="bg-surface p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
                <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Cohort Pulse
                </h1>
                {error && <div className="bg-danger/20 text-danger p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegistering && (
                        <div>
                            <label className="block text-sm mb-1 text-slate-400">Name</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-background border border-slate-600 rounded-lg p-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm mb-1 text-slate-400">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-background border border-slate-600 rounded-lg p-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-slate-400">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                className="w-full bg-background border border-slate-600 rounded-lg p-2.5 pr-10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {isRegistering && (
                        <div>
                            <label className="block text-sm mb-1 text-slate-400">Role</label>
                            <select
                                className="w-full bg-background border border-slate-600 rounded-lg p-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="INTERN">Intern</option>
                                <option value="MENTOR">Mentor</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors mt-2"
                    >
                        {isRegistering ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                    <button
                        type="button"
                        className="text-primary hover:text-blue-400 font-medium"
                        onClick={() => setIsRegistering(!isRegistering)}
                    >
                        {isRegistering ? 'Sign In' : 'Register'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
