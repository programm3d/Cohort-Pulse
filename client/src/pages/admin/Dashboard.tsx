import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import {
    ChevronDown, Smile, Flame, Target, Users, Activity,
    TrendingUp, CheckCircle2, LogOut, AlertTriangle, ArrowUpRight,
    MessageSquare, Zap, BarChart2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Cell, LabelList
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Cohort { _id: string; name: string; startDate: string }
interface DashboardStats { avgMood: number; avgEnergy: number; milestoneRate: number; activeInterns: number }
interface MoodPoint { day: string; date: string; avgMood: number }
interface EnergyPoint { week: string; avgEnergy: number; avgConfidence: number }
interface MilestoneRate { milestoneId: string; title: string; deadline: string; completed: number; total: number; rate: number }
interface MilestoneBlocker {
    internName: string;
    internEmail: string;
    milestoneTitle: string;
    blockerNote: string;
    date: string;
}

// ─── Health Badge ─────────────────────────────────────────────────────────────
const HealthBadge: React.FC<{ avgMood: number }> = ({ avgMood }) => {
    if (avgMood === 0) return null;
    if (avgMood >= 7) return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-sm font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Healthy Cohort
        </span>
    );
    if (avgMood >= 4) return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-sm font-semibold border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Needs Attention
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-sm font-semibold border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Struggling
        </span>
    );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
        <BarChart2 size={32} className="opacity-30" />
        <p className="text-sm">{message}</p>
    </div>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner: React.FC = () => (
    <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }> = ({ label, value, icon, color, sub }) => (
    <div className="bg-surface border border-slate-700/60 rounded-2xl p-5 flex items-center gap-4 shadow-lg hover:border-slate-600 transition-all duration-300">
        <div className={`p-3.5 rounded-xl ${color} flex-shrink-0`}>{icon}</div>
        <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
            <h3 className="text-2xl font-bold text-slate-100 mt-0.5">{value}</h3>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
    </div>
);

// ─── Milestone bar colour ─────────────────────────────────────────────────────
const milestoneColor = (rate: number) => rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444';

