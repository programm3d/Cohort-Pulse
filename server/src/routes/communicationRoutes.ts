import express from 'express';
import {
    createBlocker, getBlockers, iHaveThisToo, replyToBlocker, getBlockerReplies, resolveBlocker,
    createShoutout, getShoutouts
} from '../controllers/communicationController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.post('/blockers', createBlocker);
router.get('/blockers', getBlockers);
router.post('/blockers/:id/i-have-this-too', iHaveThisToo);
router.post('/blockers/:id/reply', replyToBlocker);
router.get('/blockers/:id/replies', getBlockerReplies);
router.put('/blockers/:id/resolve', resolveBlocker);

router.post('/shoutouts', createShoutout);
router.get('/shoutouts', getShoutouts);

export default router;
