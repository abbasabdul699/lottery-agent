import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import Game from '@/models/Game';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { fileContent, fileType } = req.body;

    if (!fileContent) {
      return res.status(400).json({ error: 'File content is required' });
    }

    let games: any[] = [];

    // Parse CSV
    if (fileType === 'text/csv' || fileType === 'application/vnd.ms-excel' || fileContent.includes(',')) {
      const lines = fileContent.split('\n').filter((line: string) => line.trim());
      
      // Try to detect header row
      const firstLine = lines[0].toLowerCase();
      let gameNumberIndex = -1;
      let gameNameIndex = -1;
      let costIndex = -1;
      let ticketsPerBookIndex = -1;
      let descriptionIndex = -1;

      // Common header variations - handle lottery format specifically
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Game # detection (handles "Game #", "Game Number", etc.)
      gameNumberIndex = headers.findIndex(h => 
        (h.includes('game') && (h.includes('#') || h.includes('number') || h.includes('num'))) ||
        h === 'game #' || h === 'game#'
      );
      
      // Game Name detection (handles "Name" column)
      gameNameIndex = headers.findIndex(h => 
        h.includes('name') && !h.includes('game') ||
        (h.includes('game') && h.includes('name'))
      );
      
      // Price Point detection (handles "Price Point", "Price", "Cost", etc.)
      costIndex = headers.findIndex(h => 
        h.includes('price point') || 
        h.includes('price') || 
        h.includes('cost') || 
        h.includes('amount')
      );
      
      // Tickets per Book (optional)
      ticketsPerBookIndex = headers.findIndex(h => 
        h.includes('ticket') && h.includes('book') ||
        h.includes('tickets per book')
      );
      
      descriptionIndex = headers.findIndex(h => h.includes('description') || h.includes('desc'));

      // If headers found, skip first line
      const dataLines = (gameNumberIndex >= 0 || gameNameIndex >= 0) ? lines.slice(1) : lines;

      for (const line of dataLines) {
        // Better CSV parsing that handles quoted fields
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim().replace(/^"|"$/g, ''));
        
        if (values.length === 0 || !values[0]) continue;

        const game: any = {};

        if (gameNumberIndex >= 0 && values[gameNumberIndex]) {
          game.gameNumber = values[gameNumberIndex];
        } else if (values[0]) {
          game.gameNumber = values[0];
        }

        if (gameNameIndex >= 0 && values[gameNameIndex]) {
          game.gameName = values[gameNameIndex];
        } else if (values[1]) {
          game.gameName = values[1];
        } else if (values[0] && !game.gameNumber) {
          game.gameName = values[0];
        }

        if (costIndex >= 0 && values[costIndex]) {
          // Handle formats like "$5.00" or "5.00"
          const cost = parseFloat(values[costIndex].replace(/[^0-9.]/g, ''));
          if (!isNaN(cost)) game.costPerTicket = cost;
        } else if (values[2]) {
          const cost = parseFloat(values[2].replace(/[^0-9.]/g, ''));
          if (!isNaN(cost)) game.costPerTicket = cost;
        }

        // Store tickets per book in description if available
        if (ticketsPerBookIndex >= 0 && values[ticketsPerBookIndex]) {
          const ticketsPerBook = values[ticketsPerBookIndex];
          if (descriptionIndex >= 0 && values[descriptionIndex]) {
            game.description = `${values[descriptionIndex]}. Tickets per Book: ${ticketsPerBook}`;
          } else {
            game.description = `Tickets per Book: ${ticketsPerBook}`;
          }
        } else if (descriptionIndex >= 0 && values[descriptionIndex]) {
          game.description = values[descriptionIndex];
        }

        if (game.gameNumber && game.gameName) {
          game.isActive = true;
          games.push(game);
        }
      }
    } else {
      // Try to parse as JSON
      try {
        const jsonData = JSON.parse(fileContent);
        games = Array.isArray(jsonData) ? jsonData : [jsonData];
      } catch (e) {
        return res.status(400).json({ error: 'Unsupported file format. Please use CSV or JSON.' });
      }
    }

    if (games.length === 0) {
      return res.status(400).json({ error: 'No valid games found in file' });
    }

    // Import games (upsert)
    const results = [];
    const errors = [];

    for (const gameData of games) {
      try {
        const { gameNumber, gameName, costPerTicket, description, isActive } = gameData;
        
        if (!gameNumber || !gameName) {
          errors.push({ game: gameData, error: 'Game number and name are required' });
          continue;
        }

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
      total: games.length,
      errorDetails: errors,
    });
  } catch (error: any) {
    console.error('Import games error:', error);
    return res.status(500).json({ error: error.message || 'Failed to import games' });
  }
}

