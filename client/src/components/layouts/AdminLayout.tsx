import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Flame, FileText, LogOut, GitCompare, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLayout: React.FC = () => {
    const { user, logout } = useAuth();

    const links = [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/risk-radar', icon: AlertTriangle, label: 'Risk Radar' },
        { to: '/admin/blocker-heatmap', icon: Flame, label: 'Blocker Heatmap' },
        { to: '/admin/cohort-comparison', icon: GitCompare, label: 'Comparison' },
        { to: '/admin/insights', icon: FileText, label: 'Anon Insights' },
        { to: '/admin/cohorts', icon: Users, label: 'Cohorts' }
    ];

    return (
        <div className="min-h-screen bg-background text-slate-200 flex flex-col md:flex-row">
            {/* Sidebar Desktop / Navbar Mobile */}
            <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-700 bg-surface/50 backdrop-blur-md flex-shrink-0 flex flex-col justify-between">
                <div className="p-4 md:p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-8 hidden md:block">
                        Cohort Pulse <span className="text-xs text-primary block mt-1">Admin Panel</span>
                    </h1>
                    <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                        {links.map(link => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${isActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                    }`
                                }
                            >
                                <link.icon size={20} />
                                <span className="hidden md:inline">{link.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="p-4 md:p-6 border-t border-slate-700/50 hidden md:block">
                    <div className="flex items-center justify-between">
                        <div className="truncate pr-2">
                            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.role}</p>
                        </div>
                        <button onClick={logout} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-danger">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
