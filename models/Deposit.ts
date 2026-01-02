import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeposit extends Document {
  date: Date;
  amount: number;
  reportId: mongoose.Types.ObjectId;
  status: 'pending' | 'completed';
  notes?: string;
  createdBy: string;
}

const DepositSchema: Schema = new Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  reportId: {
    type: Schema.Types.ObjectId,
    ref: 'DailyReport',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  notes: {
    type: String,
  },
  createdBy: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export default (mongoose.models.Deposit as Model<IDeposit>) || mongoose.model<IDeposit>('Deposit', DepositSchema);

