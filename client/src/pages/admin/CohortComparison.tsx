import React, { useState, useEffect, useCallback } from 'react';
import { GitCompareArrows, ChevronDown, Users, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import apiClient from '../../api/client';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Legend
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Cohort { _id: string; name: string }
interface CompStats {
    avgMood: number;
    avgEnergy: number;
    milestoneRate: number;
    blockerCount: number;
    name: string;
}
interface WeekData {
    week: string;
    moodA: number;
    moodB: number;
    energyA: number;
    energyB: number;
}
interface ComparisonResponse {
    statsA: CompStats;
    statsB: CompStats;
    weeks: WeekData[];
}

const CohortComparison: React.FC = () => {
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [selectedA, setSelectedA] = useState<string>('');
    const [selectedB, setSelectedB] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [compData, setCompData] = useState<ComparisonResponse | null>(null);

    // Initial load: cohorts
    useEffect(() => {
        apiClient.get('/cohorts/mine').then(res => {
            setCohorts(res.data);
            if (res.data.length >= 2) {
                setSelectedA(res.data[0]._id);
                setSelectedB(res.data[1]._id);
            } else if (res.data.length === 1) {
                setSelectedA(res.data[0]._id);
            }
        }).catch(console.error);
    }, []);

    const fetchComparison = useCallback(async (idA: string, idB: string) => {
        if (!idA || !idB || idA === idB) return;
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get(`/admin/comparison?cohortA=${idA}&cohortB=${idB}`);
            setCompData(res.data);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to fetch comparison data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedA && selectedB && selectedA !== selectedB) {
            fetchComparison(selectedA, selectedB);
        }
    }, [selectedA, selectedB, fetchComparison]);

    const statsConfig = [
        { label: 'Avg Mood', key: 'avgMood', suffix: '' },
        { label: 'Avg Energy', key: 'avgEnergy', suffix: '' },
        { label: 'Milestone Rate', key: 'milestoneRate', suffix: '%' },
        { label: 'Total Blockers', key: 'blockerCount', suffix: '' },
    ];

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                        <GitCompareArrows size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100">Cohort Comparison</h2>
                        <p className="text-slate-400 mt-1">Cross-sectional analysis of batch performance relative to start dates.</p>
                    </div>
                </div>
            </div>

            {/* Cohort Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-surface border border-slate-700 rounded-2xl p-6 shadow-xl relative z-20">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-primary uppercase tracking-wider px-1">Cohort A (Base)</label>
                    <div className="relative">
                        <select
                            value={selectedA}
                            onChange={(e) => setSelectedA(e.target.value)}
                            className="w-full bg-background border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-primary appearance-none hover:border-slate-600 transition-all"
                        >
                            {cohorts.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider px-1">Cohort B (Compare)</label>
                    <div className="relative">
                        <select
                            value={selectedB}
                            onChange={(e) => setSelectedB(e.target.value)}
                            className="w-full bg-background border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-secondary appearance-none hover:border-slate-600 transition-all"
                        >
                            {cohorts.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    </div>
                </div>

                {selectedA === selectedB && selectedA !== '' && (
                    <div className="md:col-span-2 flex items-center gap-2 text-amber-500 text-xs font-medium justify-center mt-2">
                        <AlertTriangle size={14} /> Please select two different cohorts to compare.
                    </div>
                )}
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm animate-pulse">Running data groups and normalising week indexes...</p>
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-12 text-center text-red-400">
                    <p>{error}</p>
                </div>
            ) : compData ? (
                <div className="space-y-8">
                    {/* Stats Comparison Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {statsConfig.map((config) => {
                            const valA = (compData.statsA as any)[config.key];
                            const valB = (compData.statsB as any)[config.key];
                            // For blockers, lower is better. For others, higher is better.
                            const aBetter = config.key === 'blockerCount' ? valA < valB : valA > valB;
                            const bBetter = config.key === 'blockerCount' ? valB < valA : valB > valA;

                            return (
                                <div key={config.label} className="bg-surface border border-slate-700/60 rounded-2xl p-5 hover:border-slate-600 transition-all group shadow-lg">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 flex items-center justify-between">
                                        {config.label}
                                        {aBetter ? <TrendingUp size={12} className="text-primary" /> : <TrendingDown size={12} className="text-secondary" />}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="text-center flex-1">
                                            <p className={`text-2xl font-bold ${aBetter ? 'text-primary' : 'text-slate-400 opacity-60'}`}>
                                                {typeof valA === 'number' && valA % 1 !== 0 ? valA.toFixed(1) : valA}{config.suffix}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Cohort A</p>
                                        </div>
                                        <div className="h-8 w-px bg-slate-800 mx-2" />
                                        <div className="text-center flex-1">
                                            <p className={`text-2xl font-bold ${bBetter ? 'text-secondary' : 'text-slate-400 opacity-60'}`}>
                                                {typeof valB === 'number' && valB % 1 !== 0 ? valB.toFixed(1) : valB}{config.suffix}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">Cohort B</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-surface border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Users size={80} />
                            </div>
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <TrendingUp size={20} className="text-indigo-400" /> Mood Divergence
                            </h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={compData.weeks}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="week" stroke="#475569" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="#475569" domain={[0, 10]} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }} />
                                        <Legend verticalAlign="top" height={36} />
                                        <Line type="monotone" dataKey="moodA" name={compData.statsA.name} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="moodB" name={compData.statsB.name} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} strokeDasharray="5 5" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-surface border border-slate-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <Users size={20} className="text-primary" /> Energy Curve Overlay
                            </h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={compData.weeks}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="week" stroke="#475569" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="#475569" domain={[0, 10]} />
                                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }} />
                                        <Legend verticalAlign="top" height={36} />
                                        <Line type="monotone" dataKey="energyA" name={compData.statsA.name} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="energyB" name={compData.statsB.name} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} strokeDasharray="5 5" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500/5 via-surface to-slate-900/50 border border-slate-700/60 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                        <div className="p-5 bg-indigo-500/10 rounded-full">
                            <Info size={40} className="text-indigo-400" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <h3 className="text-xl font-bold text-slate-100">Understanding Time-Shifted Comparison</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                This view overlays cohorts based on their relative <span className="text-indigo-400 font-bold italic">Week Number</span> rather than calendar dates.
                                This allows you to identify if specific curriculum phases (e.g., Week 3 - Frontend Deep Dive) consistently correlate with drops in energy or mood across different batches.
                            </p>
                            <p className="text-indigo-400/80 text-sm font-medium">
                                Use these signals to adjust curriculum pacing for future cohorts.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-slate-500">
                    <GitCompareArrows size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Select two cohorts to start the comparison.</p>
                </div>
            )}
        </div>
    );
};

const Info: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
    <svg
        width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

export default CohortComparison;
