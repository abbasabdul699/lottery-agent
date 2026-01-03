import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';

interface Ticket {
  _id: string;
  ticketNumber: string;
  ticketType: string;
  amount: number;
  scannedAt: string;
  scannedBy: string;
}

export default function ScanPage() {
  const [ticketNumber, setTicketNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [todayTickets, setTodayTickets] = useState<Ticket[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTodayTickets(selectedDate);
    // Focus on ticket number input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedDate]);

  const fetchTodayTickets = async (date?: Date) => {
    try {
      const dateToUse = date || selectedDate;
      const dateStr = format(dateToUse, 'yyyy-MM-dd');
      const response = await fetch(`/api/tickets?date=${dateStr}`);
      const data = await response.json();
      if (data.success) {
        setTodayTickets(data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
    fetchTodayTickets(newDate);
  };

  const handleDateClick = () => {
    setTimeout(() => {
      if (calendarRef.current) {
        const button = document.querySelector('[data-date-button]') as HTMLElement;
        if (button) {
          const rect = button.getBoundingClientRect();
          calendarRef.current.style.position = 'fixed';
          calendarRef.current.style.top = `${rect.bottom + 5}px`;
          calendarRef.current.style.right = `${window.innerWidth - rect.right}px`;
          calendarRef.current.style.width = '1px';
          calendarRef.current.style.height = '1px';
          calendarRef.current.style.opacity = '0';
        }
        calendarRef.current.focus();
        calendarRef.current.click();
        if (typeof calendarRef.current.showPicker === 'function') {
          calendarRef.current.showPicker();
        }
      }
    }, 50);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketNumber) {
      alert('Please enter a ticket number');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/tickets/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber,
          ticketType: 'lottery', // Default value
          amount: 0, // Default value, will be updated later
          scannedBy: 'system', // Default value, will be replaced with logged-in user later
          date: format(selectedDate, 'yyyy-MM-dd'),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTicketNumber('');
        fetchTodayTickets();
        
        // Auto-focus back to ticket number input
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      } else {
        alert(data.error || 'Failed to scan ticket');
      }
    } catch (error) {
      console.error('Error scanning ticket:', error);
      alert('Failed to scan ticket');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  const handleBarcodeScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTicketNumber(value);
    // If scanner adds Enter key, auto-submit
    if (value.includes('\n') || value.includes('\r')) {
      const cleanValue = value.replace(/[\n\r]/g, '');
      setTicketNumber(cleanValue);
      // Trigger form submission
      setTimeout(() => {
        handleScan(e as any);
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-end items-start">
          <div className="text-right">
            <h1 className="text-2xl font-bold">Scan Ticket</h1>
            <button
              onClick={handleDateClick}
              data-date-button
              className="cursor-pointer hover:opacity-80 transition-opacity mt-1"
            >
              <p className="text-base text-white font-bold">
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
        </div>
      </div>

      <div className="p-4 space-y-4">
        <form onSubmit={handleScan} className="bg-white rounded-lg shadow-md p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Number *
            </label>
            <input
              ref={inputRef}
              type="text"
              value={ticketNumber}
              onChange={handleBarcodeScan}
              className="w-full p-3 border border-gray-300 rounded-lg text-lg"
              placeholder="Scan or enter ticket number"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-4 rounded-lg text-white font-semibold text-lg ${
              success
                ? 'bg-green-500'
                : loading
                ? 'bg-gray-400'
                : 'bg-blue-500 active:bg-blue-600'
            }`}
          >
            {success ? '✓ Ticket Scanned!' : loading ? 'Scanning...' : 'Scan Ticket'}
          </button>
        </form>

        {/* Today's Scanned Tickets */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold mb-3">
            {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              ? `Today's Tickets (${todayTickets.length})`
              : `${format(selectedDate, 'MMM d')} Tickets (${todayTickets.length})`}
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {todayTickets.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tickets scanned today</p>
            ) : (
              todayTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="border-b border-gray-200 pb-2 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{ticket.ticketNumber}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(ticket.scannedAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

