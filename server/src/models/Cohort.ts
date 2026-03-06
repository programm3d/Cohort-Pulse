import mongoose, { Document, Schema } from 'mongoose';

export interface ICohort extends Document {
    name: string;
    startDate: Date;
    endDate: Date;
    description?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const cohortSchema = new Schema<ICohort>({
    name: { type: String, required: true, trim: true, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});

export const Cohort = mongoose.model<ICohort>('Cohort', cohortSchema);
