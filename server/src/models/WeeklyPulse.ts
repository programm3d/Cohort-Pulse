import mongoose, { Document, Schema } from 'mongoose';

export interface IWeeklyPulse extends Document {
    internId: mongoose.Types.ObjectId;
    weekStartDate: Date;
    energyLevel: number; // 1-10
    blockers: string;
    completions: string;
    confidenceLevel: number; // 1-10
    openEndedFeedback: string;
    createdAt: Date;
    updatedAt: Date;
}

const weeklyPulseSchema = new Schema<IWeeklyPulse>({
    internId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekStartDate: { type: Date, required: true },
    energyLevel: { type: Number, required: true, min: 1, max: 10 },
    blockers: { type: String, required: true },
    completions: { type: String, required: true },
    confidenceLevel: { type: Number, required: true, min: 1, max: 10 },
    openEndedFeedback: { type: String, required: true }
}, {
    timestamps: true
});

export const WeeklyPulse = mongoose.model<IWeeklyPulse>('WeeklyPulse', weeklyPulseSchema);
