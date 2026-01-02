import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';

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
    let query: any = {};

    if (date) {
      const queryDate = parseISO(date as string);
      query.date = {
        $gte: startOfDay(queryDate),
        $lte: endOfDay(queryDate),
      };
    } else {
      // Default to today
      const today = new Date();
      query.date = {
        $gte: startOfDay(today),
        $lte: endOfDay(today),
      };
    }

    const tickets = await Ticket.find(query).sort({ scannedAt: -1 });

    return res.status(200).json({ success: true, tickets });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch tickets' });
  }
}

