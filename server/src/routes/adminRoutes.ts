import express from 'express';
import {
    getCohortDashboard,
    getDailyMoodTrend,
    getWeeklyEnergyCurve,
    getMilestoneCompletionRates,
    getRiskRadar,
    getBlockerHeatmap,
    getAnonInsights,
    getMissedCheckins,
    createMilestone,
    getMilestonesByCohort,
    getMilestoneBlockers,
    getCohortComparison
} from '../controllers/adminController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/dashboard', getCohortDashboard);
router.get('/mood-trend', getDailyMoodTrend);
router.get('/energy-curve', getWeeklyEnergyCurve);
router.get('/milestone-rates', getMilestoneCompletionRates);
router.get('/risk-radar', getRiskRadar);
router.get('/heatmap', getBlockerHeatmap);
router.get('/insights', getAnonInsights);
router.get('/missed-checkins', getMissedCheckins);
router.post('/milestones', createMilestone);
router.get('/milestones', getMilestonesByCohort);
router.get('/milestone-blockers', getMilestoneBlockers);
router.get('/comparison', getCohortComparison);

export default router;
