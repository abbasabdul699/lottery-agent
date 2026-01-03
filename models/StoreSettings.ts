import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStoreSettings extends Document {
  storeId?: string; // Optional: for multi-store support, defaults to 'default'
  expectedGameCount?: number; // Expected number of unique games/books to scan
  expectedPriceGroups?: number[]; // Expected price groups (e.g., [50, 30, 20, 10, 5, 2, 1])
  createdAt: Date;
  updatedAt: Date;
}

const StoreSettingsSchema: Schema = new Schema({
  storeId: {
    type: String,
    default: 'default',
    unique: true,
    index: true,
  },
  expectedGameCount: {
    type: Number,
    default: 100, // Default to 100 games
  },
  expectedPriceGroups: {
    type: [Number],
    default: [50, 30, 20, 10, 5, 2, 1], // Default price groups
  },
}, {
  timestamps: true,
});

export default (mongoose.models.StoreSettings as Model<IStoreSettings>) || mongoose.model<IStoreSettings>('StoreSettings', StoreSettingsSchema);

