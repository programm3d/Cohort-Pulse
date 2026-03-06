import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DailyCheckIn } from '../models/DailyCheckIn';
import { WeeklyPulse } from '../models/WeeklyPulse';
import { MilestoneCheckIn, Milestone } from '../models/Milestone';
import { Blocker } from '../models/Blocker';
import { User } from '../models/User';
import { Cohort } from '../models/Cohort';
import mongoose from 'mongoose';

// Helper: get intern IDs for a given cohort
async function getInternIds(cohortId: string): Promise<mongoose.Types.ObjectId[]> {
    const interns = await User.find({ role: 'INTERN', cohortId: new mongoose.Types.ObjectId(cohortId) }).select('_id');
    return interns.map(i => i._id as mongoose.Types.ObjectId);
}

// Helper: get IST date string for today
function getTodayIST(): string {
    const now = new Date();
    const ist = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const d = new Date(ist);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// GET /admin/dashboard?cohortId=
export const getCohortDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?._id;
        const { cohortId } = req.query;

        // Determine cohort to query — default to admin's first cohort
        let resolvedCohortId = cohortId as string;
        if (!resolvedCohortId) {
            const firstCohort = await Cohort.findOne({ createdBy: adminId });
            if (!firstCohort) return res.json({ avgMood: 0, avgEnergy: 0, milestoneRate: 0, activeInterns: 0 });
            resolvedCohortId = firstCohort._id.toString();
        }

        const internIds = await getInternIds(resolvedCohortId);
        if (!internIds.length) return res.json({ avgMood: 0, avgEnergy: 0, milestoneRate: 0, activeInterns: 0 });

        const [avgMoodAgg, avgEnergyAgg, milestoneAgg] = await Promise.all([
            DailyCheckIn.aggregate([
                { $match: { internId: { $in: internIds } } },
                { $group: { _id: null, avgMood: { $avg: '$moodScore' } } }
            ]),
            WeeklyPulse.aggregate([
                { $match: { internId: { $in: internIds } } },
                { $group: { _id: null, avgEnergy: { $avg: '$energyLevel' } } }
            ]),
            MilestoneCheckIn.aggregate([
                { $match: { internId: { $in: internIds } } },
                { $group: { _id: null, completed: { $sum: { $cond: ['$completed', 1, 0] } }, total: { $sum: 1 } } }
            ])
        ]);

        const milestoneRate = milestoneAgg[0]?.total
            ? Math.round((milestoneAgg[0].completed / milestoneAgg[0].total) * 100)
            : 0;

        res.json({
            avgMood: Number((avgMoodAgg[0]?.avgMood || 0).toFixed(1)),
            avgEnergy: Number((avgEnergyAgg[0]?.avgEnergy || 0).toFixed(1)),
            milestoneRate,
            activeInterns: internIds.length
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// GET /admin/mood-trend?cohortId=
// Returns last 7 days avg mood per day for interns in the cohort
export const getDailyMoodTrend = async (req: AuthRequest, res: Response) => {
    try {
        const { cohortId } = req.query;
        if (!cohortId) return res.status(400).json({ message: 'cohortId is required' });

        const internIds = await getInternIds(cohortId as string);
        if (!internIds.length) return res.json([]);

        // Last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const trend = await DailyCheckIn.aggregate([
            {
                $match: {
                    internId: { $in: internIds },
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                // Group by YYYY-MM-DD only — %a is not a valid MongoDB format char
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' }
                    },
                    avgMood: { $avg: '$moodScore' }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    avgMood: { $round: ['$avgMood', 1] }
                }
            }
        ]);

        // Compute abbreviated weekday name in JS (Mon, Tue, …)
        const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const labeled = trend.map((t: any) => ({
            ...t,
            day: DAY_NAMES[new Date(t.date + 'T00:00:00').getDay()]
        }));

        res.json(labeled);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// GET /admin/energy-curve?cohortId=
// Returns last 6 weeks avg energy per week
export const getWeeklyEnergyCurve = async (req: AuthRequest, res: Response) => {
    try {
        const { cohortId } = req.query;
        if (!cohortId) return res.status(400).json({ message: 'cohortId is required' });

        const internIds = await getInternIds(cohortId as string);
        if (!internIds.length) return res.json([]);

        const sixWeeksAgo = new Date();
        sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
        sixWeeksAgo.setHours(0, 0, 0, 0);

        const curve = await WeeklyPulse.aggregate([
            {
                $match: {
                    internId: { $in: internIds },
                    createdAt: { $gte: sixWeeksAgo }
                }
            },
            {
                // Group by the stored weekStartDate (YYYY-MM-DD) — avoid %V which is not supported universally
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$weekStartDate' }
                    },
                    avgEnergy: { $avg: '$energyLevel' },
                    avgConfidence: { $avg: '$confidenceLevel' },
                    weekStart: { $min: '$weekStartDate' }
                }
            },
            { $sort: { weekStart: 1 } },
            { $limit: 6 },
            {
                $project: {
                    _id: 0,
                    weekStartDate: '$_id',
                    avgEnergy: { $round: ['$avgEnergy', 1] },
                    avgConfidence: { $round: ['$avgConfidence', 1] }
                }
            }
        ]);

        // Label as "Wk 1", "Wk 2" … in JS
        const labeled = curve.map((w: any, i: number) => ({ ...w, week: `Wk ${i + 1}` }));
        res.json(labeled);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// GET /admin/milestone-rates?cohortId=
// Returns per-milestone completion rates for a cohort
export const getMilestoneCompletionRates = async (req: AuthRequest, res: Response) => {
    try {
        const { cohortId } = req.query;
        if (!cohortId) return res.status(400).json({ message: 'cohortId is required' });

        const internIds = await getInternIds(cohortId as string);
        if (!internIds.length) return res.json([]);

        // Get milestones for this cohort
        const milestones = await Milestone.find({ cohortId: new mongoose.Types.ObjectId(cohortId as string) });
        if (!milestones.length) return res.json([]);

        const milestoneIds = milestones.map(m => m._id);

        const checkIns = await MilestoneCheckIn.aggregate([
            {
                $match: {
                    internId: { $in: internIds },
                    milestoneId: { $in: milestoneIds }
                }
            },
            {
                $group: {
                    _id: '$milestoneId',
                    completed: { $sum: { $cond: ['$completed', 1, 0] } },
                    total: { $sum: 1 }
                }
            }
        ]);

        const checkInMap = new Map(checkIns.map(c => [c._id.toString(), c]));

        const rates = milestones.map(m => {
            const data = checkInMap.get(m._id.toString());
            const completed = data?.completed || 0;
            const total = data?.total || 0;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            return {
                milestoneId: m._id,
                title: m.title,
                deadline: m.deadline,
                completed,
                total,
                rate
            };
        });

        res.json(rates);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getRiskRadar = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?._id;

        // Scope to admin's cohorts only
        const cohorts = await Cohort.find({ createdBy: adminId });
        if (!cohorts.length) return res.json([]);
        const cohortIds = cohorts.map(c => c._id);

        const interns = await User.find({ role: 'INTERN', cohortId: { $in: cohortIds } })
            .select('_id name email cohortId createdAt');
        if (!interns.length) return res.json([]);
        const internIds = interns.map(i => i._id as mongoose.Types.ObjectId);

        // ── Signal window: last 7 days ────────────────────────────────────────
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Fetch all check-ins from last 7 days for these interns
        const recentCheckIns = await DailyCheckIn.find({
            internId: { $in: internIds },
            createdAt: { $gte: sevenDaysAgo }
        }).select('internId moodScore createdAt').sort({ internId: 1, createdAt: 1 });

        // Build a per-intern map: internId => sorted array of { date, moodScore }
        const internCheckInMap = new Map<string, { date: Date; moodScore: number }[]>();
        for (const ci of recentCheckIns) {
            const key = ci.internId.toString();
            if (!internCheckInMap.has(key)) internCheckInMap.set(key, []);
            internCheckInMap.get(key)!.push({ date: ci.createdAt, moodScore: ci.moodScore });
        }

        // Helper: detect strictly declining mood over last N consecutive entries
        const hasConsecutiveDecline = (entries: { moodScore: number }[], n: number): boolean => {
            if (entries.length < n) return false;
            const last = entries.slice(-n);
            for (let i = 1; i < last.length; i++) {
                if (last[i].moodScore >= last[i - 1].moodScore) return false;
            }
            return true;
        };

        const flagged: any[] = [];

        for (const intern of interns) {
            const key = intern._id.toString();
            const checkIns = internCheckInMap.get(key) || [];

            // Signal 1: Missed 2+ check-ins in their active window
            const joinDate = new Date(intern.createdAt);
            let expectedDays = 7;
            if (joinDate > sevenDaysAgo) {
                const diffTime = Math.abs(new Date().getTime() - joinDate.getTime());
                expectedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (expectedDays < 1) expectedDays = 1;
                if (expectedDays > 7) expectedDays = 7;
            }

            const missedCount = expectedDays - checkIns.length;
            const missedTwoPlusDays = missedCount >= 2;

            // Signal 2: Mood declining for 5 consecutive check-ins
            const moodDeclining5Days = hasConsecutiveDecline(checkIns, 5);

            if (missedTwoPlusDays || moodDeclining5Days) {
                // Build mood sparkline (last 7 check-ins for display)
                const moodSparkline = checkIns.slice(-7).map(ci => ({
                    date: ci.date.toISOString().slice(0, 10),
                    mood: ci.moodScore
                }));

                const avgMood = checkIns.length
                    ? Number((checkIns.reduce((s, c) => s + c.moodScore, 0) / checkIns.length).toFixed(1))
                    : null;

                const cohort = cohorts.find(c => c._id.toString() === intern.cohortId?.toString());

                flagged.push({
                    internId: intern._id,
                    name: intern.name,
                    email: intern.email,
                    cohortName: cohort?.name || 'Unknown Cohort',
                    missedCheckIns: missedCount,
                    missedTwoPlusDays,
                    moodDeclining5Days,
                    avgMood,
                    moodSparkline,
                    riskLevel: (missedTwoPlusDays && moodDeclining5Days) ? 'critical' : 'high'
                });
            }
        }

        res.json(flagged);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};


export const getBlockerHeatmap = async (req: AuthRequest, res: Response) => {
    try {
        const { cohortId } = req.query;
        const query: any = { status: 'OPEN' };
        let totalInterns = 0;

        if (cohortId) {
            // Find interns in this cohort first
            const internsInCohort = await User.find({ cohortId: new mongoose.Types.ObjectId(cohortId as string) }).select('_id');
            const internIds = internsInCohort.map(i => i._id);
            query.internId = { $in: internIds };
            totalInterns = internIds.length;
        } else {
            // Admin's own cohorts only
            const adminId = req.user?._id;
            const cohorts = await Cohort.find({ createdBy: adminId }).select('_id');
            const cohortIds = cohorts.map(c => c._id);
            const internsInAdminCohorts = await User.find({ cohortId: { $in: cohortIds } }).select('_id');
            const internIds = internsInAdminCohorts.map(i => i._id);
            query.internId = { $in: internIds };
            totalInterns = internIds.length;
        }

        const heatmap = await Blocker.find(query)
            .sort({ iHaveThisTooCount: -1 })
            .limit(10)
            .select('title iHaveThisTooCount createdAt');

        res.json({ totalInterns, data: heatmap });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getAnonInsights = async (req: AuthRequest, res: Response) => {
    try {
        const { cohortId } = req.query;
        let pulseQuery: any = {};
        let blockerQuery: any = { isAnonymous: true };

        if (cohortId) {
            const internsInCohort = await User.find({ cohortId: new mongoose.Types.ObjectId(cohortId as string) }).select('_id');
            const internIds = internsInCohort.map(i => i._id);
            pulseQuery.internId = { $in: internIds };
            blockerQuery.internId = { $in: internIds };
        } else {
            const adminId = req.user?._id;
            const cohorts = await Cohort.find({ createdBy: adminId }).select('_id');
            const cohortIds = cohorts.map(c => c._id);
            const internsInAdminCohorts = await User.find({ cohortId: { $in: cohortIds } }).select('_id');
            const internIds = internsInAdminCohorts.map(i => i._id);
            pulseQuery.internId = { $in: internIds };
            blockerQuery.internId = { $in: internIds };
        }

        const weeklyPulses = await WeeklyPulse.find(pulseQuery).select('openEndedFeedback createdAt -_id').sort({ createdAt: -1 }).limit(100);
        const anonymousBlockers = await Blocker.find(blockerQuery).select('description createdAt -_id').sort({ createdAt: -1 }).limit(100);

        const allResponses = [
            ...weeklyPulses.map(w => ({ text: w.openEndedFeedback, type: 'Weekly Pulse', date: w.createdAt })),
            ...anonymousBlockers.map(b => ({ text: b.description, type: 'Anonymous Blocker', date: b.createdAt }))
        ].filter(i => i.text && i.text.length > 5);

        // --- Thematic Grouping Logic ---
        const themeDefinitions = [
            { name: 'Workload & Stress', keywords: ['overwhelmed', 'stress', 'busy', 'too much', 'heavy', 'burden', 'exhausted', 'tired', 'burnt out', 'burnout'] },
            { name: 'Clarity & Expectations', keywords: ['unclear', 'confused', 'guidance', 'instruction', 'what to do', 'expectations', 'goals', 'roadmap', 'direction'] },
            { name: 'Pacing & Time', keywords: ['fast', 'slow', 'deadline', 'time', 'hurry', 'rush', 'backlog', 'behind', 'schedule'] },
            { name: 'Technical & Environment', keywords: ['setup', 'install', 'error', 'bug', 'broken', 'internet', 'access', 'token', 'laptop', 'environment', 'mongodb', 'react', 'node'] },
            { name: 'Positive & Engagement', keywords: ['great', 'loving', 'happy', 'enjoying', 'excited', 'good', 'clear', 'learnt', 'learning', 'helpful', 'mentor'] }
        ];

        const themeStats: Record<string, { count: number; responses: any[] }> = {};
        themeDefinitions.forEach(td => {
            themeStats[td.name] = { count: 0, responses: [] };
        });

        const generalFeedback: any[] = [];

        allResponses.forEach(resp => {
            let matched = false;
            const textLower = resp.text.toLowerCase();

            themeDefinitions.forEach(td => {
                if (td.keywords.some(kw => textLower.includes(kw))) {
                    themeStats[td.name].count += 1;
                    if (themeStats[td.name].responses.length < 5) {
                        themeStats[td.name].responses.push(resp);
                    }
                    matched = true;
                }
            });

            if (!matched) {
                generalFeedback.push(resp);
            }
        });

        // Convert to array and filter out empty themes
        const themes = Object.entries(themeStats)
            .map(([name, data]) => ({ name, ...data }))
            .filter(t => t.count > 0)
            .sort((a, b) => b.count - a.count);

        res.json({
            themes,
            allResponses: allResponses.sort((a: any, b: any) => b.date - a.date),
            generalCount: generalFeedback.length
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// GET /admin/milestone-blockers?cohortId=
export const getMilestoneBlockers = async (req: AuthRequest, res: Response) => {
    try {
        const { cohortId } = req.query;
        if (!cohortId) return res.status(400).json({ message: 'cohortId is required' });

        const internIds = await getInternIds(cohortId as string);
        if (!internIds.length) return res.json([]);

        const blockers = await MilestoneCheckIn.find({
            internId: { $in: internIds },
            completed: false
        })
            .populate('internId', 'name email')
            .populate('milestoneId', 'title')
            .sort({ createdAt: -1 });

        const formatted = blockers.map((b: any) => ({
            internName: b.internId.name,
            internEmail: b.internId.email,
            milestoneTitle: b.milestoneId.title,
            blockerNote: b.blockerNote,
            date: b.createdAt
        }));

        res.json(formatted);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMissedCheckins = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?._id;
        const cohorts = await Cohort.find({ createdBy: adminId });
        const cohortIds = cohorts.map(c => c._id);
        const interns = await User.find({ role: 'INTERN', cohortId: { $in: cohortIds } }).select('_id name email cohortId');
        const internIds = interns.map(i => i._id as mongoose.Types.ObjectId);

        const now = new Date();
        const istString = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        const istDate = new Date(istString);
        const year = istDate.getFullYear();
        const month = String(istDate.getMonth() + 1).padStart(2, '0');
        const day = String(istDate.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const todaysCheckIns = await DailyCheckIn.find({
            internId: { $in: internIds },
            $or: [
                { createdAt: { $gte: new Date(todayStr) } },
                { date: { $gte: new Date(todayStr) } }
            ]
        });
        const checkedInDailyIds = new Set(todaysCheckIns.map(c => c.internId.toString()));

        const weekStart = new Date(istDate);
        weekStart.setDate(istDate.getDate() - istDate.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const thisWeeksPulses = await WeeklyPulse.find({
            internId: { $in: internIds },
            createdAt: { $gte: weekStart }
        });
        const pulsedWeeklyIds = new Set(thisWeeksPulses.map(p => p.internId.toString()));

        const activeMilestones = await Milestone.find({ deadline: { $lt: now } });
        const milestoneCheckIns = await MilestoneCheckIn.find({ internId: { $in: internIds } });

        const missedList = interns.map(intern => {
            const internIdStr = intern._id.toString();
            const joinDate = new Date(intern.createdAt);

            // Daily checkin is only missed if they joined before today OR joined today and haven't checked in
            // Actually, if they joined today they still need to check in today. So missing today is only skipped if they haven't joined yet (impossible).
            // However, for Weekly Pulse: if they joined AFTER the start of the week, they shouldn't be penalized for missing this week's pulse (which typically happens on Sunday).
            const missedDaily = !checkedInDailyIds.has(internIdStr);

            let missedWeekly = false;
            if (joinDate <= weekStart) {
                // Only expect a weekly pulse if they were here before the week started
                missedWeekly = !pulsedWeeklyIds.has(internIdStr);
            }

            const myCheckIns = milestoneCheckIns.filter(c => c.internId.toString() === internIdStr);
            const myCheckedInIds = new Set(myCheckIns.map(c => c.milestoneId.toString()));
            // Only flag missed milestones if the intern joined before the milestone deadline
            const missedMilestones = activeMilestones
                .filter(m => !myCheckedInIds.has(m._id.toString()) && joinDate < new Date(m.deadline))
                .map(m => m.title);

            return { intern, missedDaily, missedWeekly, missedMilestones };
        }).filter(item => item.missedDaily || item.missedWeekly || item.missedMilestones.length > 0);

        res.json(missedList);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// POST /admin/milestones — Admin creates a milestone for a cohort
export const createMilestone = async (req: AuthRequest, res: Response) => {
    try {
        const { cohortId, title, description, deadline } = req.body;
        if (!cohortId || !title || !deadline) {
            return res.status(400).json({ message: 'cohortId, title and deadline are required' });
        }

        // Verify this cohort belongs to the admin
        const cohort = await Cohort.findOne({ _id: cohortId, createdBy: req.user?._id });
        if (!cohort) {
            return res.status(403).json({ message: 'Cohort not found or does not belong to you' });
        }

        const milestone = await Milestone.create({
            cohortId: new mongoose.Types.ObjectId(cohortId),
            title: title.trim(),
            description: description?.trim(),
            deadline: new Date(deadline)
        });

        res.status(201).json(milestone);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// GET /admin/milestones?cohortId= — List milestones for a cohort
export const getMilestonesByCohort = async (req: AuthRequest, res: Response) => {
    try {
        const { cohortId } = req.query;
        if (!cohortId) return res.status(400).json({ message: 'cohortId is required' });

        const milestones = await Milestone.find({
            cohortId: new mongoose.Types.ObjectId(cohortId as string)
        }).sort({ deadline: 1 });

        res.json(milestones);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const getCohortComparison = async (req: AuthRequest, res: Response) => {
    try {
        const { cohortA, cohortB } = req.query;
        if (!cohortA || !cohortB) {
            return res.status(400).json({ message: 'Both cohortA and cohortB are required' });
        }

        const fetchCohortStats = async (id: string) => {
            const cohort = await Cohort.findById(id);
            if (!cohort) return null;

            const interns = await User.find({ cohortId: id, role: 'INTERN' }).select('_id');
            const internIds = interns.map(i => i._id);

            const dailyCheckins = await DailyCheckIn.find({ internId: { $in: internIds } });
            const weeklyPulses = await WeeklyPulse.find({ internId: { $in: internIds } });
            const milestoneCheckins = await MilestoneCheckIn.find({
                internId: { $in: internIds },
                completed: true
            });
            const totalMilestones = await Milestone.countDocuments({ cohortId: id });
            const blockerCount = await Blocker.countDocuments({ internId: { $in: internIds } });

            const weekMap: Record<number, { mood: number[]; energy: number[] }> = {};

            const startDate = new Date(cohort.startDate);
            const dayMs = 24 * 60 * 60 * 1000;
            const weekMs = 7 * dayMs;

            dailyCheckins.forEach(c => {
                const week = Math.floor((c.createdAt.getTime() - startDate.getTime()) / weekMs) + 1;
                if (week < 1) return;
                if (!weekMap[week]) weekMap[week] = { mood: [], energy: [] };
                weekMap[week].mood.push(c.moodScore);
            });

            weeklyPulses.forEach(p => {
                const week = Math.floor((p.createdAt.getTime() - startDate.getTime()) / weekMs) + 1;
                if (week < 1) return;
                if (!weekMap[week]) weekMap[week] = { mood: [], energy: [] };
                weekMap[week].energy.push(p.energyLevel);
            });

            const weekData = Object.keys(weekMap).map(w => {
                const wk = parseInt(w);
                const moods = weekMap[wk].mood;
                const energies = weekMap[wk].energy;
                return {
                    week: wk,
                    avgMood: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : 0,
                    avgEnergy: energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : 0
                };
            }).sort((a, b) => a.week - b.week);

            const avgMood = dailyCheckins.length ? dailyCheckins.reduce((a, b) => a + b.moodScore, 0) / dailyCheckins.length : 0;
            let avgEnergy = 0;
            if (weeklyPulses.length > 0) {
                const totalEnergy = weeklyPulses.reduce((acc, p) => acc + p.energyLevel, 0);
                avgEnergy = totalEnergy / weeklyPulses.length;
            }

            const milestoneRate = (totalMilestones > 0 && interns.length > 0)
                ? (milestoneCheckins.length / (totalMilestones * interns.length)) * 100
                : 0;

            return {
                id,
                name: cohort.name,
                avgMood,
                avgEnergy,
                milestoneRate,
                blockerCount,
                weekData
            };
        };

        const [resultsA, resultsB] = await Promise.all([
            fetchCohortStats(cohortA as string),
            fetchCohortStats(cohortB as string)
        ]);

        if (!resultsA || !resultsB) {
            return res.status(404).json({ message: 'One or both cohorts not found' });
        }

        const maxWeeks = Math.max(
            resultsA.weekData.length ? resultsA.weekData[resultsA.weekData.length - 1].week : 0,
            resultsB.weekData.length ? resultsB.weekData[resultsB.weekData.length - 1].week : 0
        );

        const mergedWeeks = [];
        for (let i = 1; i <= maxWeeks; i++) {
            const wA = resultsA.weekData.find(w => w.week === i);
            const wB = resultsB.weekData.find(w => w.week === i);
            mergedWeeks.push({
                week: `Week ${i}`,
                moodA: wA?.avgMood || 0,
                moodB: wB?.avgMood || 0,
                energyA: wA?.avgEnergy || 0,
                energyB: wB?.avgEnergy || 0
            });
        }

        res.json({
            statsA: {
                avgMood: resultsA.avgMood,
                avgEnergy: resultsA.avgEnergy,
                milestoneRate: Math.round(resultsA.milestoneRate),
                blockerCount: resultsA.blockerCount,
                name: resultsA.name
            },
            statsB: {
                avgMood: resultsB.avgMood,
                avgEnergy: resultsB.avgEnergy,
                milestoneRate: Math.round(resultsB.milestoneRate),
                blockerCount: resultsB.blockerCount,
                name: resultsB.name
            },
            weeks: mergedWeeks
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
