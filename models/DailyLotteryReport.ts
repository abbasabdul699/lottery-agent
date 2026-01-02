import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDailyLotteryReport extends Document {
  date: Date;
  // Today Invoice Section
  onlineNetSalesSR50?: number;
  onlineNetSales2SR50?: number;
  totalOnlineNetSales?: number;
  onlineCashingSR50?: number;
  onlineCashing2SR50?: number;
  totalOnlineCashing?: number;
  instantCashingSR34?: number;
  instantCashing2SR34?: number;
  totalInstantCashing?: number;
  instantSaleSR34?: number;
  // Today Cash Section
  debitCreditCard?: number;
  creditsSale?: number;
  debitsSale?: number;
  vendingCash?: number;
  onlineBalance?: number;
  instantBalance?: number;
  totalBalance?: number;
  registerCash?: number;
  overShort?: number;
  // Metadata
  createdBy: string;
  isFromCSV?: boolean;
  csvSource?: string;
  notes?: string;
}

const DailyLotteryReportSchema: Schema = new Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true,
  },
  // Today Invoice Section
  onlineNetSalesSR50: {
    type: Number,
    default: 0,
  },
  onlineNetSales2SR50: {
    type: Number,
    default: 0,
  },
  totalOnlineNetSales: {
    type: Number,
    default: 0,
  },
  onlineCashingSR50: {
    type: Number,
    default: 0,
  },
  onlineCashing2SR50: {
    type: Number,
    default: 0,
  },
  totalOnlineCashing: {
    type: Number,
    default: 0,
  },
  instantCashingSR34: {
    type: Number,
    default: 0,
  },
  instantCashing2SR34: {
    type: Number,
    default: 0,
  },
  totalInstantCashing: {
    type: Number,
    default: 0,
  },
  instantSaleSR34: {
    type: Number,
    default: 0,
  },
  // Today Cash Section
  debitCreditCard: {
    type: Number,
    default: 0,
  },
  creditsSale: {
    type: Number,
    default: 0,
  },
  debitsSale: {
    type: Number,
    default: 0,
  },
  vendingCash: {
    type: Number,
    default: 0,
  },
  onlineBalance: {
    type: Number,
    default: 0,
  },
  instantBalance: {
    type: Number,
    default: 0,
  },
  totalBalance: {
    type: Number,
    default: 0,
  },
  registerCash: {
    type: Number,
    default: 0,
  },
  overShort: {
    type: Number,
    default: 0,
  },
  // Metadata
  createdBy: {
    type: String,
    required: true,
  },
  isFromCSV: {
    type: Boolean,
    default: false,
  },
  csvSource: {
    type: String,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

export default (mongoose.models.DailyLotteryReport as Model<IDailyLotteryReport>) || mongoose.model<IDailyLotteryReport>('DailyLotteryReport', DailyLotteryReportSchema);

