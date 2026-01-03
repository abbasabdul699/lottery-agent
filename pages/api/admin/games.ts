import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Game from '@/models/Game';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await connectDB();

    // GET - List all games
    if (req.method === 'GET') {
      const { activeOnly } = req.query;
      const query: any = {};
      
      if (activeOnly === 'true') {
        query.isActive = true;
      }

      const games = await Game.find(query).sort({ gameNumber: 1 });
      return res.status(200).json({ success: true, games });
    }

    // POST - Create new game or bulk import
    if (req.method === 'POST') {
      const { games, gameNumber, gameName, costPerTicket, description, isActive } = req.body;

      // Bulk import
      if (Array.isArray(games) && games.length > 0) {
        const results = [];
        const errors = [];

        for (const gameData of games) {
          try {
            const { gameNumber, gameName, costPerTicket, description, isActive } = gameData;
            
            if (!gameNumber || !gameName) {
              errors.push({ game: gameData, error: 'Game number and name are required' });
              continue;
            }

            // Upsert: update if exists, create if not
            const game = await Game.findOneAndUpdate(
              { gameNumber: gameNumber.toString().trim() },
              {
                gameName: gameName.trim(),
                costPerTicket: costPerTicket ? parseFloat(costPerTicket) : undefined,
                description: description?.trim(),
                isActive: isActive !== undefined ? isActive : true,
              },
              { upsert: true, new: true, runValidators: true }
            );

            results.push(game);
          } catch (error: any) {
            errors.push({ game: gameData, error: error.message });
          }
        }

        return res.status(200).json({
          success: true,
          imported: results.length,
          errors: errors.length,
          results,
          errorDetails: errors,
        });
      }

      // Single game creation
      if (!gameNumber || !gameName) {
        return res.status(400).json({ error: 'Game number and name are required' });
      }

      const game = await Game.create({
        gameNumber: gameNumber.toString().trim(),
        gameName: gameName.trim(),
        costPerTicket: costPerTicket ? parseFloat(costPerTicket) : undefined,
        description: description?.trim(),
        isActive: isActive !== undefined ? isActive : true,
      });

      return res.status(201).json({ success: true, game });
    }

    // PUT - Update game
    if (req.method === 'PUT') {
      const { id, gameNumber, gameName, costPerTicket, description, isActive } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Game ID is required' });
      }

      const updateData: any = {};
      if (gameNumber) updateData.gameNumber = gameNumber.toString().trim();
      if (gameName) updateData.gameName = gameName.trim();
      if (costPerTicket !== undefined) updateData.costPerTicket = costPerTicket ? parseFloat(costPerTicket) : null;
      if (description !== undefined) updateData.description = description?.trim();
      if (isActive !== undefined) updateData.isActive = isActive;

      const game = await Game.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      return res.status(200).json({ success: true, game });
    }

    // DELETE - Delete game
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Game ID is required' });
      }

      await Game.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'Game deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Game management error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process request' });
  }
}

