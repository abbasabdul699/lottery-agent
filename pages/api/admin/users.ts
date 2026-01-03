import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Helper function to check if user is admin (for now, we'll use a simple check)
// In production, you'd want to use proper session management
async function isAdmin(req: NextApiRequest): Promise<boolean> {
  // For MVP, we'll check if there's an admin user in the request
  // In production, use proper session/auth tokens
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  
  // Simple check - in production use JWT or session tokens
  try {
    await connectDB();
    const adminUser = await User.findOne({ role: 'admin' });
    return !!adminUser;
  } catch {
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await connectDB();

    // GET - List all users
    if (req.method === 'GET') {
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });
      return res.status(200).json({ success: true, users });
    }

    // POST - Create new user
    if (req.method === 'POST') {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const user = await User.create({
        email: email.toLowerCase(),
        password,
        name,
        role: role || 'employee',
      });

      const userData = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      };

      return res.status(201).json({ success: true, user: userData });
    }

    // PUT - Update user
    if (req.method === 'PUT') {
      const { id, email, name, role, password } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (role) updateData.role = role;
      if (email) updateData.email = email.toLowerCase();
      if (password) updateData.password = password;

      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ success: true, user });
    }

    // DELETE - Delete user
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Prevent deleting the last admin
      const user = await User.findById(id);
      if (user?.role === 'admin') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'Cannot delete the last admin user' });
        }
      }

      await User.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('User management error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process request' });
  }
}

