import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { CheckCircle2, Send, Clock } from 'lucide-react';

const WeeklyPulse: React.FC = () => {
    const [energy, setEnergy] = useState<number>(5);
    const [confidence, setConfidence] = useState<number>(5);
    const [blockers, setBlockers] = useState('');
    const [completions, setCompletions] = useState('');
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const [isSunday, setIsSunday] = useState(true);
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            // Work with IST strictly
            const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
            const istNow = new Date(istString);
            const dayOfWeek = istNow.getDay();

            if (dayOfWeek === 0) { // Sunday
                setIsSunday(true);
                // Calculate time until end of Sunday for "Ends in"
                const endOfSunday = new Date(istNow);
                endOfSunday.setHours(23, 59, 59, 999);
                const difference = endOfSunday.getTime() - istNow.getTime();

                setTimeLeft({
                    days: 0,
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
                return;
            }

            setIsSunday(false);

            const nextSunday = new Date(istNow);
            nextSunday.setDate(istNow.getDate() + (7 - dayOfWeek));
            nextSunday.setHours(0, 0, 0, 0);

            const difference = nextSunday.getTime() - istNow.getTime();

            if (difference > 0) {
                setTimeLeft({
                    // +1 to hours logic because 0 hours is exactly start of day. 
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await apiClient.post('/checkins/weekly', {
                energyLevel: energy,
                confidenceLevel: confidence,
                blockers,
                completions,
                openEndedFeedback: feedback
            });
            setSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit pulse');
        }
    };

    if (!isSunday && timeLeft) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                <Clock size={64} className="mb-6 text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
                    Next Weekly Pulse In
                </h2>
                <div className="flex gap-4 justify-center mt-4 text-center">
                    <div className="bg-surface border border-slate-700 rounded-xl p-4 min-w-[80px]">
                        <div className="text-3xl font-bold text-slate-200">{timeLeft.days}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Days</div>
                    </div>
                    <div className="bg-surface border border-slate-700 rounded-xl p-4 min-w-[80px]">
                        <div className="text-3xl font-bold text-slate-200">{timeLeft.hours}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Hours</div>
                    </div>
                    <div className="bg-surface border border-slate-700 rounded-xl p-4 min-w-[80px]">
                        <div className="text-3xl font-bold text-slate-200">{timeLeft.minutes}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Mins</div>
                    </div>
                    <div className="bg-surface border border-slate-700 rounded-xl p-4 min-w-[80px]">
                        <div className="text-3xl font-bold text-slate-200">{timeLeft.seconds}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">Secs</div>
                    </div>
                </div>
                <p className="text-slate-400 mt-8 max-w-md mx-auto">
                    Weekly pulse submissions are only open on Sundays. Take this time to reflect on your week!
                </p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <CheckCircle2 size={64} className="mb-6 text-secondary drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Weekly Pulse Recorded
                </h2>
                <p className="text-slate-400 mt-2">Thank you for reflecting on your week. Have a great weekend!</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="text-center md:text-left space-y-2">
                    <h2 className="text-3xl font-bold">Weekly Pulse</h2>
                    <p className="text-slate-400">Take a moment to reflect on your week's progress and energy.</p>
                </div>
                {timeLeft && (
                    <div className="bg-background border border-slate-700 rounded-lg px-4 py-2 flex items-center gap-3 shrink-0 mx-auto md:mx-0">
                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Ends in</span>
                        <div className="font-mono text-lg text-slate-200">
                            {String(timeLeft.hours).padStart(2, '0')}:
                            {String(timeLeft.minutes).padStart(2, '0')}:
                            {String(timeLeft.seconds).padStart(2, '0')}
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="bg-surface border border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>

                {error && <div className="bg-danger/20 text-danger p-3 rounded-lg text-sm z-10 relative">{error}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 relative">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">Overall Energy Level</label>
                            <div className="flex justify-between mb-1 text-xs text-slate-500">
                                <span>Drained (1)</span>
                                <span className="text-secondary font-bold text-base">{energy}</span>
                                <span>Energized (10)</span>
                            </div>
                            <input type="range" min="1" max="10" value={energy} onChange={e => setEnergy(parseInt(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-secondary" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">Confidence Level</label>
                            <div className="flex justify-between mb-1 text-xs text-slate-500">
                                <span>Low (1)</span>
                                <span className="text-primary font-bold text-base">{confidence}</span>
                                <span>High (10)</span>
                            </div>
                            <input type="range" min="1" max="10" value={confidence} onChange={e => setConfidence(parseInt(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-primary" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">What did you complete?</label>
                            <textarea required rows={2} className="w-full bg-background border border-slate-600 rounded-lg p-3 text-sm focus:border-secondary outline-none transition-colors" placeholder="Key wins this week..." value={completions} onChange={e => setCompletions(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-slate-300">What blocked you?</label>
                            <textarea required rows={2} className="w-full bg-background border border-slate-600 rounded-lg p-3 text-sm focus:border-danger outline-none transition-colors" placeholder="Any hurdles you faced..." value={blockers} onChange={e => setBlockers(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="z-10 relative">
                    <label className="block text-sm font-medium mb-2 text-slate-300">Open-ended feedback (Anonymous to peers)</label>
                    <textarea required rows={3} className="w-full bg-background border border-slate-600 rounded-lg p-3 text-sm focus:border-primary outline-none transition-colors" placeholder="How was the curriculum? Anything organisers should know?" value={feedback} onChange={e => setFeedback(e.target.value)} />
                </div>

                <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 z-10 relative shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    <Send size={18} /> Submit Pulse
                </button>
            </form>
        </div>
    );
};

export default WeeklyPulse;
