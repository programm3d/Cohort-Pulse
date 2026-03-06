import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';
import { Plus, Copy, Users, Calendar, AlertCircle, Check, AlertTriangle, ChevronDown, Target } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Intern {
    _id: string;
    name: string;
    email: string;
}

interface MissedCheckInItem {
    intern: Intern;
    missedDaily: boolean;
    missedWeekly: boolean;
    missedMilestones: string[];
}

interface Cohort {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
    description: string;
    internCount: number;
    interns: Intern[];
}

interface Milestone {
    _id: string;
    title: string;
    description?: string;
    deadline: string;
}

// ─── Milestone Panel (per cohort) ─────────────────────────────────────────────
const MilestonePanel: React.FC<{ cohortId: string }> = ({ cohortId }) => {
    const [open, setOpen] = useState(false);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');

    const fetchMilestones = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/admin/milestones?cohortId=${cohortId}`);
            setMilestones(res.data);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, [cohortId]);

    useEffect(() => {
        if (open) fetchMilestones();
    }, [open, fetchMilestones]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await apiClient.post('/admin/milestones', { cohortId, title, description, deadline });
            setTitle('');
            setDescription('');
            setDeadline('');
            fetchMilestones();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create milestone');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-5 border-t border-slate-700/50 pt-4">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-primary transition-colors w-full"
            >
                <Target size={16} className="text-purple-400" />
                <span>Milestones</span>
                {milestones.length > 0 && (
                    <span className="ml-1 text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{milestones.length}</span>
                )}
                <ChevronDown size={14} className={`ml-auto text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="mt-4 space-y-4">
                    {/* Existing Milestones */}
                    {loading ? (
                        <div className="text-xs text-slate-500 animate-pulse">Loading milestones…</div>
                    ) : milestones.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No milestones yet. Create one below.</p>
                    ) : (
                        <div className="space-y-2">
                            {milestones.map(m => (
                                <div key={m._id} className="flex items-start gap-3 bg-background/50 rounded-lg px-3 py-2.5 border border-slate-700/50">
                                    <Target size={14} className="mt-0.5 text-purple-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-200">{m.title}</p>
                                        {m.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{m.description}</p>}
                                        <p className="text-xs text-slate-600 mt-1">
                                            Deadline: {new Date(m.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Milestone Form */}
                    <form onSubmit={handleCreate} className="bg-background/30 rounded-xl border border-slate-700/50 p-4 space-y-3">
                        <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Add Milestone</h5>
                        {error && <p className="text-xs text-red-400">{error}</p>}
                        <input
                            required
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Milestone title (e.g. Complete Module 1 Project)"
                            className="w-full bg-background border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full bg-background border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                        <div className="flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-xs text-slate-400 mb-1">Deadline</label>
                                <input
                                    required
                                    type="date"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    className="w-full bg-background border border-slate-600 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60 shrink-0"
                            >
                                <Plus size={14} />
                                {submitting ? 'Adding…' : 'Add'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CohortsManage: React.FC = () => {
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [missedCheckins, setMissedCheckins] = useState<MissedCheckInItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // UI state
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchCohortsAndMissed = async () => {
        try {
            setLoading(true);
            const [cohortsRes, missedRes] = await Promise.all([
                apiClient.get('/cohorts/mine'),
                apiClient.get('/admin/missed-checkins')
            ]);
            setCohorts(cohortsRes.data);
            setMissedCheckins(missedRes.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCohortsAndMissed();
    }, []);

    const handleCreateCohort = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await apiClient.post('/cohorts', { name, startDate, endDate, description });
            setName('');
            setStartDate('');
            setEndDate('');
            setDescription('');
            fetchCohortsAndMissed();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create cohort');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Manage Cohorts</h2>
                    <p className="text-slate-400 mt-1">Create cohorts, add milestones, and track participating interns.</p>
                </div>
            </div>

            {error && (
                <div className="bg-danger/10 border border-danger/50 text-danger p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Create Cohort Form */}
                <div className="lg:col-span-1">
                    <div className="bg-surface rounded-2xl border border-slate-700 p-6 shadow-lg sticky top-8">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-primary" /> Create New Cohort
                        </h3>
                        <form onSubmit={handleCreateCohort} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-300">Cohort Name</label>
                                <input
                                    required type="text" value={name} onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Summer 2026 Engineering"
                                    className="w-full bg-background border border-slate-600 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Start Date</label>
                                    <input
                                        required type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                        className="w-full bg-background border border-slate-600 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">End Date</label>
                                    <input
                                        required type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                        className="w-full bg-background border border-slate-600 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-300">Description (Optional)</label>
                                <textarea
                                    rows={3} value={description} onChange={e => setDescription(e.target.value)}
                                    placeholder="Focus areas, goals, etc."
                                    className="w-full bg-background border border-slate-600 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                />
                            </div>
                            <button
                                type="submit" disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Cohort'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Cohort List */}
                <div className="lg:col-span-2 space-y-6">
                    {loading ? (
                        <div className="text-center py-12 text-slate-400">Loading your cohorts...</div>
                    ) : cohorts.length === 0 ? (
                        <div className="bg-surface/50 border border-slate-700/50 rounded-2xl p-12 text-center">
                            <Calendar size={48} className="mx-auto mb-4 text-slate-500" />
                            <h3 className="text-xl font-medium text-slate-300 mb-2">No Cohorts Yet</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">Use the form to create your first cohort, then add milestones to track intern progress.</p>
                        </div>
                    ) : (
                        cohorts.map(cohort => (
                            <div key={cohort._id} className="bg-surface rounded-2xl border border-slate-700 p-6 shadow-lg">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-100">{cohort.name}</h3>
                                        {cohort.description && <p className="text-sm text-slate-400 mt-1">{cohort.description}</p>}
                                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(cohort.startDate).toLocaleDateString()} – {new Date(cohort.endDate).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><Users size={14} /> {cohort.internCount} Interns</span>
                                        </div>
                                    </div>

                                    <div className="bg-background rounded-lg border border-slate-700 p-3 flex flex-col items-end gap-2 shrink-0">
                                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Invite Code (ID)</div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-mono text-sm text-slate-300 bg-slate-800 px-2 py-1 rounded">{cohort._id}</div>
                                            <button
                                                onClick={() => copyToClipboard(cohort._id)}
                                                className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-primary"
                                                title="Copy ID to Share"
                                            >
                                                {copiedId === cohort._id ? <Check size={16} className="text-secondary" /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Interns List */}
                                <div className="bg-background/50 rounded-xl border border-slate-700/50 overflow-hidden">
                                    <div className="p-4 border-b border-slate-700/50 bg-surface/30">
                                        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                            <Users size={16} className="text-primary" /> Joined Interns
                                        </h4>
                                    </div>
                                    {cohort.internCount === 0 ? (
                                        <div className="text-sm text-slate-500 italic p-6 text-center">No interns have joined this cohort yet.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-slate-500 uppercase bg-surface/50 border-b border-slate-700/50">
                                                    <tr>
                                                        <th className="px-6 py-3 font-medium">Name</th>
                                                        <th className="px-6 py-3 font-medium">Email</th>
                                                        <th className="px-6 py-3 font-medium text-right">Intern ID</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800">
                                                    {cohort.interns.map((intern) => (
                                                        <tr key={intern._id} className="hover:bg-surface transition-colors">
                                                            <td className="px-6 py-4 font-medium text-slate-300">{intern.name}</td>
                                                            <td className="px-6 py-4 text-slate-400">{intern.email}</td>
                                                            <td className="px-6 py-4 text-slate-500 font-mono text-xs text-right truncate max-w-[120px]">{intern._id}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* ── Milestones Panel ─────────────────────── */}
                                <MilestonePanel cohortId={cohort._id} />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Missed Checkins Section */}
            {!loading && missedCheckins.length > 0 && (
                <div className="bg-surface rounded-2xl border border-danger/50 p-6 shadow-lg relative overflow-hidden mt-8">
                    <div className="absolute top-0 left-0 w-1 h-full bg-danger" />
                    <div className="mb-6 flex items-center gap-3">
                        <div className="bg-danger/20 p-2 rounded-lg text-danger"><AlertTriangle size={24} /></div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-100">Interns Needing Attention</h3>
                            <p className="text-sm text-slate-400">These interns missed recent check-ins or passed milestone deadlines.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-surface/50 border-b border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Intern</th>
                                    <th className="px-6 py-3 font-medium text-center">Missed Daily</th>
                                    <th className="px-6 py-3 font-medium text-center">Missed Weekly</th>
                                    <th className="px-6 py-3 font-medium">Pending Milestones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {missedCheckins.map((item) => (
                                    <tr key={item.intern._id} className="hover:bg-background/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-200">{item.intern.name}</div>
                                            <div className="text-xs text-slate-500">{item.intern.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.missedDaily ? <span className="text-danger font-bold">Yes</span> : <span className="text-slate-600">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.missedWeekly ? <span className="text-danger font-bold">Yes</span> : <span className="text-slate-600">-</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.missedMilestones.length > 0 ? (
                                                <ul className="list-disc list-inside text-danger text-xs font-medium space-y-1">
                                                    {item.missedMilestones.map((m, i) => <li key={i}>{m}</li>)}
                                                </ul>
                                            ) : <span className="text-slate-600">-</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CohortsManage;
