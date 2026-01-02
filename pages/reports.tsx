import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format, parseISO } from 'date-fns';

interface Report {
  _id: string;
  date: string;
  totalRevenue: number;
  totalTickets: number;
  cashOnHand: number;
  depositAmount: number;
  notes?: string;
  createdBy: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (date: string) => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          createdBy: 'user', // Replace with actual user
        }),
      });
      const data = await response.json();
      if (data.success) {
        fetchReports();
        alert('Report generated successfully!');
      } else {
        alert(data.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <button
          onClick={() => router.back()}
          className="mb-2 text-sm underline"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Daily Reports</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Generate Report Section */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold mb-3">Generate Report</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              onClick={() => generateReport(selectedDate)}
              className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold active:bg-blue-600"
            >
              Generate Report
            </button>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold mb-3">Recent Reports</h2>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : reports.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No reports found</p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report._id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">
                        {format(parseISO(report.date), 'MMMM d, yyyy')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Created by {report.createdBy}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-sm text-gray-600">Revenue</p>
                      <p className="font-bold text-green-600">
                        ${report.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tickets</p>
                      <p className="font-bold">{report.totalTickets}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cash on Hand</p>
                      <p className="font-bold">
                        ${report.cashOnHand.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Deposit</p>
                      <p className="font-bold text-blue-600 text-lg">
                        ${report.depositAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {report.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">{report.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

