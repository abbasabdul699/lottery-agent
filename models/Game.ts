import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGame extends Document {
  gameNumber: string;
  gameName: string;
  costPerTicket?: number;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema: Schema = new Schema({
  gameNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  gameName: {
    type: String,
    required: true,
    trim: true,
  },
  costPerTicket: {
    type: Number,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  description: {
    type: String,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
GameSchema.index({ gameNumber: 1, isActive: 1 });

export default (mongoose.models.Game as Model<IGame>) || mongoose.model<IGame>('Game', GameSchema);

