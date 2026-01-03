import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { parseISO, startOfDay, endOfDay } from 'date-fns';

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

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const queryDate = parseISO(date as string);
    const start = startOfDay(queryDate);
    const end = endOfDay(queryDate);

    // Get all tickets for the date
    // Filter by ticketType to distinguish instant tickets
    // For instant sales, we use ticketType: 'instant' or 'lottery' (depending on your system)
    const tickets = await Ticket.find({
      date: {
        $gte: start,
        $lte: end,
      },
      // Optionally filter by ticketType if you want to separate instant from other ticket types
      // ticketType: 'instant',
    });

    // Calculate Instant Sales using the formula:
    // Instant Sales = Σ (over price groups) [ (Σ (from i=1 to n) (TicketNumber_i + 1)) × TicketCost ]
    
    // Step 1: Group tickets by costPerTicket (price groups)
    // Only include tickets with a valid costPerTicket
    const ticketsByPriceGroup = new Map<number, typeof tickets>();
    
    tickets.forEach(ticket => {
      const cost = ticket.costPerTicket;
      // Skip tickets without a costPerTicket (they can't be calculated)
      if (cost == null || cost <= 0) {
        return;
      }
      if (!ticketsByPriceGroup.has(cost)) {
        ticketsByPriceGroup.set(cost, []);
      }
      ticketsByPriceGroup.get(cost)!.push(ticket);
    });

    // Step 2: For each price group, calculate: (Σ(TicketNumber + 1)) × TicketCost
    let totalInstantSale = 0;
    const priceGroupDetails: Array<{
      ticketCost: number;
      ticketCount: number;
      groupSales: number;
    }> = [];

    ticketsByPriceGroup.forEach((groupTickets, ticketCost) => {
      // Inner summation: Σ(TicketNumber + 1) for all tickets in this price group
      const sumOfTicketNumbersPlusOne = groupTickets.reduce((sum, ticket) => {
        // Parse ticketNumber as integer (e.g., "000" -> 0, "059" -> 59)
        const ticketNumber = parseInt(ticket.ticketNumber, 10) || 0;
        return sum + (ticketNumber + 1);
      }, 0);

      // Multiply by TicketCost for this group
      const groupSales = sumOfTicketNumbersPlusOne * ticketCost;
      totalInstantSale += groupSales;

      priceGroupDetails.push({
        ticketCost,
        ticketCount: groupTickets.length,
        groupSales,
      });
    });

    return res.status(200).json({ 
      success: true, 
      totalInstantSale,
      ticketCount: tickets.length,
      priceGroupDetails, // Optional: return breakdown by price group for debugging
    });
  } catch (error: any) {
    console.error('Error fetching instant sale:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch instant sale' });
  }
}

