import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { Flame, ArrowUpRight, ChevronDown, Users, AlertCircle, Info } from 'lucide-react';

interface Cohort { _id: string; name: string }
interface HeatmapItem {
    _id: string;
    title: string;
    iHaveThisTooCount: number;
    createdAt: string;
}

const BlockerHeatmap: React.FC = () => {
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [selectedCohort, setSelectedCohort] = useState<string>('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
    const [totalInterns, setTotalInterns] = useState(0);
    const [loading, setLoading] = useState(true);

    // Initial load: cohorts
    useEffect(() => {
        apiClient.get('/cohorts/mine').then(res => {
            setCohorts(res.data);
            // Default to first cohort if available
            if (res.data.length > 0) setSelectedCohort(res.data[0]._id);
        }).catch(console.error);
    }, []);

    // Fetch heatmap when cohort changes
    useEffect(() => {
        const fetchHeatmap = async () => {
            setLoading(true);
            try {
                const url = selectedCohort ? `/admin/heatmap?cohortId=${selectedCohort}` : '/admin/heatmap';
                const res = await apiClient.get(url);
                // Backend now returns { totalInterns, data }
                setHeatmap(res.data.data || []);
                setTotalInterns(res.data.totalInterns || 0);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHeatmap();
    }, [selectedCohort]);

    const selectedCohortName = cohorts.find(c => c._id === selectedCohort)?.name || 'All My Cohorts';

    // A blocker is "Systemic" if it impacts > 25% of the cohort or > 10 people (arbitrary thresholds for demonstration)
    const getSystemicStatus = (impactCount: number) => {
        if (totalInterns === 0) return false;
        const percentage = (impactCount / totalInterns) * 100;
        return percentage >= 25 || impactCount >= 10;
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in" onClick={() => setDropdownOpen(false)}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700 pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-500/20 text-orange-500 rounded-xl">
                        <Flame size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-100">Blocker Heatmap</h2>
                        <p className="text-slate-400 mt-1">Identifying recurring technical hurdles and curriculum gaps.</p>
                    </div>
                </div>

                {/* Cohort Selector */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-surface border border-slate-700 rounded-xl text-sm font-medium text-slate-200 hover:border-orange-500/50 transition-all min-w-[200px]"
                    >
                        <Users size={16} className="text-slate-400" />
                        <span className="flex-1 text-left truncate">{selectedCohortName}</span>
                        <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-60 bg-surface border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <button
                                onClick={() => { setSelectedCohort(''); setDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-700/50 transition-colors ${selectedCohort === '' ? 'text-orange-400 font-semibold bg-orange-500/5' : 'text-slate-300'}`}
                            >
                                All My Cohorts
                            </button>
                            {cohorts.map(c => (
                                <button
                                    key={c._id}
                                    onClick={() => { setSelectedCohort(c._id); setDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-700/50 transition-colors ${c._id === selectedCohort ? 'text-orange-400 font-semibold bg-orange-500/5' : 'text-slate-300'}`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Legend / Info */}
            {!loading && heatmap.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                    <Info size={20} className="text-blue-400 mt-0.5" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Issues impacting more than <span className="text-blue-400 font-bold">25%</span> of the cohort are flagged as <span className="text-orange-400 font-bold uppercase tracking-wider">Systemic Issues</span>. These often indicate curriculum gaps or environment-wide configuration errors.
                    </p>
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : heatmap.length === 0 ? (
                    <div className="bg-surface border border-slate-700 rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                        <Users size={40} className="opacity-20" />
                        <p>No open blockers found for this selection.</p>
                    </div>
                ) : (
                    heatmap.map((b, index: number) => {
                        const impactedCount = b.iHaveThisTooCount + 1;
                        const isSystemic = getSystemicStatus(impactedCount);
                        const percentage = totalInterns > 0 ? Math.round((impactedCount / totalInterns) * 100) : 0;
                        const intensity = Math.max(0.15, 1 - (index * 0.1));

                        return (
                            <div key={b._id} className={`bg-surface border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all shadow-sm ${isSystemic ? 'border-orange-500/50 bg-orange-500/5 ring-1 ring-orange-500/20' : 'border-slate-700 hover:border-slate-600'}`}>
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl shadow-inner flex-shrink-0"
                                        style={{ backgroundColor: isSystemic ? '#f97316' : `rgba(249, 115, 22, ${intensity})`, color: '#fff' }}>
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-lg font-semibold text-slate-200 group-hover:text-orange-400 transition-colors truncate">{b.title}</h4>
                                            {isSystemic && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-tighter">
                                                    <AlertCircle size={10} /> Systemic
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span>Posted {new Date(b.createdAt).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span className={isSystemic ? 'text-orange-400 font-medium' : ''}>{percentage}% impact rate</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold flex items-center gap-1 justify-end ${isSystemic ? 'text-orange-500' : 'text-slate-200'}`}>
                                            {impactedCount} <Users size={18} className="text-slate-600" />
                                        </div>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Interns Stalled</span>
                                    </div>
                                    <div className="p-2 bg-slate-800 rounded-lg text-slate-500 cursor-not-allowed opacity-50" title="Detail view coming soon">
                                        <ArrowUpRight size={20} />
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default BlockerHeatmap;
