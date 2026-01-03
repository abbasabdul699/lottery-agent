import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import DailyLotteryReport from '@/models/DailyLotteryReport';
import StoreSettings from '@/models/StoreSettings';
import { parseISO, startOfDay, endOfDay } from 'date-fns';

interface ChecklistStatus {
  scanning: {
    completed: boolean;
    uniqueGamesScanned: number;
    expectedGameCount: number;
    totalTicketsScanned: number;
    priceGroupsScanned: number[];
    allPriceGroupsScanned: boolean;
  };
  dailyReport: {
    completed: boolean;
    fieldsCompleted: {
      register1: boolean;
      register2: boolean;
      cashSection: boolean;
      registerCash: boolean;
    };
  };
  allComplete: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { date } = req.query;
    const queryDate = date ? parseISO(date as string) : new Date();
    const start = startOfDay(queryDate);
    const end = endOfDay(queryDate);

    // Get store settings (defaults if not set)
    let storeSettings = await StoreSettings.findOne({ storeId: 'default' });
    if (!storeSettings) {
      // Create default settings
      storeSettings = await StoreSettings.create({
        storeId: 'default',
        expectedGameCount: 100,
        expectedPriceGroups: [50, 30, 20, 10, 5, 2, 1],
      });
    }

    // Check scanning completion
    const tickets = await Ticket.find({
      date: {
        $gte: start,
        $lte: end,
      },
    });

    const uniqueGames = new Set<string>();
    const priceGroupsScanned = new Set<number>();
    
    tickets.forEach(ticket => {
      if (ticket.gameNumber) {
        uniqueGames.add(ticket.gameNumber);
      }
      if (ticket.costPerTicket && ticket.costPerTicket > 0) {
        priceGroupsScanned.add(ticket.costPerTicket);
      }
    });

    const expectedPriceGroups = storeSettings.expectedPriceGroups || [50, 30, 20, 10, 5, 2, 1];
    const allPriceGroupsScanned = expectedPriceGroups.every(price => 
      priceGroupsScanned.has(price)
    );

    // For scanning, we check if unique games scanned meets threshold OR all price groups are scanned
    // Since stores have different game counts, we use price groups as the primary indicator
    const scanningCompleted = allPriceGroupsScanned || 
      (uniqueGames.size >= (storeSettings.expectedGameCount || 100));

    // Check daily report completion
    const report = await DailyLotteryReport.findOne({ date: start });

    let dailyReportCompleted = false;
    const fieldsCompleted = {
      register1: false,
      register2: false,
      todayCashSection: false,
    };

    if (report) {
      // Register 1: Check if at least one field is filled
      fieldsCompleted.register1 = !!(
        (report.onlineNetSalesSR50 && report.onlineNetSalesSR50 > 0) ||
        (report.onlineCashingSR50 && report.onlineCashingSR50 > 0) ||
        (report.instantCashingSR34 && report.instantCashingSR34 > 0)
      );

      // Register 2: Check if at least one field is filled
      fieldsCompleted.register2 = !!(
        (report.onlineNetSales2SR50 && report.onlineNetSales2SR50 > 0) ||
        (report.onlineCashing2SR50 && report.onlineCashing2SR50 > 0) ||
        (report.instantCashing2SR34 && report.instantCashing2SR34 > 0)
      );

      // Today's Cash Section: Check if card sales AND register cash are filled
      const hasCardSales = !!(
        (report.debitCreditCard && report.debitCreditCard > 0) ||
        (report.creditsSale && report.creditsSale > 0) ||
        (report.debitsSale && report.debitsSale > 0)
      );
      const hasRegisterCash = !!(report.registerCash && report.registerCash > 0);
      
      fieldsCompleted.todayCashSection = hasCardSales && hasRegisterCash;

      // Report is complete if all sections have data
      dailyReportCompleted = 
        fieldsCompleted.register1 &&
        fieldsCompleted.register2 &&
        fieldsCompleted.todayCashSection;
    }

    const allComplete = scanningCompleted && dailyReportCompleted;

    const status: ChecklistStatus = {
      scanning: {
        completed: scanningCompleted,
        uniqueGamesScanned: uniqueGames.size,
        expectedGameCount: storeSettings.expectedGameCount || 100,
        totalTicketsScanned: tickets.length,
        priceGroupsScanned: Array.from(priceGroupsScanned).sort((a, b) => b - a),
        allPriceGroupsScanned: allPriceGroupsScanned,
      },
      dailyReport: {
        completed: dailyReportCompleted,
        fieldsCompleted,
      },
      allComplete,
    };

    return res.status(200).json({ success: true, status });
  } catch (error: any) {
    console.error('Error fetching checklist status:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch checklist status' });
  }
}

