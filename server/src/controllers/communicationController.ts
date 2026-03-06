import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Blocker, BlockerReply, BlockerStatus } from '../models/Blocker';
import { Shoutout } from '../models/Shoutout';

// --- Blockers ---
export const createBlocker = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, isAnonymous } = req.body;
        const blocker = await Blocker.create({
            internId: req.user?._id,
            title,
            description,
            isAnonymous
        });
        res.status(201).json(blocker);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getBlockers = async (req: AuthRequest, res: Response) => {
    try {
        const blockers = await Blocker.find().populate('internId', 'name').sort({ createdAt: -1 });
        // If anonymous, we can map over and remove the populated intern details if needed, 
        // but the frontend could just hide it based on the flag. Better to omit from backend.
        const sanitizedBlockers = blockers.map(b => {
            const obj = b.toObject() as any;
            if (obj.isAnonymous) {
                obj.internId = { _id: obj.internId._id, name: 'Anonymous' };
            }
            return obj;
        });
        res.json(sanitizedBlockers);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const iHaveThisToo = async (req: AuthRequest, res: Response) => {
    try {
        const blockerId = req.params.id;
        const blocker = await Blocker.findById(blockerId);

        if (!blocker) return res.status(404).json({ message: 'Blocker not found' });
        if (blocker.iHaveThisTooUsers.includes(req.user!._id as any)) {
            return res.status(400).json({ message: 'Already marked' });
        }

        blocker.iHaveThisTooUsers.push(req.user!._id as any);
        blocker.iHaveThisTooCount += 1;
        await blocker.save();

        res.json(blocker);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const replyToBlocker = async (req: AuthRequest, res: Response) => {
    try {
        const blockerId = req.params.id;
        const { content, isAnonymous } = req.body;

        const reply = await BlockerReply.create({
            blockerId,
            authorId: req.user?._id,
            content,
            isAnonymous
        });
        res.status(201).json(reply);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getBlockerReplies = async (req: AuthRequest, res: Response) => {
    try {
        const blockerId = req.params.id;
        const replies = await BlockerReply.find({ blockerId }).populate('authorId', 'name').sort({ createdAt: 1 });

        const sanitizedReplies = replies.map(r => {
            const obj = r.toObject() as any;
            if (obj.isAnonymous) {
                obj.authorId = { _id: obj.authorId._id, name: 'Anonymous' };
            }
            return obj;
        });
        res.json(sanitizedReplies);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const resolveBlocker = async (req: AuthRequest, res: Response) => {
    try {
        const blockerId = req.params.id;
        const blocker = await Blocker.findById(blockerId);

        if (!blocker) return res.status(404).json({ message: 'Blocker not found' });

        // Authorization: only the original intern or an admin can resolve
        if (blocker.internId.toString() !== req.user?._id.toString() && req.user?.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to resolve this blocker' });
        }

        blocker.status = BlockerStatus.RESOLVED;
        await blocker.save();

        res.json(blocker);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// --- Shoutouts ---
export const createShoutout = async (req: AuthRequest, res: Response) => {
    try {
        const { toInternId, message } = req.body;
        const shoutout = await Shoutout.create({
            fromInternId: req.user?._id,
            toInternId,
            message
        });
        res.status(201).json(shoutout);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getShoutouts = async (req: AuthRequest, res: Response) => {
    try {
        const shoutouts = await Shoutout.find()
            .populate('fromInternId', 'name')
            .populate('toInternId', 'name')
            .sort({ createdAt: -1 });
        res.json(shoutouts);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
