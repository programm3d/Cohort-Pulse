import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyCheckIn extends Document {
    internId: mongoose.Types.ObjectId;
    moodScore: number; // 1 to 10 slider
    note?: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

const dailyCheckInSchema = new Schema<IDailyCheckIn>({
    internId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    moodScore: { type: Number, required: true, min: 1, max: 10 },
    note: { type: String, trim: true },
    date: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// An intern can only have one check-in per day.
dailyCheckInSchema.index({ internId: 1, date: 1 }, { unique: true });

export const DailyCheckIn = mongoose.model<IDailyCheckIn>('DailyCheckIn', dailyCheckInSchema);
