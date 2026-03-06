import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { MessageSquare, ThumbsUp, Check, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BlockerBoard: React.FC = () => {
    const { user } = useAuth();
    const [blockers, setBlockers] = useState<any[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [isAnon, setIsAnon] = useState(false);

    // Ideally this is handled via websockets, but for this task we will poll or fetch on mount
    const fetchBlockers = async () => {
        try {
            const res = await apiClient.get('/communication/blockers');
            setBlockers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBlockers();
    }, []);

    const handlePostBlocker = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/communication/blockers', {
                title: newTitle,
                description: newDesc,
                isAnonymous: isAnon
            });
            setNewTitle('');
            setNewDesc('');
            setIsAnon(false);
            fetchBlockers();
        } catch (err) {
            console.error(err);
        }
    };

    const handleIHaveThisToo = async (id: string) => {
        try {
            await apiClient.post(`/communication/blockers/${id}/i-have-this-too`);
            fetchBlockers(); // Refresh
        } catch (err) {
            console.error(err);
        }
    };

    const resolveBlocker = async (id: string) => {
        try {
            await apiClient.put(`/communication/blockers/${id}/resolve`);
            fetchBlockers();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-danger flex items-center gap-3">
                        <ShieldAlert size={32} /> Blocker Board
                    </h2>
                    <p className="text-slate-400 mt-2">Post what's stopping you, or help a peer out.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Post Form */}
                <div className="lg:col-span-1">
                    <form onSubmit={handlePostBlocker} className="bg-surface border border-slate-700/60 rounded-2xl p-6 sticky top-24 shadow-lg">
                        <h3 className="font-semibold text-lg mb-4">Post a Blocker</h3>
                        <div className="space-y-4">
                            <input
                                type="text" required placeholder="Short title (e.g., MongoDB Auth Error)"
                                className="w-full bg-background border border-slate-600 rounded-lg p-2.5 text-sm focus:border-danger outline-none"
                                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                            />
                            <textarea
                                required rows={3} placeholder="Describe the issue you're facing..."
                                className="w-full bg-background border border-slate-600 rounded-lg p-2.5 text-sm focus:border-danger outline-none resize-none"
                                value={newDesc} onChange={e => setNewDesc(e.target.value)}
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox" id="anon"
                                    className="w-4 h-4 rounded border-slate-600 bg-background text-danger focus:ring-danger"
                                    checked={isAnon} onChange={e => setIsAnon(e.target.checked)}
                                />
                                <label htmlFor="anon" className="text-sm text-slate-400 cursor-pointer">Post Anonymously</label>
                            </div>
                            <button type="submit" className="w-full bg-danger/20 text-danger hover:bg-danger hover:text-white font-medium py-2.5 rounded-lg transition-colors">
                                Publish Blocker
                            </button>
                        </div>
                    </form>
                </div>

                {/* Feed */}
                <div className="lg:col-span-2 space-y-4">
                    {blockers.length === 0 ? (
                        <div className="text-center py-12 bg-surface/30 rounded-2xl border border-slate-700/50 border-dashed">
                            <p className="text-slate-500">No active blockers. Everyone is crushing it! 🚀</p>
                        </div>
                    ) : (
                        blockers.map((b: any) => (
                            <div key={b._id} className={`border rounded-2xl p-5 shadow-sm transition-all ${b.status === 'RESOLVED' ? 'bg-surface/40 border-slate-700/50 opacity-70' : 'bg-surface border-slate-600'
                                }`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-100">{b.title}</h4>
                                        <span className="text-xs text-slate-400">
                                            by {b.internId?.name} • {new Date(b.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {b.status === 'RESOLVED' && (
                                        <span className="bg-secondary/20 text-secondary text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                                            <Check size={12} /> Resolved
                                        </span>
                                    )}
                                </div>

                                <p className="text-slate-300 text-sm mb-4">{b.description}</p>

                                <div className="flex items-center justify-between border-t border-slate-700/50 pt-4 mt-2">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleIHaveThisToo(b._id)}
                                            disabled={b.iHaveThisTooUsers.includes(user?._id) || b.status === 'RESOLVED'}
                                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${b.iHaveThisTooUsers.includes(user?._id)
                                                ? 'bg-primary/20 text-primary cursor-default'
                                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                                }`}
                                        >
                                            <ThumbsUp size={14} /> I have this too ({b.iHaveThisTooCount})
                                        </button>

                                        <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                                            <MessageSquare size={14} /> Discuss
                                        </button>
                                    </div>

                                    {(b.internId?._id === user?._id || user?.role === 'ADMIN') && b.status !== 'RESOLVED' && (
                                        <button
                                            onClick={() => resolveBlocker(b._id)}
                                            className="text-xs text-secondary hover:text-green-400 transition-colors"
                                        >
                                            Mark Resolved
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlockerBoard;
