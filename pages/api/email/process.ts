import type { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import DailyReport from '@/models/DailyReport';
import Ticket from '@/models/Ticket';
import nodemailer from 'nodemailer';
import { startOfDay, parseISO } from 'date-fns';

// This endpoint would typically be called by a webhook or cron job
// For now, it's a manual trigger endpoint
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // In a real implementation, you would:
    // 1. Connect to email server (IMAP)
    // 2. Fetch unread emails
    // 3. Parse email content for report data
    // 4. Create/update reports

    // For now, this is a placeholder that accepts manual data
    const { date, revenue, tickets, cashOnHand, emailContent } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const reportDate = startOfDay(parseISO(date));

    // Check if report exists
    let report = await DailyReport.findOne({ date: reportDate });

    if (report) {
      // Update existing report
      if (revenue !== undefined) report.totalRevenue = parseFloat(revenue);
      if (tickets !== undefined) report.totalTickets = parseInt(tickets);
      if (cashOnHand !== undefined) report.cashOnHand = parseFloat(cashOnHand);
      if (emailContent) report.emailSource = emailContent;
      report.depositAmount = report.cashOnHand;
      await report.save();
    } else {
      // Create new report from email data
      report = await DailyReport.create({
        date: reportDate,
        totalRevenue: revenue ? parseFloat(revenue) : 0,
        totalTickets: tickets ? parseInt(tickets) : 0,
        cashOnHand: cashOnHand ? parseFloat(cashOnHand) : 0,
        depositAmount: cashOnHand ? parseFloat(cashOnHand) : 0,
        emailSource: emailContent || '',
        createdBy: 'email-system',
        isProcessed: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Email processed successfully',
      report,
    });
  } catch (error: any) {
    console.error('Error processing email:', error);
    return res.status(500).json({ error: error.message || 'Failed to process email' });
  }
}

