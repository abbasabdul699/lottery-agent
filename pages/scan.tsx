import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
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
  const router = useRouter();
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketType, setTicketType] = useState('lottery');
  const [amount, setAmount] = useState('');
  const [scannedBy, setScannedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [todayTickets, setTodayTickets] = useState<Ticket[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTodayTickets();
    // Focus on ticket number input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const fetchTodayTickets = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await fetch(`/api/tickets?date=${today}`);
      const data = await response.json();
      if (data.success) {
        setTodayTickets(data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketNumber || !amount || !scannedBy) {
      alert('Please fill in all required fields');
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
          ticketType,
          amount: parseFloat(amount),
          scannedBy,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTicketNumber('');
        setAmount('');
        setNotes('');
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <button
          onClick={() => router.back()}
          className="mb-2 text-sm underline"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Scan Ticket</h1>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Type *
            </label>
            <select
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-lg"
              required
            >
              <option value="lottery">Lottery</option>
              <option value="scratch-off">Scratch-Off</option>
              <option value="instant">Instant</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($) *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-lg"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scanned By *
            </label>
            <input
              type="text"
              value={scannedBy}
              onChange={(e) => setScannedBy(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-lg"
              placeholder="Employee name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows={2}
              placeholder="Additional notes..."
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
            Today's Tickets ({todayTickets.length})
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
                      <p className="text-sm text-gray-600">
                        {ticket.ticketType} • {ticket.scannedBy}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(ticket.scannedAt), 'h:mm a')}
                      </p>
                    </div>
                    <p className="font-bold text-green-600">
                      ${ticket.amount.toFixed(2)}
                    </p>
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

