import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { ticketNumber, ticketType, amount, scannedBy, notes } = req.body;

    if (!ticketNumber || !ticketType || !amount || !scannedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create ticket with today's date
    const ticket = await Ticket.create({
      ticketNumber: ticketNumber.toString(),
      ticketType,
      amount: parseFloat(amount),
      scannedBy,
      date: new Date(),
      notes: notes || '',
    });

    return res.status(201).json({ success: true, ticket });
  } catch (error: any) {
    console.error('Error scanning ticket:', error);
    return res.status(500).json({ error: error.message || 'Failed to scan ticket' });
  }
}

