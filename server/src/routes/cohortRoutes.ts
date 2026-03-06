import express from 'express';
import { protect } from '../middleware/auth';
import {
    createCohort,
    getMyCohorts,
    getAvailableCohorts,
    joinCohort,
    getCohortPeers
} from '../controllers/cohortController';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin / Mentor routes
router.post('/', createCohort);
router.get('/mine', getMyCohorts);

// Intern routes
router.get('/available', getAvailableCohorts);
router.post('/join', joinCohort);
router.get('/peers', getCohortPeers);

export default router;
