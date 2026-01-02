import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import DailyReport from '@/models/DailyReport';
import Deposit from '@/models/Deposit';
import { startOfDay, endOfDay, parseISO, subDays } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { startDate, endDate, days = '7' } = req.query;

    let queryStart: Date;
    let queryEnd: Date = endOfDay(new Date());

    if (startDate && endDate) {
      queryStart = startOfDay(parseISO(startDate as string));
      queryEnd = endOfDay(parseISO(endDate as string));
    } else {
      // Default to last N days
      const daysBack = parseInt(days as string);
      queryStart = startOfDay(subDays(new Date(), daysBack));
    }

    // Get all reports in date range
    const reports = await DailyReport.find({
      date: {
        $gte: queryStart,
        $lte: queryEnd,
      },
    }).sort({ date: -1 });

    // Get all deposits in date range
    const deposits = await Deposit.find({
      date: {
        $gte: queryStart,
        $lte: queryEnd,
      },
    }).sort({ date: -1 });

    // Calculate summary
    const totalRevenue = reports.reduce((sum, report) => sum + report.totalRevenue, 0);
    const totalTickets = reports.reduce((sum, report) => sum + report.totalTickets, 0);
    const totalDeposits = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const pendingDeposits = deposits
      .filter((d) => d.status === 'pending')
      .reduce((sum, deposit) => sum + deposit.amount, 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalRevenue,
        totalTickets,
        totalDeposits,
        pendingDeposits,
        reportCount: reports.length,
        dateRange: {
          start: queryStart,
          end: queryEnd,
        },
      },
      reports,
      deposits,
    });
  } catch (error: any) {
    console.error('Error fetching summary:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch summary' });
  }
}

