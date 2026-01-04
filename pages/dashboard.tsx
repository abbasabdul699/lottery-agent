import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { useSharedDate } from '@/lib/useSharedDate';

interface SummaryData {
  totalRevenue: number;
  totalCardSales: number;
  totalTickets: number;
  totalDeposits: number;
  todayOverShort: number;
  yesterdayInstantSale: number;
  reportCount: number;
}

interface ChecklistStatus {
  scanning: {
    completed: boolean;
    uniqueGamesScanned: number;
    expectedGameCount: number;
    totalTicketsScanned: number;
    priceGroupsScanned: number[];
    allPriceGroupsScanned: boolean;
  };
  dailyReport: {
    completed: boolean;
    fieldsCompleted: {
      register1: boolean;
      register2: boolean;
      todayCashSection: boolean;
    };
  };
  allComplete: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useSharedDate();
  const [showCalendar, setShowCalendar] = useState(false);
  const [checklistStatus, setChecklistStatus] = useState<ChecklistStatus | null>(null);
  const [mounted, setMounted] = useState(false);
  const calendarRef = useRef<HTMLInputElement>(null);

  // Prevent hydration mismatch by only rendering date after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check authentication and role
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      // Redirect admin users to admin dashboard
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
        return;
      }
      // Only allow employee users
      if (user.role !== 'employee') {
        router.push('/login');
        return;
      }
    } catch (error) {
      router.push('/login');
      return;
    }

    fetchSummary();
    fetchChecklistStatus();
    
    // Set up polling to auto-update checklist every 10 seconds
    const interval = setInterval(() => {
      fetchChecklistStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [router]);

  // Refetch checklist and summary when date changes
  useEffect(() => {
    fetchChecklistStatus();
    fetchSummary();
  }, [selectedDate]);

  const fetchSummary = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/reports/summary?startDate=${dateStr}&endDate=${dateStr}`);
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

  const fetchChecklistStatus = async (date?: Date) => {
    try {
      const dateToUse = date || selectedDate;
      const dateStr = format(dateToUse, 'yyyy-MM-dd');
      const response = await fetch(`/api/checklist/status?date=${dateStr}`);
      const data = await response.json();
      if (data.success) {
        setChecklistStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching checklist status:', error);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Parse date string manually to avoid timezone issues
    // Split "YYYY-MM-DD" and create date in local timezone
    const dateStr = e.target.value;
    if (dateStr) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const newDate = new Date(year, month - 1, day); // month is 0-indexed
      setSelectedDate(newDate);
      setShowCalendar(false);
      fetchChecklistStatus(newDate);
    }
  };

  const handleDateClick = () => {
    if (calendarRef.current) {
      calendarRef.current.focus();
      // Try to show picker if available (modern browsers)
      if (typeof calendarRef.current.showPicker === 'function') {
        calendarRef.current.showPicker();
      } else {
        // Fallback: click the input directly
        calendarRef.current.click();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/logos.png" 
              alt="QuickRepp Logo" 
              width={70} 
              height={70}
              className="rounded-lg"
            />
          </div>
          <div className="relative text-right">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <button
              type="button"
              onClick={handleDateClick}
              className="text-right cursor-pointer hover:opacity-80 transition-opacity mt-1"
            >
              <p className="text-base text-white font-bold">
                {mounted ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Loading...'}
              </p>
            </button>
            <input
              ref={calendarRef}
              type="date"
              value={mounted ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
              onChange={handleDateChange}
              className="absolute opacity-0 pointer-events-none"
              style={{ right: 0, top: 0, width: '200px', height: '60px' }}
              aria-label="Select date"
            />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/scan">
            <button className="w-full bg-green-500 text-white p-6 rounded-lg shadow-md text-lg font-semibold active:bg-green-600 flex items-center justify-center space-x-2">
              <Image 
                src="/barcode-scanner.svg" 
                alt="Barcode Scanner" 
                width={28} 
                height={28}
                className="filter brightness-0 invert -scale-x-100"
              />
              <span>Scan Ticket</span>
            </button>
          </Link>
          <Link href="/daily-report">
            <button className="w-full bg-purple-500 text-white p-6 rounded-lg shadow-md text-lg font-semibold active:bg-purple-600 flex items-center justify-center space-x-2">
              <Image 
                src="/register.svg" 
                alt="Register" 
                width={28} 
                height={28}
                className="filter brightness-0 invert"
              />
              <span>Report</span>
            </button>
          </Link>
        </div>

        {/* Closing Checklist */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold mb-3 text-gray-900">Closing Checklist</h2>
          {checklistStatus ? (
            <div className="space-y-3">
              {/* Scanning Section */}
              <div className="border-b border-gray-200 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {checklistStatus.scanning.completed ? (
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                    )}
                    <span className={`font-semibold ${checklistStatus.scanning.completed ? 'text-green-700' : 'text-gray-700'}`}>
                      Scan All Tickets
                    </span>
                  </div>
                </div>
                <div className="pl-8 text-sm text-gray-600 space-y-1">
                  <p>
                    Tickets scanned: <span className="font-semibold">{checklistStatus.scanning.totalTicketsScanned}</span>
                  </p>
                  {checklistStatus.scanning.allPriceGroupsScanned ? (
                    <p className="text-green-600">✓ All price groups scanned</p>
                  ) : (
                    <p>
                      Price groups: {checklistStatus.scanning.priceGroupsScanned.length} / {checklistStatus.scanning.priceGroupsScanned.length > 0 ? 'Multiple' : '0'}
                    </p>
                  )}
                </div>
              </div>

              {/* Daily Report Section */}
              <div className="border-b border-gray-200 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {checklistStatus.dailyReport.completed ? (
                      <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                    )}
                    <span className={`font-semibold ${checklistStatus.dailyReport.completed ? 'text-green-700' : 'text-gray-700'}`}>
                      Complete Daily Report
                    </span>
                  </div>
                </div>
                <div className="pl-8 text-sm text-gray-600 space-y-1">
                  <div className="flex items-center space-x-2">
                    {checklistStatus.dailyReport.fieldsCompleted.register1 ? (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4 border border-gray-300 rounded"></div>
                    )}
                    <span>Lottery Register 1</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {checklistStatus.dailyReport.fieldsCompleted.register2 ? (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4 border border-gray-300 rounded"></div>
                    )}
                    <span>Lottery Register 2</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {checklistStatus.dailyReport.fieldsCompleted.todayCashSection ? (
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4 border border-gray-300 rounded"></div>
                    )}
                    <span>Today&apos;s Cash Section</span>
                  </div>
                </div>
              </div>

              {/* Overall Status */}
              {checklistStatus.allComplete && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-green-600 font-semibold">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>All tasks completed! Ready to close.</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Loading checklist...</p>
          )}
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-3 text-black">Today&apos;s Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Card Sales</p>
                <p className="text-2xl font-bold text-green-600">
                  ${summary.totalCardSales?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Books Scanned</p>
                <p className="text-2xl font-bold text-black">{summary.totalTickets || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Over/Short</p>
                <p className={`text-2xl font-bold ${
                  (summary.todayOverShort || 0) > 0 
                    ? 'text-green-600' 
                    : (summary.todayOverShort || 0) < 0 
                    ? 'text-red-600' 
                    : 'text-gray-600'
                }`}>
                  ${(summary.todayOverShort || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Yesterday&apos;s Instant Sale</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${(summary.yesterdayInstantSale || 0).toFixed(2)}
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

