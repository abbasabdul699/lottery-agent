# Lottery System - End of Day Report

A mobile-first web application for scanning lottery tickets and generating daily reports with revenue and deposit tracking.

## Features

- 📱 **Mobile-Native Design**: Optimized for phone/tablet use with scanner integration
- 🎫 **Ticket Scanning**: Scan and record lottery tickets with barcode scanner support
- 📊 **Daily Reports**: Generate end-of-day reports showing revenue and deposit amounts
- 💰 **Deposit Tracking**: Track cash on hand and required bank deposits
- 📧 **Email Integration**: Collect data from daily reports via email (API endpoint ready)
- 📈 **Summary Dashboard**: View 7-day summaries and statistics

## Tech Stack

- **Frontend**: Next.js 14 with React and TypeScript
- **Styling**: Tailwind CSS (mobile-first responsive design)
- **Database**: MongoDB with Mongoose
- **Hosting**: Vercel (configured)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/lottery_system
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lottery_system

# Email configuration (optional, for email report collection)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
MONITOR_EMAIL=reports@yourbusiness.com

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Usage

### Scanning Tickets

1. Navigate to the "Scan Ticket" page
2. Use your barcode scanner to scan ticket numbers (or type manually)
3. Fill in ticket type, amount, and employee name
4. Submit to record the ticket

### Generating Reports

1. Go to the "Reports" page
2. Select a date
3. Click "Generate Report" to create an end-of-day summary
4. View revenue, ticket count, cash on hand, and deposit amount

### Email Integration

The `/api/email/process` endpoint can be configured to:
- Connect to your email server (IMAP)
- Parse daily report emails
- Automatically create/update reports

You can set up a webhook or cron job to call this endpoint periodically.

## API Endpoints

- `POST /api/tickets/scan` - Scan a new ticket
- `GET /api/tickets?date=YYYY-MM-DD` - Get tickets for a date
- `POST /api/reports/generate` - Generate a daily report
- `GET /api/reports` - Get all reports
- `GET /api/reports/summary?days=7` - Get summary statistics
- `POST /api/email/process` - Process email data into reports

## Scanner Integration

The app is designed to work with USB or Bluetooth barcode scanners. When a scanner reads a barcode, it typically sends the data followed by an Enter key, which the app automatically handles in the scan interface.

## Database Models

- **Ticket**: Individual scanned tickets
- **DailyReport**: End-of-day summaries
- **Deposit**: Bank deposit tracking

## Mobile Optimization

- Touch-friendly buttons and inputs
- Large text for easy reading
- Optimized for portrait orientation
- Prevents zoom on input focus (iOS)
- Responsive grid layouts

## License

Private - For business use only

