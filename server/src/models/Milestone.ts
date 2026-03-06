import mongoose, { Document, Schema } from 'mongoose';

export interface IMilestone extends Document {
    cohortId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    deadline: Date;
    createdAt: Date;
    updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>({
    cohortId: { type: Schema.Types.ObjectId, ref: 'Cohort', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    deadline: { type: Date, required: true }
}, {
    timestamps: true
});

export const Milestone = mongoose.model<IMilestone>('Milestone', milestoneSchema);

// Corresponding Check-in record for a specific milestone and user
export interface IMilestoneCheckIn extends Document {
    internId: mongoose.Types.ObjectId;
    milestoneId: mongoose.Types.ObjectId;
    completed: boolean;
    blockerNote?: string; // "If not, what got in the way?"
    createdAt: Date;
    updatedAt: Date;
}

const milestoneCheckInSchema = new Schema<IMilestoneCheckIn>({
    internId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    milestoneId: { type: Schema.Types.ObjectId, ref: 'Milestone', required: true },
    completed: { type: Boolean, required: true },
    blockerNote: { type: String, trim: true }
}, {
    timestamps: true
});

milestoneCheckInSchema.index({ internId: 1, milestoneId: 1 }, { unique: true });

export const MilestoneCheckIn = mongoose.model<IMilestoneCheckIn>('MilestoneCheckIn', milestoneCheckInSchema);
