import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import DailyReport from '@/models/DailyReport';
import Deposit from '@/models/Deposit';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { date, createdBy, cashOnHand, notes } = req.body;

    if (!date || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reportDate = parseISO(date);
    const startDate = startOfDay(reportDate);
    const endDate = endOfDay(reportDate);

    // Get all tickets for the date
    const tickets = await Ticket.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // Calculate totals
    const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.amount, 0);
    const totalTickets = tickets.length;

    // Calculate deposit amount (cash on hand minus what should be kept)
    const cashOnHandValue = cashOnHand ? parseFloat(cashOnHand) : totalRevenue;
    const depositAmount = cashOnHandValue; // Adjust this logic based on your business needs

    // Check if report already exists
    let report = await DailyReport.findOne({ date: startDate });

    if (report) {
      // Update existing report
      report.totalRevenue = totalRevenue;
      report.totalTickets = totalTickets;
      report.cashOnHand = cashOnHandValue;
      report.depositAmount = depositAmount;
      report.notes = notes || report.notes;
      report.createdBy = createdBy;
      await report.save();
    } else {
      // Create new report
      report = await DailyReport.create({
        date: startDate,
        totalRevenue,
        totalTickets,
        cashOnHand: cashOnHandValue,
        depositAmount,
        notes: notes || '',
        createdBy,
        isProcessed: false,
      });
    }

    // Create or update deposit record
    let deposit = await Deposit.findOne({ reportId: report._id });
    if (deposit) {
      deposit.amount = depositAmount;
      deposit.date = startDate;
      await deposit.save();
    } else {
      deposit = await Deposit.create({
        date: startDate,
        amount: depositAmount,
        reportId: report._id,
        status: 'pending',
        createdBy,
      });
    }

    return res.status(200).json({
      success: true,
      report,
      deposit,
      tickets: tickets.length,
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate report' });
  }
}

