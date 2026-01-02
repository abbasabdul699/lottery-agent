import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITicket extends Document {
  ticketNumber: string;
  ticketType: string;
  amount: number;
  scannedAt: Date;
  scannedBy: string;
  date: Date;
  notes?: string;
}

const TicketSchema: Schema = new Schema({
  ticketNumber: {
    type: String,
    required: true,
    index: true,
  },
  ticketType: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  scannedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  scannedBy: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Compound index for efficient date queries
TicketSchema.index({ date: 1, scannedAt: -1 });

export default (mongoose.models.Ticket as Model<ITicket>) || mongoose.model<ITicket>('Ticket', TicketSchema);

