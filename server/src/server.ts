import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import checkInRoutes from './routes/checkInRoutes';
import communicationRoutes from './routes/communicationRoutes';
import adminRoutes from './routes/adminRoutes';
import cohortRoutes from './routes/cohortRoutes';

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/checkins', checkInRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cohorts', cohortRoutes);

app.get('/', (req, res) => {
    res.send('Cohort Pulse API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
