import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Game from '@/models/Game';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { gameNumber, activeOnly } = req.query;
    
    // If gameNumber is provided, return single game
    if (gameNumber) {
      const game = await Game.findOne({ 
        gameNumber: gameNumber.toString().trim(),
        ...(activeOnly === 'true' ? { isActive: true } : {})
      });
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      return res.status(200).json({ success: true, game });
    }

    // Otherwise return all games (for scanning lookup)
    const query: any = {};
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    const games = await Game.find(query).select('gameNumber gameName costPerTicket isActive').sort({ gameNumber: 1 });
    return res.status(200).json({ success: true, games });
  } catch (error: any) {
    console.error('Error fetching games:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch games' });
  }
}

