import mongoose, { Document, Schema } from 'mongoose';

export enum BlockerStatus {
    OPEN = 'OPEN',
    RESOLVED = 'RESOLVED'
}

export interface IBlocker extends Document {
    internId: mongoose.Types.ObjectId;
    isAnonymous: boolean;
    title: string;
    description: string;
    status: BlockerStatus;
    iHaveThisTooCount: number;
    iHaveThisTooUsers: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const blockerSchema = new Schema<IBlocker>({
    internId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: false },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: Object.values(BlockerStatus), default: BlockerStatus.OPEN },
    iHaveThisTooCount: { type: Number, default: 0 },
    iHaveThisTooUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

export const Blocker = mongoose.model<IBlocker>('Blocker', blockerSchema);

export interface IBlockerReply extends Document {
    blockerId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId; // User posting the reply
    isAnonymous: boolean;
    content: string;
    isResolution: boolean; // Marks if this reply resolved the blocker
    createdAt: Date;
    updatedAt: Date;
}

const blockerReplySchema = new Schema<IBlockerReply>({
    blockerId: { type: Schema.Types.ObjectId, ref: 'Blocker', required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isAnonymous: { type: Boolean, default: false },
    content: { type: String, required: true, trim: true },
    isResolution: { type: Boolean, default: false }
}, {
    timestamps: true
});

export const BlockerReply = mongoose.model<IBlockerReply>('BlockerReply', blockerReplySchema);
