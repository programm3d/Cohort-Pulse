import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Flame, FileText, LogOut, GitCompare, Users, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

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
            <aside className={`w-full ${isCollapsed ? 'md:w-20' : 'md:w-64'} transition-all duration-300 border-b md:border-b-0 md:border-r border-slate-700 bg-surface/50 backdrop-blur-md flex-shrink-0 flex flex-col justify-between`}>
                <div className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-8 hidden md:flex">
                        {!isCollapsed && (
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate pr-2">
                                Cohort Pulse <span className="text-xs text-primary block mt-1">Admin Panel</span>
                            </h1>
                        )}
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors mx-auto md:mx-0"
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                        </button>
                    </div>

                    <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                        {links.map(link => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                title={isCollapsed ? link.label : undefined}
                                className={({ isActive }) =>
                                    `flex items-center ${isCollapsed ? 'justify-center w-12 h-12 px-0 mx-auto' : 'gap-3 px-4 py-3'} rounded-xl transition-all whitespace-nowrap ${isActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                    }`
                                }
                            >
                                <link.icon size={20} className="flex-shrink-0" />
                                {!isCollapsed && <span className="hidden md:inline">{link.label}</span>}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className={`p-4 ${isCollapsed ? 'md:p-4 flex justify-center' : 'md:p-6'} border-t border-slate-700/50 hidden md:flex items-center justify-between`}>
                    {!isCollapsed && (
                        <div className="truncate pr-2">
                            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.role}</p>
                        </div>
                    )}
                    <button onClick={logout} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-danger" title="Logout">
                        <LogOut size={18} />
                    </button>
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
