import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Game from '@/models/Game';
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

    const { ticketNumber, ticketType, amount, scannedBy, notes, date, gameBook, gameNumber, gameName, costPerTicket } = req.body;

    if (!ticketNumber) {
      return res.status(400).json({ error: 'Ticket number is required' });
    }

    // Log the incoming data for debugging
    console.log('Scan request received:', {
      ticketNumber,
      gameNumber,
      gameBook,
      gameName,
      costPerTicket,
      date,
      rawBody: req.body
    });

    // Use provided date or default to today
    const ticketDate = date ? startOfDay(parseISO(date)) : startOfDay(new Date());

    // Check for duplicate ticket - same ticket number, game number, and book number on the same date
    const duplicateQuery: any = {
      ticketNumber: ticketNumber.toString(),
      date: ticketDate,
    };

    // If we have game number and book number, use them for more precise duplicate detection
    if (gameNumber) {
      duplicateQuery.gameNumber = gameNumber.toString().trim();
    }
    if (gameBook) {
      duplicateQuery.gameBook = gameBook.toString().trim();
    }

    const existingTicket = await Ticket.findOne(duplicateQuery);

    if (existingTicket) {
      return res.status(409).json({ 
        success: false,
        error: 'This ticket has already been scanned today',
        isDuplicate: true,
        existingTicket 
      });
    }

    // Look up game information from database if gameNumber is provided
    let finalGameName = gameName;
    let finalCostPerTicket = costPerTicket ? parseFloat(costPerTicket) : undefined;
    
    if (gameNumber) {
      try {
        const game = await Game.findOne({ 
          gameNumber: gameNumber.toString().trim(),
          isActive: true 
        });
        
        if (game) {
          // Fill in missing data from database
          if (!finalGameName || finalGameName === `Game ${gameNumber}`) {
            finalGameName = game.gameName;
          }
          if (!finalCostPerTicket && game.costPerTicket) {
            finalCostPerTicket = game.costPerTicket;
          }
        }
      } catch (error) {
        console.error('Error looking up game:', error);
        // Continue even if game lookup fails
      }
    }

    // Create ticket with specified date
    const ticket = await Ticket.create({
      ticketNumber: ticketNumber.toString(),
      ticketType: ticketType || 'lottery',
      amount: amount ? parseFloat(amount) : (finalCostPerTicket || 0),
      scannedBy: scannedBy || 'system',
      date: ticketDate,
      notes: notes || '',
      gameBook: gameBook || undefined,
      gameNumber: gameNumber || undefined,
      gameName: finalGameName || undefined,
      costPerTicket: finalCostPerTicket,
    });

    return res.status(201).json({ success: true, ticket });
  } catch (error: any) {
    console.error('Error scanning ticket:', error);
    
    // Check if it's a duplicate key error from MongoDB
    if (error.code === 11000 || error.message?.includes('duplicate')) {
      return res.status(409).json({ 
        success: false,
        error: 'This ticket has already been scanned today',
        isDuplicate: true 
      });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to scan ticket' });
  }
}

