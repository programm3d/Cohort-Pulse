import mongoose, { Document, Schema } from 'mongoose';

export interface IShoutout extends Document {
    fromInternId: mongoose.Types.ObjectId;
    toInternId: mongoose.Types.ObjectId;
    message: string;
    createdAt: Date;
    updatedAt: Date;
}

const shoutoutSchema = new Schema<IShoutout>({
    fromInternId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toInternId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true }
}, {
    timestamps: true
});

export const Shoutout = mongoose.model<IShoutout>('Shoutout', shoutoutSchema);
