import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import DailyReport from '@/models/DailyReport';
import { parseISO, startOfDay } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { date, startDate, endDate } = req.query;

    let query: any = {};

    if (date) {
      const queryDate = parseISO(date as string);
      query.date = startOfDay(queryDate);
    } else if (startDate && endDate) {
      query.date = {
        $gte: startOfDay(parseISO(startDate as string)),
        $lte: startOfDay(parseISO(endDate as string)),
      };
    }

    const reports = await DailyReport.find(query)
      .sort({ date: -1 })
      .limit(100);

    return res.status(200).json({ success: true, reports });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch reports' });
  }
}

