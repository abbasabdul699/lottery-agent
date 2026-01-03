import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import StoreSettings from '@/models/StoreSettings';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      // Get store settings
      let settings = await StoreSettings.findOne({ storeId: 'default' });
      
      if (!settings) {
        // Create default settings
        settings = await StoreSettings.create({
          storeId: 'default',
          expectedGameCount: 100,
          expectedPriceGroups: [50, 30, 20, 10, 5, 2, 1],
        });
      }

      return res.status(200).json({ success: true, settings });
    }

    if (req.method === 'PUT') {
      // Update store settings
      const { expectedGameCount, expectedPriceGroups } = req.body;

      let settings = await StoreSettings.findOne({ storeId: 'default' });

      if (!settings) {
        settings = await StoreSettings.create({
          storeId: 'default',
          expectedGameCount: expectedGameCount || 100,
          expectedPriceGroups: expectedPriceGroups || [50, 30, 20, 10, 5, 2, 1],
        });
      } else {
        if (expectedGameCount !== undefined) {
          settings.expectedGameCount = expectedGameCount;
        }
        if (expectedPriceGroups !== undefined) {
          settings.expectedPriceGroups = expectedPriceGroups;
        }
        await settings.save();
      }

      return res.status(200).json({ success: true, settings });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error handling store settings:', error);
    return res.status(500).json({ error: error.message || 'Failed to handle store settings' });
  }
}

