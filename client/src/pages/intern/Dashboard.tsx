import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import apiClient from '../../api/client';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const Dashboard: React.FC = () => {
    const [mood, setMood] = useState<number>(5);
    const [note, setNote] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);

    const [isTimeWindow, setIsTimeWindow] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number, message: string } | null>(null);
    const [pendingMilestone, setPendingMilestone] = useState<any | null>(null);

    useEffect(() => {
        const checkTimeWindow = () => {
            const now = new Date();
            // Convert to IST
            const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const istDate = new Date(istString);

            const hours = istDate.getHours();
            const minutes = istDate.getMinutes();
            const seconds = istDate.getSeconds();

            // Time window is 15:00 (3 PM) to 23:59 (11:59 PM)
            const isWithinWindow = hours >= 15 && hours <= 23;
            setIsTimeWindow(isWithinWindow);

            let targetHours, targetMinutes = 0, targetSeconds = 0;
            let message = "";

            if (isWithinWindow) {
                // Countdown to end of day (24:00)
                message = "Ends in";
                targetHours = 23;
                targetMinutes = 59;
                targetSeconds = 59;
            } else {
                // Countdown to next 3 PM
                message = "Starts in";
                targetHours = hours < 15 ? 15 : 15 + 24; // Today's 15:00 or tomorrow's 15:00
                targetMinutes = 0;
                targetSeconds = 0;
            }

            // Calculate difference
            let diffHours = targetHours - hours;
            let diffMinutes = targetMinutes - minutes;
            let diffSeconds = targetSeconds - seconds;

            if (diffSeconds < 0) { diffMinutes--; diffSeconds += 60; }
            if (diffMinutes < 0) { diffHours--; diffMinutes += 60; }

            setTimeLeft({ hours: diffHours % 24, minutes: diffMinutes, seconds: diffSeconds, message });
        };

        checkTimeWindow();
        const timer = setInterval(checkTimeWindow, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Check if already submitted today
        const checkStatus = async () => {
            try {
                const { data } = await apiClient.get('/checkins/daily');
                // Use IST for "today"
                const istString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
                const istDate = new Date(istString);

                // Format YYYY-MM-DD
                const year = istDate.getFullYear();
                const month = String(istDate.getMonth() + 1).padStart(2, '0');
                const day = String(istDate.getDate()).padStart(2, '0');
                const today = `${year}-${month}-${day}`;

                const hasToday = data.some((c: any) => c.createdAt.startsWith(today) || c.date?.startsWith(today));
                setSubmitted(hasToday);

                // Fetch milestones to check for pending past-due ones
                const { data: milestonesData } = await apiClient.get('/checkins/milestones');
                const pending = milestonesData.find((m: any) => m.isPastDeadlineAndPending);
                if (pending) {
                    setPendingMilestone(pending);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        checkStatus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/checkins/daily', { moodScore: mood, note });
            setSubmitted(true);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="min-h-screen bg-background text-white flex items-center justify-center p-8">Loading...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Intern Dashboard</h2>
                <p className="text-slate-400">Welcome back. Stay on top of your daily pulse.</p>
            </div>

            {/* Pending Milestone Alert */}
            {pendingMilestone && (
                <div className="bg-danger/10 border border-danger/50 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="bg-danger/20 p-3 rounded-full text-danger shrink-0">
                            <AlertTriangle size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-100">Past Due: {pendingMilestone.title}</h3>
                            <p className="text-slate-400 mt-1">
                                This milestone deadline has passed. Tell us what happened—did you complete it or what stopped you?
                            </p>
                        </div>
                    </div>
                    <Link
                        to={`/intern/milestones?pending=${pendingMilestone._id}`}
                        className="bg-danger hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                    >
                        Update Status <ArrowRight size={18} />
                    </Link>
                </div>
            )}

            {/* Daily Micro Check-in */}
            <section className="bg-surface rounded-2xl border border-slate-700 p-6 md:p-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-secondary"></div>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-2">Daily Micro Check-in</h2>
                        <p className="text-slate-400">How is today going? Takes just a second.</p>
                    </div>
                    {timeLeft && (
                        <div className="bg-background border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-3 shrink-0">
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{timeLeft.message}</span>
                            <div className="font-mono text-lg text-slate-200">
                                {String(timeLeft.hours).padStart(2, '0')}:
                                {String(timeLeft.minutes).padStart(2, '0')}:
                                {String(timeLeft.seconds).padStart(2, '0')}
                            </div>
                        </div>
                    )}
                </div>

                {!isTimeWindow ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-center">
                        <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                            <span className="text-2xl">⏳</span>
                        </div>
                        <p className="text-lg font-medium text-slate-300">Daily check-ins are closed right now.</p>
                        <p className="text-sm mt-2">Come back between 🕒 <strong className="text-primary">3:00 PM</strong> and 🕛 <strong className="text-primary">11:59 PM (IST)</strong></p>
                    </div>
                ) : submitted ? (
                    <div className="flex flex-col items-center justify-center py-8 text-secondary">
                        <CheckCircle2 size={48} className="mb-4 text-secondary drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        <p className="text-lg font-medium text-slate-200">You're all checked in for today!</p>
                        <p className="text-slate-400 text-sm mt-2">See you tomorrow.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
                        <div>
                            <div className="flex justify-between mb-2 text-sm text-slate-400 font-medium">
                                <span>Struggling (1)</span>
                                <span className="text-primary font-bold text-lg">{mood}</span>
                                <span>Thriving (10)</span>
                            </div>
                            <input
                                type="range"
                                min="1" max="10"
                                value={mood}
                                onChange={(e) => setMood(parseInt(e.target.value))}
                                className="w-full accent-primary h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-2 text-slate-400">Note (Optional)</label>
                            <textarea
                                rows={2}
                                className="w-full bg-background border border-slate-600 rounded-lg p-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                                placeholder="Any quick thoughts?"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="bg-primary hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            Submit Check-in
                        </button>
                    </form>
                )}
            </section>

            {/* Placeholders for other intern tasks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/intern/weekly-pulse" className="bg-surface/50 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-colors cursor-pointer block">
                    <h3 className="font-semibold text-lg mb-2">Weekly Pulse</h3>
                    <p className="text-sm text-slate-400">Reflect on your week, blockers, and wins.</p>
                </Link>
                <Link to="/intern/blocker-board" className="bg-surface/50 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-colors cursor-pointer block">
                    <h3 className="font-semibold text-lg mb-2">Blocker Board</h3>
                    <p className="text-sm text-slate-400">View resolving threads or post a new blocker.</p>
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
