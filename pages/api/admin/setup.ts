import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// This endpoint should only be used once to create the first admin user
// After the first admin is created, this endpoint should be disabled or protected
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ 
        error: 'Admin user already exists. Please use the admin login page.' 
      });
    }

    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create first admin user
    const admin = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      role: 'admin',
    });

    const userData = {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    return res.status(201).json({ 
      success: true, 
      message: 'Admin user created successfully',
      user: userData 
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create admin user' });
  }
}

