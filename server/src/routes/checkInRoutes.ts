import express from 'express';
import {
    submitDailyCheckIn, getDailyCheckIns,
    submitWeeklyPulse, getWeeklyPulses,
    submitMilestoneCheckIn, getMilestones
} from '../controllers/checkInController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All check-in routes require authentication
router.use(protect);

router.post('/daily', submitDailyCheckIn);
router.get('/daily', getDailyCheckIns);

router.post('/weekly', submitWeeklyPulse);
router.get('/weekly', getWeeklyPulses);

router.post('/milestone', submitMilestoneCheckIn);
router.get('/milestones', getMilestones); // View upcoming/past milestones

export default router;
