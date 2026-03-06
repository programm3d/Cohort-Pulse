import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { AlertTriangle, TrendingDown, CalendarX, Users, RefreshCw } from 'lucide-react';

interface FlaggedIntern {
    internId: string;
    name: string;
    email: string;
    cohortName: string;
    missedCheckIns: number;
    missedTwoPlusDays: boolean;
    moodDeclining5Days: boolean;
    avgMood: number | null;
    moodSparkline: { date: string; mood: number }[];
    riskLevel: 'critical' | 'high';
}

// ── Tiny inline sparkline ─────────────────────────────────────────────────────
const MoodSparkline: React.FC<{ data: { mood: number }[] }> = ({ data }) => {
    if (!data.length) return <span className="text-xs text-slate-600 italic">No data</span>;
    const max = 10;
    const w = 100;
    const h = 32;
    const step = w / (data.length - 1 || 1);

    const points = data.map((d, i) => {
        const x = i * step;
        const y = h - (d.mood / max) * h;
        return `${x},${y}`;
    }).join(' ');

    // Is the trend going down? Last value < first
    const isDown = data.length >= 2 && data[data.length - 1].mood < data[0].mood;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-24 h-8" preserveAspectRatio="none">
            <polyline
                points={points}
                fill="none"
                stroke={isDown ? '#ef4444' : '#3b82f6'}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {data.map((d, i) => (
                <circle
                    key={i}
                    cx={i * step}
                    cy={h - (d.mood / max) * h}
                    r="2.5"
                    fill={isDown ? '#ef4444' : '#3b82f6'}
                />
            ))}
        </svg>
    );
};

// ── Risk Card ─────────────────────────────────────────────────────────────────
const RiskCard: React.FC<{ intern: FlaggedIntern }> = ({ intern }) => {
    const isCritical = intern.riskLevel === 'critical';

    return (
        <div className={`bg-surface border ${isCritical ? 'border-red-500/40' : 'border-orange-500/30'} rounded-2xl p-6 shadow-lg relative overflow-hidden group hover:border-opacity-70 transition-all duration-200`}>
            {/* Glow */}
            <div className={`absolute top-0 right-0 w-28 h-28 ${isCritical ? 'bg-red-500/10' : 'bg-orange-500/8'} rounded-full blur-2xl group-hover:opacity-150 transition-opacity`} />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-100 truncate">{intern.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{intern.email}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{intern.cohortName}</p>
                </div>
                <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${isCritical
                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                    : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                    }`}>
                    {isCritical ? '🔴 Critical' : '🟠 High Risk'}
                </span>
            </div>

            {/* Signals */}
            <div className="space-y-2.5 relative z-10">
                {/* Signal 1: Missed check-ins */}
                <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${intern.missedTwoPlusDays ? 'bg-orange-500/8 border border-orange-500/20' : 'bg-slate-800/40 border border-slate-700/30'}`}>
                    <CalendarX size={15} className={intern.missedTwoPlusDays ? 'text-orange-400' : 'text-slate-600'} />
                    <div className="flex-1">
                        <span className="text-sm text-slate-300">
                            Missed <strong className={intern.missedTwoPlusDays ? 'text-orange-400' : 'text-slate-400'}>{intern.missedCheckIns}</strong> of last 7 daily check-ins
                        </span>
                    </div>
                    {intern.missedTwoPlusDays && (
                        <span className="text-xs text-orange-400 font-semibold">⚠ Flagged</span>
                    )}
                </div>

                {/* Signal 2: Declining mood */}
                <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${intern.moodDeclining5Days ? 'bg-red-500/8 border border-red-500/20' : 'bg-slate-800/40 border border-slate-700/30'}`}>
                    <TrendingDown size={15} className={intern.moodDeclining5Days ? 'text-red-400' : 'text-slate-600'} />
                    <div className="flex-1">
                        <span className="text-sm text-slate-300">
                            Mood trend {intern.avgMood !== null
                                ? <strong className={intern.moodDeclining5Days ? 'text-red-400' : 'text-slate-400'}>{intern.avgMood}/10 avg</strong>
                                : <span className="text-slate-600">no data</span>}
                        </span>
                    </div>
                    {intern.moodDeclining5Days && (
                        <span className="text-xs text-red-400 font-semibold">⚠ Declining</span>
                    )}
                </div>

                {/* Sparkline */}
                {intern.moodSparkline.length > 0 && (
                    <div className="flex items-center gap-3 mt-1 px-1">
                        <span className="text-xs text-slate-600">7-day mood</span>
                        <MoodSparkline data={intern.moodSparkline} />
                        <div className="flex gap-1 ml-auto">
                            {intern.moodSparkline.map((d, i) => (
                                <div
                                    key={i}
                                    title={`${d.date}: ${d.mood}/10`}
                                    className="w-1.5 rounded-t-sm"
                                    style={{
                                        height: `${(d.mood / 10) * 24}px`,
                                        minHeight: '2px',
                                        backgroundColor: d.mood >= 7 ? '#10b981' : d.mood >= 4 ? '#f59e0b' : '#ef4444'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const RiskRadar: React.FC = () => {
    const [flagged, setFlagged] = useState<FlaggedIntern[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchRisk = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/admin/risk-radar');
            setFlagged(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRisk(); }, []);

    const critical = flagged.filter(f => f.riskLevel === 'critical');
    const high = flagged.filter(f => f.riskLevel === 'high');

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in">

            {/* ── Header ───────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-700 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-danger/20 text-danger rounded-xl">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-danger to-orange-500 bg-clip-text text-transparent">Risk Radar</h2>
                        <p className="text-slate-400 mt-1 text-sm">
                            Flags interns who <strong className="text-orange-400">missed 2+ daily check-ins</strong> or have a <strong className="text-red-400">5-day declining mood trend</strong>.
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchRisk}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-surface border border-slate-700 rounded-lg text-sm text-slate-400 hover:border-slate-500 transition-colors disabled:opacity-50 shrink-0"
                    title="Refresh"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* ── Summary Pill ─────────────────────────────────────────────── */}
            {!loading && flagged.length > 0 && (
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full text-sm">
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-red-400 font-semibold">{critical.length} Critical</span>
                        <span className="text-slate-600">(both signals)</span>
                    </div>
                    <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full text-sm">
                        <span className="w-2 h-2 rounded-full bg-orange-400" />
                        <span className="text-orange-400 font-semibold">{high.length} High Risk</span>
                        <span className="text-slate-600">(one signal)</span>
                    </div>
                    {lastUpdated && (
                        <span className="text-xs text-slate-600 ml-auto">
                            Last scanned: {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
            )}

            {/* ── Content ──────────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Scanning cohort data…</span>
                </div>
            ) : flagged.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-500">
                    <Users size={48} className="opacity-20" />
                    <p className="text-lg font-medium text-slate-400">All clear! 🎉</p>
                    <p className="text-sm text-center max-w-sm">
                        No interns have missed 2+ check-ins or shown a 5-day declining mood this week.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Critical first */}
                    {critical.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse inline-block" />
                                Critical — Both Signals Active
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {critical.map(intern => <RiskCard key={intern.internId.toString()} intern={intern} />)}
                            </div>
                        </div>
                    )}

                    {/* High risk next */}
                    {high.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                                High Risk — One Signal Active
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {high.map(intern => <RiskCard key={intern.internId.toString()} intern={intern} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RiskRadar;
