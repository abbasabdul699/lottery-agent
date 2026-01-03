import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { parseISO, startOfDay } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { ticketNumber, ticketType, amount, scannedBy, notes, date } = req.body;

    if (!ticketNumber) {
      return res.status(400).json({ error: 'Ticket number is required' });
    }

    // Use provided date or default to today
    const ticketDate = date ? startOfDay(parseISO(date)) : startOfDay(new Date());

    // Create ticket with specified date
    const ticket = await Ticket.create({
      ticketNumber: ticketNumber.toString(),
      ticketType: ticketType || 'lottery',
      amount: amount ? parseFloat(amount) : 0,
      scannedBy: scannedBy || 'system',
      date: ticketDate,
      notes: notes || '',
    });

    return res.status(201).json({ success: true, ticket });
  } catch (error: any) {
    console.error('Error scanning ticket:', error);
    return res.status(500).json({ error: error.message || 'Failed to scan ticket' });
  }
}

