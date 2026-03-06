import { Response } from 'express';
import { Cohort } from '../models/Cohort';
import { User, UserRole } from '../models/User';
import { AuthRequest } from '../middleware/auth';

// --- Admin / Mentor Routes ---

export const createCohort = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.MENTOR)) {
            return res.status(403).json({ message: 'Not authorized to create cohorts' });
        }

        const { name, startDate, endDate, description } = req.body;

        const cohort = await Cohort.create({
            name,
            startDate,
            endDate,
            description,
            createdBy: req.user._id
        });

        res.status(201).json(cohort);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Cohort name already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

export const getMyCohorts = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.MENTOR)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Fetch cohorts created by this admin/mentor
        const cohorts = await Cohort.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

        // For each cohort, fetch the interns who joined
        const cohortsWithInterns = await Promise.all(cohorts.map(async (cohort) => {
            const interns = await User.find({ cohortId: cohort._id, role: UserRole.INTERN }).select('-passwordHash');
            return {
                ...cohort.toObject(),
                internCount: interns.length,
                interns
            };
        }));

        res.json(cohortsWithInterns);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- Intern Routes ---

export const getAvailableCohorts = async (req: AuthRequest, res: Response) => {
    try {
        // Just return all cohorts so intern can pick, sorted by creation date
        const cohorts = await Cohort.find().sort({ createdAt: -1 });
        res.json(cohorts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const joinCohort = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== UserRole.INTERN) {
            return res.status(403).json({ message: 'Only interns can join cohorts this way' });
        }

        const { cohortId } = req.body;

        if (!cohortId) {
            return res.status(400).json({ message: 'Cohort ID is required' });
        }

        const cohort = await Cohort.findById(cohortId);
        if (!cohort) {
            return res.status(404).json({ message: 'Cohort not found' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.cohortId = cohort._id;
        await user.save();

        res.json({ message: 'Successfully joined cohort', cohort });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- Intern: search cohort peers by name (for shoutouts) ---
export const getCohortPeers = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const cohortId = req.user.cohortId;
        if (!cohortId) {
            // Intern hasn't joined a cohort yet – return empty list
            return res.json([]);
        }

        const nameQuery = req.query.name as string | undefined;

        const filter: any = {
            cohortId,
            role: UserRole.INTERN,
            _id: { $ne: req.user._id }
        };

        if (nameQuery && nameQuery.trim()) {
            filter.name = { $regex: nameQuery.trim(), $options: 'i' };
        }

        const peers = await User.find(filter).select('_id name').sort({ name: 1 }).limit(20);
        res.json(peers);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
