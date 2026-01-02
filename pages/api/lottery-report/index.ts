import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import DailyLotteryReport from '@/models/DailyLotteryReport';
import { parseISO, startOfDay } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      await connectDB();

      const { date } = req.query;
      let query: any = {};

      if (date) {
        const queryDate = startOfDay(parseISO(date as string));
        query.date = queryDate;
      } else {
        // Default to today
        const today = startOfDay(new Date());
        query.date = today;
      }

      const report = await DailyLotteryReport.findOne(query);

      return res.status(200).json({ success: true, report: report || null });
    } catch (error: any) {
      console.error('Error fetching lottery report:', error);
      return res.status(500).json({ error: error.message || 'Failed to fetch report' });
    }
  }

  if (req.method === 'POST') {
    try {
      await connectDB();

      const {
        date,
        onlineNetSalesSR50,
        onlineNetSales2SR50,
        onlineCashingSR50,
        onlineCashing2SR50,
        instantCashingSR34,
        instantCashing2SR34,
        instantSaleSR34,
        debitCreditCard,
        creditsSale,
        debitsSale,
        vendingCash,
        onlineBalance,
        instantBalance,
        registerCash,
        createdBy,
        notes,
      } = req.body;

      if (!date || !createdBy) {
        return res.status(400).json({ error: 'Date and createdBy are required' });
      }

      const reportDate = startOfDay(parseISO(date));

      // Calculate totals
      const totalOnlineNetSales = (parseFloat(onlineNetSalesSR50 || 0) + parseFloat(onlineNetSales2SR50 || 0));
      const totalOnlineCashing = (parseFloat(onlineCashingSR50 || 0) + parseFloat(onlineCashing2SR50 || 0));
      const totalInstantCashing = (parseFloat(instantCashingSR34 || 0) + parseFloat(instantCashing2SR34 || 0));
      const totalBalance = (parseFloat(onlineBalance || 0) + parseFloat(instantBalance || 0));
      const overShort = totalBalance - parseFloat(registerCash || 0);

      // Check if report exists
      let report = await DailyLotteryReport.findOne({ date: reportDate });

      const reportData = {
        date: reportDate,
        onlineNetSalesSR50: parseFloat(onlineNetSalesSR50 || 0),
        onlineNetSales2SR50: parseFloat(onlineNetSales2SR50 || 0),
        totalOnlineNetSales,
        onlineCashingSR50: parseFloat(onlineCashingSR50 || 0),
        onlineCashing2SR50: parseFloat(onlineCashing2SR50 || 0),
        totalOnlineCashing,
        instantCashingSR34: parseFloat(instantCashingSR34 || 0),
        instantCashing2SR34: parseFloat(instantCashing2SR34 || 0),
        totalInstantCashing,
        instantSaleSR34: parseFloat(instantSaleSR34 || 0),
        debitCreditCard: parseFloat(debitCreditCard || 0),
        creditsSale: parseFloat(creditsSale || 0),
        debitsSale: parseFloat(debitsSale || 0),
        vendingCash: parseFloat(vendingCash || 0),
        onlineBalance: parseFloat(onlineBalance || 0),
        instantBalance: parseFloat(instantBalance || 0),
        totalBalance,
        registerCash: parseFloat(registerCash || 0),
        overShort,
        createdBy,
        notes: notes || '',
      };

      if (report) {
        // Update existing report
        Object.assign(report, reportData);
        await report.save();
      } else {
        // Create new report
        report = await DailyLotteryReport.create(reportData);
      }

      return res.status(200).json({ success: true, report });
    } catch (error: any) {
      console.error('Error saving lottery report:', error);
      return res.status(500).json({ error: error.message || 'Failed to save report' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

