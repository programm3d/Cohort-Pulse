import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useLocation } from 'react-router-dom';
import { Target, CheckCircle, AlertTriangle, Lock } from 'lucide-react';

const MilestoneCheckin: React.FC = () => {
    const [milestones, setMilestones] = useState<any[]>([]);
    const [selectedMilestone, setSelectedMilestone] = useState<string>('');
    const [completed, setCompleted] = useState<boolean | null>(null);
    const [blockerNote, setBlockerNote] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const location = useLocation();

    const fetchMilestones = async () => {
        try {
            const res = await apiClient.get('/checkins/milestones');
            const fetchedMilestones = res.data;
            setMilestones(fetchedMilestones);

            const searchParams = new URLSearchParams(location.search);
            const pendingId = searchParams.get('pending');

            // Only auto-select if the milestone hasn't been checked in yet
            if (pendingId) {
                const target = fetchedMilestones.find((m: any) => m._id === pendingId);
                if (target && !target.isCheckedIn) {
                    setSelectedMilestone(pendingId);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchMilestones();
    }, [location.search]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMilestone || completed === null) return;
        setError('');

        try {
            await apiClient.post('/checkins/milestone', {
                milestoneId: selectedMilestone,
                completed,
                blockerNote: completed ? '' : blockerNote
            });
            setSubmitted(true);
            // Re-fetch so the completed milestone moves to the "recorded" section
            fetchMilestones();
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to record milestone';
            setError(msg);
        }
    };

    // Split into pending vs already recorded
    const pendingMilestones = milestones.filter((m: any) => !m.isCheckedIn);
    const recordedMilestones = milestones.filter((m: any) => m.isCheckedIn);

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                <CheckCircle size={64} className="mb-6 text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                <h2 className="text-2xl font-bold">Milestone Check-in Saved</h2>
                <p className="text-slate-400 mt-2">Your progress has been recorded. Keep up the good work!</p>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setSelectedMilestone('');
                        setCompleted(null);
                        setBlockerNote('');
                        setError('');
                    }}
                    className="mt-8 text-primary hover:text-blue-400 transition-colors"
                >
                    Check-in another milestone →
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
                    <Target className="text-primary" /> Milestone Check-in
                </h2>
                <p className="text-slate-400">Time to review your progress against the schedule.</p>
            </div>

            {/* ── Already Recorded Section ──────────────────────────────────── */}
            {recordedMilestones.length > 0 && (
                <div className="bg-surface border border-slate-700/60 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-400" />
                        Already Recorded ({recordedMilestones.length})
                    </h3>
                    <div className="space-y-2">
                        {recordedMilestones.map((m: any) => (
                            <div key={m._id} className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-4 py-2.5">
                                <Lock size={14} className="text-emerald-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-200">{m.title}</p>
                                    <p className="text-xs text-slate-500">Deadline: {new Date(m.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full shrink-0">
                                    ✓ Recorded
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Check-in Form ─────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="bg-surface border border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl space-y-8">

                {error && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                        <AlertTriangle size={16} className="flex-shrink-0" />
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Select Milestone</label>
                    {pendingMilestones.length === 0 ? (
                        <div className="text-slate-500 italic p-4 bg-background border border-slate-700 rounded-lg text-sm text-center">
                            {milestones.length === 0
                                ? 'No milestones have been set for your cohort yet.'
                                : '🎉 All milestones have been recorded!'}
                        </div>
                    ) : (
                        <select
                            required
                            className="w-full bg-background border border-slate-600 rounded-lg p-3 focus:border-primary outline-none transition-colors"
                            value={selectedMilestone}
                            onChange={e => setSelectedMilestone(e.target.value)}
                        >
                            <option value="" disabled>Select a milestone to check in…</option>
                            {pendingMilestones.map(m => (
                                <option key={m._id} value={m._id}>
                                    {m.title} — Due {new Date(m.deadline).toLocaleDateString()}
                                    {m.isPastDeadlineAndPending ? ' ⚠️ Overdue' : ''}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {selectedMilestone && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div>
                            <label className="block text-sm font-medium mb-4 text-slate-300">Did you complete this milestone?</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setCompleted(true)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${completed === true
                                        ? 'border-secondary bg-secondary/10 text-secondary'
                                        : 'border-slate-700 bg-background text-slate-400 hover:border-slate-500'
                                        }`}
                                >
                                    <CheckCircle size={18} /> Yes, done!
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCompleted(false)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${completed === false
                                        ? 'border-danger bg-danger/10 text-danger'
                                        : 'border-slate-700 bg-background text-slate-400 hover:border-slate-500'
                                        }`}
                                >
                                    <AlertTriangle size={18} /> Not quite
                                </button>
                            </div>
                        </div>

                        {completed === false && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-medium mb-2 text-danger">What got in the way?</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Need more time, stuck on a bug, or lack resources?"
                                    className="w-full bg-background border border-danger/50 rounded-lg p-3 focus:border-danger outline-none transition-colors resize-none"
                                    value={blockerNote}
                                    onChange={e => setBlockerNote(e.target.value)}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={completed === null}
                            className="w-full bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
                        >
                            Record Progress
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default MilestoneCheckin;
