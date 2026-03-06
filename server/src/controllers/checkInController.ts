import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DailyCheckIn } from '../models/DailyCheckIn';
import { WeeklyPulse } from '../models/WeeklyPulse';
import { Milestone, MilestoneCheckIn } from '../models/Milestone';

// --- Daily Check-In ---
export const submitDailyCheckIn = async (req: AuthRequest, res: Response) => {
    try {
        const { moodScore, note } = req.body;

        // Normalize date to today midnight for the unique index check
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingCheckIn = await DailyCheckIn.findOne({
            internId: req.user?._id,
            date: { $gte: today }
        });

        if (existingCheckIn) {
            return res.status(400).json({ message: 'Daily check-in already submitted today' });
        }

        const checkIn = await DailyCheckIn.create({
            internId: req.user?._id,
            moodScore,
            note,
            date: new Date()
        });

        res.status(201).json(checkIn);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getDailyCheckIns = async (req: AuthRequest, res: Response) => {
    try {
        const checkIns = await DailyCheckIn.find({ internId: req.user?._id }).sort({ date: -1 });
        res.json(checkIns);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- Weekly Pulse ---
export const submitWeeklyPulse = async (req: AuthRequest, res: Response) => {
    try {
        const { energyLevel, blockers, completions, confidenceLevel, openEndedFeedback } = req.body;

        const pulse = await WeeklyPulse.create({
            internId: req.user?._id,
            weekStartDate: new Date(), // Logic can be enhanced to get exact week start
            energyLevel,
            blockers,
            completions,
            confidenceLevel,
            openEndedFeedback
        });

        res.status(201).json(pulse);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getWeeklyPulses = async (req: AuthRequest, res: Response) => {
    try {
        const pulses = await WeeklyPulse.find({ internId: req.user?._id }).sort({ weekStartDate: -1 });
        res.json(pulses);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- Milestone Check-In ---
export const submitMilestoneCheckIn = async (req: AuthRequest, res: Response) => {
    try {
        const { milestoneId, completed, blockerNote } = req.body;

        const existing = await MilestoneCheckIn.findOne({ internId: req.user?._id, milestoneId });
        if (existing) {
            return res.status(400).json({ message: 'Milestone already checked in' });
        }

        const checkIn = await MilestoneCheckIn.create({
            internId: req.user?._id,
            milestoneId,
            completed,
            blockerNote
        });

        res.status(201).json(checkIn);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getMilestones = async (req: AuthRequest, res: Response) => {
    try {
        const internId = req.user?._id;
        const cohortId = req.user?.cohortId;

        // Ensure user has a cohort assigned
        if (!cohortId) {
            return res.status(400).json({ message: 'User is not assigned to any cohort' });
        }

        const milestones = await Milestone.find({ cohortId }).sort({ deadline: 1 });

        // Find which ones the current intern has already checked in for
        const checkIns = await MilestoneCheckIn.find({ internId });
        const checkedInIds = new Set(checkIns.map(c => c.milestoneId.toString()));

        const now = new Date();

        const enrichedMilestones = milestones.map(m => {
            const isCheckedIn = checkedInIds.has(m._id.toString());
            const isPastDeadline = new Date(m.deadline) < now;

            return {
                ...m.toObject(),
                isCheckedIn,
                isPastDeadline,
                isPastDeadlineAndPending: isPastDeadline && !isCheckedIn
            };
        });

        res.json(enrichedMilestones);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
