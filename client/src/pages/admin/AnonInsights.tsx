import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import {
    FileText, EyeOff, ChevronDown, Users, MessageSquare,
    Binary, HelpCircle, Zap, ShieldAlert, BarChart,
    ArrowRight, MessageCircle, AlertTriangle
} from 'lucide-react';

interface Cohort { _id: string; name: string }

interface Theme {
    name: string;
    count: number;
    responses: { text: string; type: string; date: string }[];
}

interface InsightsResponse {
    themes: Theme[];
    allResponses: { text: string; type: string; date: string }[];
    generalCount: number;
}

const AnonInsights: React.FC = () => {
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [selectedCohort, setSelectedCohort] = useState<string>('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [data, setData] = useState<InsightsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTheme, setActiveTheme] = useState<string | null>(null);

    // Initial load: cohorts
    useEffect(() => {
        apiClient.get('/cohorts/mine').then(res => {
            setCohorts(res.data);
            if (res.data.length > 0) setSelectedCohort(res.data[0]._id);
        }).catch(console.error);
    }, []);

    // Fetch insights when cohort changes
    useEffect(() => {
        const fetchInsights = async () => {
            setLoading(true);
            try {
                const url = selectedCohort ? `/admin/insights?cohortId=${selectedCohort}` : '/admin/insights';
                const res = await apiClient.get(url);
                setData(res.data);
                // Reset active theme when data changes
                setActiveTheme(null);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, [selectedCohort]);

    const selectedCohortName = cohorts.find(c => c._id === selectedCohort)?.name || 'All My Cohorts';

    const getThemeIcon = (name: string) => {
        if (name.includes('Workload')) return <ShieldAlert size={20} className="text-red-400" />;
        if (name.includes('Clarity')) return <HelpCircle size={20} className="text-amber-400" />;
        if (name.includes('Pacing')) return <Zap size={20} className="text-blue-400" />;
        if (name.includes('Technical')) return <Binary size={20} className="text-indigo-400" />;
        if (name.includes('Positive')) return <Zap size={20} className="text-emerald-400" />;
        return <MessageSquare size={20} className="text-slate-400" />;
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in" onClick={() => setDropdownOpen(false)}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                        <BarChart size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100">Emotional Climate</h2>
                        <p className="text-slate-400 mt-1">Anonymous thematic analytics to surface the real cohort sentiment.</p>
                    </div>
                </div>

                {/* Cohort Selector */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-surface border border-slate-700 rounded-xl text-sm font-medium text-slate-200 hover:border-primary/50 transition-all min-w-[200px]"
                    >
                        <Users size={16} className="text-slate-400" />
                        <span className="flex-1 text-left truncate">{selectedCohortName}</span>
                        <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <button
                                onClick={() => { setSelectedCohort(''); setDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-700/50 transition-colors ${selectedCohort === '' ? 'text-primary font-semibold bg-primary/5' : 'text-slate-300'}`}
                            >
                                All My Cohorts
                            </button>
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
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm animate-pulse">Running thematic analysis...</p>
                </div>
            ) : !data || data.allResponses.length === 0 ? (
                <div className="col-span-full border border-slate-700/50 border-dashed rounded-2xl p-24 text-center text-slate-500 flex flex-col items-center gap-4">
                    <EyeOff size={48} className="opacity-10" />
                    <p className="text-lg">No anonymous responses collected for this period.</p>
                    <p className="text-sm max-w-sm">Feedback from weekly pulses and anonymous blockers will appear here as themes.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Thematic Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.themes.map((theme) => (
                            <button
                                key={theme.name}
                                onClick={() => setActiveTheme(activeTheme === theme.name ? null : theme.name)}
                                className={`bg-surface border rounded-2xl p-6 text-left transition-all hover:bg-surface/80 group relative overflow-hidden ${activeTheme === theme.name ? 'ring-2 ring-primary border-primary/50 translate-y-[-4px]' : 'border-slate-700 shadow-lg'}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-2.5 bg-slate-800 rounded-xl group-hover:scale-110 transition-transform">
                                        {getThemeIcon(theme.name)}
                                    </div>
                                    <span className="text-2xl font-black text-slate-700 group-hover:text-primary/20 transition-colors">
                                        {theme.count}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-100 group-hover:text-primary transition-colors">{theme.name}</h3>
                                <p className="text-sm text-slate-500 mt-2">
                                    {theme.count} interns mentioned this theme in recent feedback.
                                </p>
                                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Related Feedback <ArrowRight size={14} />
                                </div>
                                {activeTheme === theme.name && (
                                    <div className="absolute bottom-0 left-0 h-1 bg-primary w-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Theme Drill-down or General Feed */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                                {activeTheme ? (
                                    <>
                                        {getThemeIcon(activeTheme)} Theme: {activeTheme}
                                        <button
                                            onClick={() => setActiveTheme(null)}
                                            className="text-xs font-medium text-slate-500 hover:text-primary ml-4"
                                        >
                                            Reset View
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle size={22} className="text-slate-400" /> Recent Anonymous Stream
                                    </>
                                )}
                            </h3>
                            {!activeTheme && (
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">
                                    Showing last {data.allResponses.length} raw responses
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(activeTheme ? data.themes.find(t => t.name === activeTheme)?.responses : data.allResponses)?.map((resp, i) => (
                                <div key={i} className="bg-surface/40 border border-slate-700/40 rounded-2xl p-6 hover:bg-surface/60 hover:border-slate-700 transition-all group">
                                    <div className="flex items-center justify-between mb-5">
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${resp.type === 'Weekly Pulse'
                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                            }`}>
                                            {resp.type}
                                        </span>
                                        <span className="text-[10px] text-slate-600 font-medium">
                                            {new Date(resp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="mt-1 text-slate-600 group-hover:text-primary/40 transition-colors">
                                            <FileText size={18} />
                                        </div>
                                        <p className="text-slate-300 leading-relaxed text-sm italic py-1">
                                            "{resp.text}"
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Insight summary cards */}
                    <div className="space-y-4">
                        {!activeTheme && data.themes.some(t => t.name === 'Workload & Stress' && t.count > 3) && (
                            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 flex items-center gap-6">
                                <div className="p-4 bg-red-500/10 rounded-full">
                                    <AlertTriangle size={32} className="text-red-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-red-200">Systemic Stress Detected</h4>
                                    <p className="text-sm text-slate-400 mt-1">
                                        A significant portion of the cohort mentions being <span className="text-red-400 font-bold italic">overwhelmed</span>.
                                        Consider reviewing the current week's workload or scheduling a check-in call with the batch.
                                    </p>
                                </div>
                            </div>
                        )}
                        {!activeTheme && data.themes.some(t => t.name === 'Clarity & Expectations' && t.count > 2) && (
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-8 flex items-center gap-6">
                                <div className="p-4 bg-amber-500/10 rounded-full">
                                    <HelpCircle size={32} className="text-amber-400" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-amber-200">Direction Unclear</h4>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Several interns feel <span className="text-amber-400 font-bold italic">unclear about expectations</span>.
                                        Consider posting an announcement clarifying the week's primary goals and evaluation criteria.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnonInsights;
