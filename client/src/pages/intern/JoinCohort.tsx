import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

import { useAuth } from '../../context/AuthContext';
import { Users, ArrowRight, AlertCircle, Clock } from 'lucide-react';

interface Cohort {
    _id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
}

const JoinCohort: React.FC = () => {
    const { updateUser } = useAuth();
    const [cohortIdInput, setCohortIdInput] = useState('');
    const [availableCohorts, setAvailableCohorts] = useState<Cohort[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCohorts = async () => {
            try {
                const { data } = await apiClient.get('/cohorts/available');
                setAvailableCohorts(data);
            } catch (err) {
                console.error('Failed to load cohorts', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCohorts();
    }, []);

    const handleJoin = async (idToJoin: string) => {
        if (!idToJoin.trim()) return;

        setError('');
        setJoining(true);
        try {
            await apiClient.post('/cohorts/join', { cohortId: idToJoin });

            // Update user in context seamlessly changing the layout
            updateUser({ cohortId: idToJoin });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to join cohort. Invalid ID?');
            setJoining(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in duration-500">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="bg-primary/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users size={40} className="text-primary" />
                </div>

                <h2 className="text-3xl font-bold text-slate-100">Join Your Cohort</h2>
                <p className="text-slate-400">
                    You need to be part of a cohort to participate in daily check-ins, pulses, and blocker boards.
                </p>

                {error && (
                    <div className="bg-danger/10 border border-danger/50 text-danger p-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="bg-surface border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="font-semibold text-slate-200 text-left">Have an Invite ID?</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Paste Cohort ID here..."
                            className="flex-1 bg-background border border-slate-600 rounded-lg p-3 text-sm focus:border-primary outline-none transition-all font-mono"
                            value={cohortIdInput}
                            onChange={(e) => setCohortIdInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin(cohortIdInput)}
                        />
                        <button
                            onClick={() => handleJoin(cohortIdInput)}
                            disabled={!cohortIdInput.trim() || joining}
                            className="bg-primary hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0"
                        >
                            {joining ? '...' : <ArrowRight size={20} />}
                        </button>
                    </div>
                </div>

                <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-slate-700"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">Or choose from available</span>
                    <div className="flex-grow border-t border-slate-700"></div>
                </div>

                <div className="space-y-3 text-left">
                    {loading ? (
                        <div className="text-center py-4 text-slate-500">Loading...</div>
                    ) : availableCohorts.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 italic border border-dashed border-slate-700 rounded-xl">No active cohorts found.</div>
                    ) : (
                        availableCohorts.map(cohort => (
                            <button
                                key={cohort._id}
                                disabled={joining}
                                onClick={() => handleJoin(cohort._id)}
                                className="w-full bg-surface hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-4 transition-all text-left flex items-start justify-between group disabled:opacity-50"
                            >
                                <div>
                                    <h4 className="font-bold text-slate-200 group-hover:text-primary transition-colors">{cohort.name}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <Clock size={12} /> {new Date(cohort.startDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-slate-600 group-hover:text-primary transition-colors mt-1" />
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default JoinCohort;