// ─── Custom Tooltip style ─────────────────────────────────────────────────────
const tooltipStyle = { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px', fontSize: '13px' };

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();

    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [selectedCohort, setSelectedCohort] = useState<string>('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [cohortsLoading, setCohortsLoading] = useState(true);

    const [stats, setStats] = useState<DashboardStats>({ avgMood: 0, avgEnergy: 0, milestoneRate: 0, activeInterns: 0 });
    const [moodTrend, setMoodTrend] = useState<MoodPoint[]>([]);
    const [energyCurve, setEnergyCurve] = useState<EnergyPoint[]>([]);
    const [milestoneRates, setMilestoneRates] = useState<MilestoneRate[]>([]);
    const [milestoneBlockers, setMilestoneBlockers] = useState<MilestoneBlocker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── Step 1: Fetch admin's cohorts first ───────────────────────────────────
    useEffect(() => {
        setCohortsLoading(true);
        apiClient.get('/cohorts/mine')
            .then(res => {
                const list: Cohort[] = res.data;
                setCohorts(list);
                if (list.length > 0) setSelectedCohort(list[0]._id);
            })
            .catch(err => {
                console.error('Failed to load cohorts:', err);
                setError('Failed to load your cohorts.');
            })
            .finally(() => setCohortsLoading(false));
    }, []);

    // ── Step 2: Fetch dashboard data when cohort is resolved ──────────────────
    const fetchAll = useCallback(async (cohortId: string) => {
        setLoading(true);
        setError(null);
        try {
            const [dashRes, moodRes, energyRes, rateRes, blockerRes] = await Promise.all([
                apiClient.get(`/admin/dashboard?cohortId=${cohortId}`),
                apiClient.get(`/admin/mood-trend?cohortId=${cohortId}`),
                apiClient.get(`/admin/energy-curve?cohortId=${cohortId}`),
                apiClient.get(`/admin/milestone-rates?cohortId=${cohortId}`),
                apiClient.get(`/admin/milestone-blockers?cohortId=${cohortId}`)
            ]);
            setStats(dashRes.data);
            setMoodTrend(Array.isArray(moodRes.data) ? moodRes.data : []);
            setEnergyCurve(Array.isArray(energyRes.data) ? energyRes.data : []);
            setMilestoneRates(Array.isArray(rateRes.data) ? rateRes.data : []);
            setMilestoneBlockers(Array.isArray(blockerRes.data) ? blockerRes.data : []);
        } catch (err: any) {
            console.error('Dashboard fetch error:', err);
            const msg = err?.response?.data?.message || err?.message || 'Failed to load dashboard data';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [apiClient]);

    useEffect(() => {
        if (selectedCohort) {
            fetchAll(selectedCohort);
        }
    }, [selectedCohort, fetchAll]);

    const selectedCohortName = cohorts.find(c => c._id === selectedCohort)?.name || '';
    const noCohorts = !cohortsLoading && cohorts.length === 0;

    return (
        <div className="min-h-screen bg-background text-slate-200" onClick={() => setDropdownOpen(false)}>
            <header className="border-b border-slate-700 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap">
                            Cohort Dashboard
                        </h1>

                        {!cohortsLoading && cohorts.length > 0 && (
                            <div className="relative" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => setDropdownOpen(o => !o)}
                                    className="flex items-center gap-2 px-4 py-2 bg-surface border border-slate-700 rounded-xl text-sm font-medium text-slate-200 hover:border-primary/50 transition-all duration-200 min-w-[160px]"
                                >
                                    <span className="flex-1 text-left truncate">{selectedCohortName || 'Select Cohort'}</span>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {dropdownOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-60 bg-surface border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                                        {cohorts.map(c => (
                                            <button
                                                key={c._id}
                                                onClick={() => { setSelectedCohort(c._id); setDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-700/50 transition-colors ${c._id === selectedCohort ? 'text-primary font-semibold bg-primary/5' : 'text-slate-300'}`}
                                            >
                                                {c.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        <HealthBadge avgMood={stats.avgMood} />
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-400 hidden sm:block">Hi, {user?.name}</span>
                        <button onClick={logout} className="p-2 hover:bg-slate-700 rounded-full transition-colors" title="Logout">
                            <LogOut size={18} className="text-slate-300" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                {error && (
                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                        <AlertTriangle size={18} className="flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {noCohorts ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
                        <Users size={48} className="opacity-20" />
                        <p className="text-lg font-medium text-slate-400">No cohorts yet</p>
                        <Link to="/admin/cohorts" className="mt-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/80 transition-colors">
                            Create a Cohort →
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KpiCard label="Avg Mood" value={stats.avgMood > 0 ? `${stats.avgMood}/10` : '—'} icon={<Smile size={22} />} color="bg-blue-500/20 text-blue-400" sub="All daily check-ins" />
                            <KpiCard label="Avg Energy" value={stats.avgEnergy > 0 ? `${stats.avgEnergy}/10` : '—'} icon={<Flame size={22} />} color="bg-orange-500/20 text-orange-400" sub="Weekly pulse avg" />
                            <KpiCard label="Milestone Rate" value={stats.milestoneRate > 0 ? `${stats.milestoneRate}%` : '—'} icon={<Target size={22} />} color="bg-purple-500/20 text-purple-400" sub="Completion rate" />
                            <KpiCard label="Active Interns" value={stats.activeInterns || '—'} icon={<Users size={22} />} color="bg-emerald-500/20 text-emerald-400" sub="In this cohort" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Daily Mood Trend */}
                            <div className="bg-surface border border-slate-700/60 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-500/15 rounded-lg"><Activity size={18} className="text-blue-400" /></div>
                                    <h3 className="font-semibold text-base">Daily Mood Trend</h3>
                                </div>
                                <div className="h-52">
                                    {loading ? <Spinner /> : moodTrend.length === 0 ? <EmptyChart message="No check-ins yet" /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={moodTrend}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 12 }} />
                                                <YAxis stroke="#475569" domain={[0, 10]} tick={{ fontSize: 12 }} />
                                                <RechartsTooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}/10`, 'Avg Mood']} />
                                                <Line type="monotone" dataKey="avgMood" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Weekly Energy Curve */}
                            <div className="bg-surface border border-slate-700/60 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-orange-500/15 rounded-lg"><TrendingUp size={18} className="text-orange-400" /></div>
                                    <h3 className="font-semibold text-base">Weekly Energy & Confidence</h3>
                                </div>
                                <div className="h-52">
                                    {loading ? <Spinner /> : energyCurve.length === 0 ? <EmptyChart message="No pulses yet" /> : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={energyCurve} barGap={4}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis dataKey="week" stroke="#475569" tick={{ fontSize: 12 }} />
                                                <YAxis stroke="#475569" domain={[0, 10]} tick={{ fontSize: 12 }} />
                                                <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: '#334155', opacity: 0.4 }} />
                                                <Bar dataKey="avgEnergy" fill="#f97316" radius={[4, 4, 0, 0]} name="Energy" maxBarSize={32} />
                                                <Bar dataKey="avgConfidence" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Confidence" maxBarSize={32} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Milestone Completion */}
                        <div className="bg-surface border border-slate-700/60 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-500/15 rounded-lg"><CheckCircle2 size={18} className="text-purple-400" /></div>
                                <h3 className="font-semibold text-base">Milestone Completion Rates</h3>
                            </div>
                            <div className="h-64">
                                {loading ? <Spinner /> : milestoneRates.length === 0 ? <EmptyChart message="No milestones set" /> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={milestoneRates} layout="vertical" margin={{ left: 8, right: 48 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                            <XAxis type="number" domain={[0, 100]} hide />
                                            <YAxis type="category" dataKey="title" stroke="#94a3b8" tick={{ fontSize: 12 }} width={120} />
                                            <RechartsTooltip contentStyle={tooltipStyle} />
                                            <Bar dataKey="rate" radius={[0, 4, 4, 0]} maxBarSize={24}>
                                                {milestoneRates.map((m, i) => <Cell key={i} fill={milestoneColor(m.rate)} />)}
                                                <LabelList dataKey="rate" position="right" formatter={(v: any) => `${v}%`} style={{ fontSize: 12, fill: '#94a3b8' }} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Quick Feedback Section */}
                        <div className="bg-surface border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                        <MessageSquare size={20} className="text-primary" /> Quick Feedback
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">Direct notes from interns stuck on milestones.</p>
                                </div>
                            </div>

                            {loading ? <div className="h-40"><Spinner /></div> : milestoneBlockers.length === 0 ? (
                                <div className="bg-background/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-500 italic">
                                    No milestone blockers reported for this cohort.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {milestoneBlockers.slice(0, 6).map((b, i) => (
                                        <div key={i} className="bg-background/40 border border-slate-700/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{b.milestoneTitle}</span>
                                                <span className="text-[10px] text-slate-600">{new Date(b.date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-slate-200 line-clamp-3 mb-3 italic">"{b.blockerNote}"</p>
                                            <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                                                <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-300">
                                                    {b.internName.charAt(0)}
                                                </div>
                                                <p className="text-[10px] font-medium text-slate-400 truncate">{b.internName}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-6 text-center">
                                <Link to="/admin/risk-radar" className="text-xs text-primary hover:text-blue-400 font-medium transition-colors inline-flex items-center gap-1">
                                    Check Risk Radar for Critical Issues <ArrowUpRight size={14} />
                                </Link>
                            </div>
                        </div>

                        {/* Secondary Nav tiles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link to="/admin/blocker-heatmap" className="bg-surface/50 border border-slate-700/50 rounded-2xl p-5 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all">
                                <h3 className="font-semibold text-orange-400 mb-1 flex items-center gap-2"><Flame size={18} /> Blocker Heatmap</h3>
                                <p className="text-sm text-slate-400">Common technical hurdles across all interns</p>
                            </Link>
                            <Link to="/admin/insights" className="bg-surface/50 border border-slate-700/50 rounded-2xl p-5 hover:border-primary/40 hover:bg-primary/5 transition-all">
                                <h3 className="font-semibold text-primary mb-1 flex items-center gap-2"><Zap size={18} /> Anonymous Insights</h3>
                                <p className="text-sm text-slate-400">Themes from weekly pulse open feedback</p>
                            </Link>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
