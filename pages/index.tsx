import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { format } from 'date-fns';

interface SummaryData {
  totalRevenue: number;
  totalTickets: number;
  totalDeposits: number;
  pendingDeposits: number;
  reportCount: number;
}

export default function Home() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayReport, setTodayReport] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSummary();
    fetchTodayReport();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/reports/summary?days=7');
      const data = await response.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayReport = async (date?: Date) => {
    try {
      const dateToUse = date || selectedDate;
      const dateStr = format(dateToUse, 'yyyy-MM-dd');
      const response = await fetch(`/api/reports?date=${dateStr}`);
      const data = await response.json();
      if (data.success && data.reports.length > 0) {
        setTodayReport(data.reports[0]);
      } else {
        setTodayReport(null);
      }
    } catch (error) {
      console.error('Error fetching today report:', error);
    }
  };

  const generateTodayReport = async (date?: Date) => {
    try {
      const dateToUse = date || selectedDate;
      const dateStr = format(dateToUse, 'yyyy-MM-dd');
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dateStr,
          createdBy: 'user', // Replace with actual user
        }),
      });
      const data = await response.json();
      if (data.success) {
        setTodayReport(data.report);
        fetchSummary();
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
    setShowCalendar(false);
    fetchTodayReport(newDate);
  };

  const handleDateClick = () => {
    setShowCalendar(true);
    // Trigger the date input click for mobile calendar
    setTimeout(() => {
      if (calendarRef.current) {
        calendarRef.current.focus();
        calendarRef.current.click();
        // Try to show picker if available (modern browsers)
        if (typeof calendarRef.current.showPicker === 'function') {
          calendarRef.current.showPicker();
        }
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <button
              onClick={handleDateClick}
              className="text-left cursor-pointer hover:opacity-80 transition-opacity w-full"
            >
              <p className="text-sm text-white font-bold">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </button>
            <input
              ref={calendarRef}
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              className="absolute opacity-0 w-0 h-0"
              aria-label="Select date"
            />
          </div>
          <h1 className="text-2xl font-bold text-right">End of Day Report</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/scan">
            <button className="bg-green-500 text-white p-6 rounded-lg shadow-md text-lg font-semibold active:bg-green-600">
              Scan Ticket
            </button>
          </Link>
          <Link href="/reports">
            <button className="bg-blue-500 text-white p-6 rounded-lg shadow-md text-lg font-semibold active:bg-blue-600">
              View Reports
            </button>
          </Link>
        </div>
        <div className="mt-4">
          <Link href="/daily-report">
            <button className="w-full bg-purple-500 text-white p-6 rounded-lg shadow-md text-lg font-semibold active:bg-purple-600">
              Daily Lottery Report
            </button>
          </Link>
        </div>

        {/* Today's Report Card */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold">
              {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ? "Today's Report"
                : `${format(selectedDate, 'MMM d')} Report`}
            </h2>
            {!todayReport && (
              <button
                onClick={() => generateTodayReport(selectedDate)}
                className="bg-blue-500 text-white px-4 py-2 rounded text-sm active:bg-blue-600"
              >
                Generate
              </button>
            )}
          </div>
          {todayReport ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue:</span>
                <span className="font-bold text-green-600">
                  ${todayReport.totalRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tickets:</span>
                <span className="font-bold">{todayReport.totalTickets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cash on Hand:</span>
                <span className="font-bold">${todayReport.cashOnHand.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 font-semibold">Deposit Amount:</span>
                <span className="font-bold text-blue-600 text-lg">
                  ${todayReport.depositAmount.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No report generated yet</p>
          )}
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-3">7-Day Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${summary.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold">{summary.totalTickets}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Deposits</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${summary.totalDeposits.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Deposits</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${summary.pendingDeposits.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}

