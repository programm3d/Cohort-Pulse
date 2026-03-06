import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
    INTERN = 'INTERN',
    MENTOR = 'MENTOR',
    ADMIN = 'ADMIN'
}

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    cohortId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.INTERN },
    cohortId: { type: Schema.Types.ObjectId, ref: 'Cohort' }
}, {
    timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema);
