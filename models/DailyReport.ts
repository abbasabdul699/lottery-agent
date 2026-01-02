import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDailyReport extends Document {
  date: Date;
  totalRevenue: number;
  totalTickets: number;
  cashOnHand: number;
  depositAmount: number;
  notes?: string;
  createdBy: string;
  emailSource?: string;
  isProcessed: boolean;
}

const DailyReportSchema: Schema = new Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true,
  },
  totalRevenue: {
    type: Number,
    required: true,
    default: 0,
  },
  totalTickets: {
    type: Number,
    required: true,
    default: 0,
  },
  cashOnHand: {
    type: Number,
    required: true,
    default: 0,
  },
  depositAmount: {
    type: Number,
    required: true,
    default: 0,
  },
  notes: {
    type: String,
  },
  createdBy: {
    type: String,
    required: true,
  },
  emailSource: {
    type: String,
  },
  isProcessed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default (mongoose.models.DailyReport as Model<IDailyReport>) || mongoose.model<IDailyReport>('DailyReport', DailyReportSchema);

