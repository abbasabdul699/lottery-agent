import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import DailyReport from '@/models/DailyReport';
import DailyLotteryReport from '@/models/DailyLotteryReport';
import Deposit from '@/models/Deposit';
import Ticket from '@/models/Ticket';
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

    // Get all lottery reports in date range (for card sales)
    const lotteryReports = await DailyLotteryReport.find({
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

    // Calculate total card sales (EBT + Credit + Debit)
    const totalCardSales = lotteryReports.reduce((sum, report) => {
      const ebt = report.debitCreditCard || 0;
      const credit = report.creditsSale || 0;
      const debit = report.debitsSale || 0;
      return sum + ebt + credit + debit;
    }, 0);

    // Get today's Over/Short from today's lottery report
    const today = startOfDay(new Date());
    const todayReport = await DailyLotteryReport.findOne({ date: today });
    const todayOverShort = todayReport?.overShort || 0;

    // Calculate yesterday's instant sale
    const yesterday = startOfDay(subDays(new Date(), 1));
    const yesterdayEnd = endOfDay(yesterday);
    const yesterdayTickets = await Ticket.find({
      date: {
        $gte: yesterday,
        $lte: yesterdayEnd,
      },
    });

    // Calculate instant sale using the same formula as instant-sale.ts
    const ticketsByPriceGroup = new Map<number, typeof yesterdayTickets>();
    yesterdayTickets.forEach(ticket => {
      const cost = ticket.costPerTicket;
      if (cost == null || cost <= 0) {
        return;
      }
      if (!ticketsByPriceGroup.has(cost)) {
        ticketsByPriceGroup.set(cost, []);
      }
      ticketsByPriceGroup.get(cost)!.push(ticket);
    });

    let yesterdayInstantSale = 0;
    ticketsByPriceGroup.forEach((groupTickets, ticketCost) => {
      const sumOfTicketNumbersPlusOne = groupTickets.reduce((sum, ticket) => {
        const ticketNumber = parseInt(ticket.ticketNumber, 10) || 0;
        return sum + (ticketNumber + 1);
      }, 0);
      const groupSales = sumOfTicketNumbersPlusOne * ticketCost;
      yesterdayInstantSale += groupSales;
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalRevenue,
        totalCardSales,
        totalTickets,
        totalDeposits,
        todayOverShort,
        yesterdayInstantSale,
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

