# Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or MongoDB Atlas)
- Vercel account (for deployment)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB

**Option A: Local MongoDB**
- Install MongoDB locally
- Start MongoDB service
- Use connection string: `mongodb://localhost:27017/lottery_system`

**Option B: MongoDB Atlas (Recommended for Production)**
- Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create a new cluster
- Get connection string
- Format: `mongodb+srv://username:password@cluster.mongodb.net/lottery_system`

### 3. Configure Environment Variables

Create `.env.local` file:

```env
MONGODB_URI=your_mongodb_connection_string_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
6. Deploy!

## First Use

1. Go to "Scan Ticket" page
2. Enter employee name (this will be saved for future scans)
3. Start scanning tickets with your barcode scanner
4. At end of day, go to "Reports" page
5. Click "Generate Report" to create summary
6. View deposit amount needed

## Scanner Setup

Most USB/Bluetooth barcode scanners work as keyboard input devices. When you scan:
1. The ticket number automatically fills in
2. Press Tab or click to move to next field
3. Scanner typically sends Enter after scanning, which can auto-submit

## Email Integration (Optional)

To set up email collection of daily reports:

1. Add email credentials to `.env.local`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
MONITOR_EMAIL=reports@yourbusiness.com
```

2. Set up a webhook or cron job to call `/api/email/process` periodically
3. Or use Vercel Cron Jobs to check email automatically

## Troubleshooting

**MongoDB Connection Error**
- Check your connection string
- Ensure MongoDB is running (if local)
- Check network/firewall settings (if Atlas)

**Scanner Not Working**
- Ensure scanner is in "Keyboard" mode (not USB HID)
- Test scanner in a text editor first
- Some scanners need configuration for Enter key behavior

**Build Errors**
- Run `npm install` again
- Delete `node_modules` and `.next` folders, then reinstall
- Check Node.js version (should be 18+)

