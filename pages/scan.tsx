import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { format } from 'date-fns';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { parseBarcode, formatParsedBarcode, ParsedBarcode } from '@/lib/barcodeParser';

interface Ticket {
  _id: string;
  ticketNumber: string;
  ticketType: string;
  amount: number;
  scannedAt: string;
  scannedBy: string;
  gameBook?: string;
  gameNumber?: string;
  gameName?: string;
  costPerTicket?: number;
}

export default function ScanPage() {
  const router = useRouter();
  const [ticketNumber, setTicketNumber] = useState('');
  const [parsedBarcode, setParsedBarcode] = useState<ParsedBarcode | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [todayTickets, setTodayTickets] = useState<Ticket[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCamera, setShowCamera] = useState(false);
  const [cameraScanning, setCameraScanning] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLInputElement>(null);
  const autoSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);

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

    fetchTodayTickets(selectedDate);
    // Focus on ticket number input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [router, selectedDate]);

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

  const handleDeleteTicket = (ticket: Ticket) => {
    setTicketToDelete(ticket);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!ticketToDelete) return;

    setDeleting(true);
    setDeleteError('');

    try {
      const response = await fetch(`/api/tickets/${ticketToDelete._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || 'Failed to delete ticket');
        setDeleting(false);
        return;
      }

      // Close modal and refresh the ticket list
      setTicketToDelete(null);
      fetchTodayTickets();
      setDeleting(false);
    } catch (error) {
      console.error('Error deleting ticket:', error);
      setDeleteError('Failed to delete ticket');
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setTicketToDelete(null);
    setDeleteError('');
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

  const handleScan = async (e?: React.FormEvent, ticketValue?: string) => {
    if (e) {
    e.preventDefault();
    }
    
    const valueToScan = ticketValue || ticketNumber;
    
    if (!valueToScan || !valueToScan.trim()) {
      // Don't show alert for empty values during auto-scan
      return;
    }

    setLoading(true);
    setSuccess(false);

    // Get current user for scannedBy
    const userStr = localStorage.getItem('user');
    let scannedBy = 'system';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        scannedBy = user.name || user.email || 'system';
      } catch (e) {
        // Use default
      }
    }

    // Use parsed barcode data if available
    const parsed = parsedBarcode || parseBarcode(valueToScan);

    try {
      const response = await fetch('/api/tickets/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: parsed.ticketNumber || valueToScan,
          ticketType: parsed.ticketType || 'lottery',
          amount: parsed.costPerTicket || 0,
          scannedBy,
          date: format(selectedDate, 'yyyy-MM-dd'),
          gameBook: parsed.gameBook,
          gameNumber: parsed.gameNumber,
          gameName: parsed.gameName,
          costPerTicket: parsed.costPerTicket,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setDuplicateWarning(false);
        setTicketNumber('');
        setParsedBarcode(null);
        fetchTodayTickets();
        
        // Auto-focus back to ticket number input
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      } else {
        // Handle duplicate tickets gracefully
        if (data.isDuplicate) {
          setDuplicateWarning(true);
          setTicketNumber('');
          setParsedBarcode(null);
          
          // Auto-focus back to ticket number input
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 100);
          
          // Clear warning after 3 seconds
          setTimeout(() => {
            setDuplicateWarning(false);
          }, 3000);
      } else {
        alert(data.error || 'Failed to scan ticket');
        }
      }
    } catch (error) {
      console.error('Error scanning ticket:', error);
      alert('Failed to scan ticket');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  const fetchGameData = async (gameNumber: string) => {
    if (!gameNumber) return null;
    
    try {
      const response = await fetch(`/api/games?gameNumber=${gameNumber}&activeOnly=true`);
      const data = await response.json();
      
      if (data.success && data.game) {
        return data.game;
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
    }
    return null;
  };

  const startCamera = async () => {
    if (!cameraContainerRef.current || html5QrCodeRef.current) return;

    try {
      setCameraScanning(true);
      const html5QrCode = new Html5Qrcode('camera-container');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Barcode scanned successfully
          await stopCamera();
          setTicketNumber(decodedText);
          
          // Parse and process the barcode
          const parsed = parseBarcode(decodedText);
          
          // Fetch game data if available
          if (parsed.gameNumber) {
            const gameData = await fetchGameData(parsed.gameNumber);
            if (gameData) {
              if (!parsed.gameName || parsed.gameName === `Game ${parsed.gameNumber}`) {
                parsed.gameName = gameData.gameName;
              }
              if (!parsed.costPerTicket && gameData.costPerTicket) {
                parsed.costPerTicket = gameData.costPerTicket;
              }
            }
          }
          
          setParsedBarcode(parsed);
          
          // Auto-submit after a short delay
          setTimeout(() => {
            handleScan(undefined, decodedText);
          }, 300);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent while scanning)
        }
      );
    } catch (error: any) {
      console.error('Error starting camera:', error);
      alert('Failed to start camera. Please check permissions.');
      setCameraScanning(false);
      setShowCamera(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (error) {
        // Ignore errors when stopping
      }
      html5QrCodeRef.current = null;
    }
    setCameraScanning(false);
    setShowCamera(false);
  };

  useEffect(() => {
    if (showCamera) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (cameraContainerRef.current) {
          startCamera();
        }
      }, 100);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCamera]);

  const handleBarcodeScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Clear any existing timeout
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }
    
    // Remove any newline/carriage return characters (scanner might add these)
    const cleanValue = value.replace(/[\n\r]/g, '');
    setTicketNumber(cleanValue);
    
    // Parse the barcode to extract information
    const parsed = parseBarcode(cleanValue);
    
    // If we have a game number, fetch game data from database
    if (parsed.gameNumber) {
      const gameData = await fetchGameData(parsed.gameNumber);
      if (gameData) {
        // Enrich parsed data with database information
        if (!parsed.gameName || parsed.gameName === `Game ${parsed.gameNumber}`) {
          parsed.gameName = gameData.gameName;
        }
        if (!parsed.costPerTicket && gameData.costPerTicket) {
          parsed.costPerTicket = gameData.costPerTicket;
        }
      }
    }
    
    setParsedBarcode(parsed);
    
    // Check if this looks like a complete barcode
    const digitsOnly = cleanValue.replace(/\s+/g, '');
    const isCompleteBarcode = digitsOnly.length >= 13 && /^\d+$/.test(digitsOnly);
    
    // Auto-submit if:
    // 1. Scanner adds Enter key (newline detected in original value)
    // 2. Complete barcode detected (at least 13 digits for game/book/ticket)
    if (value.includes('\n') || value.includes('\r') || isCompleteBarcode) {
      // Auto-submit after a short delay to ensure all data is captured
      autoSubmitTimeoutRef.current = setTimeout(() => {
        if (cleanValue && cleanValue.trim() && !loading) {
          // Pass the value directly to avoid state timing issues
          handleScan(undefined, cleanValue);
        }
      }, 200);
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
          <div className="text-right relative">
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
              className="absolute opacity-0 pointer-events-none"
              style={{ right: 0, top: 0, width: '200px', height: '60px' }}
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
            <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={ticketNumber}
              onChange={handleBarcodeScan}
                className="flex-1 p-3 border border-gray-300 rounded-lg text-lg"
                placeholder="Scan ticket barcode"
              autoFocus
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowCamera(!showCamera)}
                className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                  showCamera
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title="Use camera to scan barcode"
              >
                {showCamera ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Parsed Barcode Information */}
          {parsedBarcode && parsedBarcode.isValid && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-blue-900">Barcode Information:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {parsedBarcode.gameNumber && (
                  <div>
                    <span className="text-blue-700 font-medium">Game #:</span>
                    <span className="ml-2 text-blue-900">{parsedBarcode.gameNumber}</span>
                  </div>
                )}
                {parsedBarcode.gameBook && (
                  <div>
                    <span className="text-blue-700 font-medium">Book #:</span>
                    <span className="ml-2 text-blue-900">{parsedBarcode.gameBook}</span>
                  </div>
                )}
                {parsedBarcode.ticketNumber && (
                  <div>
                    <span className="text-blue-700 font-medium">Ticket #:</span>
                    <span className="ml-2 text-blue-900">{parsedBarcode.ticketNumber}</span>
                  </div>
                )}
                {parsedBarcode.gameName && (
                  <div>
                    <span className="text-blue-700 font-medium">Game Name:</span>
                    <span className="ml-2 text-blue-900">{parsedBarcode.gameName}</span>
                  </div>
                )}
                {parsedBarcode.costPerTicket !== undefined && (
                  <div>
                    <span className="text-blue-700 font-medium">Cost per Ticket:</span>
                    <span className="ml-2 text-blue-900">${parsedBarcode.costPerTicket.toFixed(2)}</span>
                  </div>
                )}
              </div>
              {parsedBarcode.error && (
                <p className="text-xs text-orange-600 mt-2">Note: {parsedBarcode.error}</p>
              )}
            </div>
          )}

          {/* Success/Status Indicator */}
          {success && (
            <div className="w-full p-4 rounded-lg bg-green-500 text-white font-semibold text-lg text-center">
              ✓ Ticket Scanned!
            </div>
          )}
          {duplicateWarning && (
            <div className="w-full p-4 rounded-lg bg-orange-500 text-white font-semibold text-lg text-center">
              ⚠ This ticket was already scanned today
            </div>
          )}
          {loading && (
            <div className="w-full p-4 rounded-lg bg-blue-500 text-white font-semibold text-lg text-center">
              Scanning...
            </div>
          )}
          
          {/* Hidden submit button for form validation - auto-submit handles the actual submission */}
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>

        {/* Today's Scanned Tickets */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-gray-900">
              {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ? "Books Scanned"
                : `${format(selectedDate, 'MMM d')} Tickets`}
            </h2>
            <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full border border-purple-300">
              Total Scanned: {todayTickets.length}
            </span>
          </div>
          <div className="space-y-4">
            {todayTickets.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tickets scanned today</p>
            ) : (
              (() => {
                // Group tickets by price
                const priceGroups: { [key: string]: Ticket[] } = {};
                const priceOrder = [50, 30, 20, 10, 5, 2, 1];
                
                todayTickets.forEach((ticket) => {
                  const price = ticket.costPerTicket || ticket.amount || 0;
                  const priceKey = price.toFixed(2);
                  if (!priceGroups[priceKey]) {
                    priceGroups[priceKey] = [];
                  }
                  priceGroups[priceKey].push(ticket);
                });

                // Sort price groups by predefined order
                const sortedPrices = Object.keys(priceGroups).sort((a, b) => {
                  const priceA = parseFloat(a);
                  const priceB = parseFloat(b);
                  const indexA = priceOrder.indexOf(priceA);
                  const indexB = priceOrder.indexOf(priceB);
                  
                  // If price is in predefined order, use that order
                  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                  if (indexA !== -1) return -1;
                  if (indexB !== -1) return 1;
                  
                  // Otherwise sort by price descending
                  return priceB - priceA;
                });

                return sortedPrices.map((priceKey) => {
                  const tickets = priceGroups[priceKey];
                  const price = parseFloat(priceKey);
                  
                  return (
                    <div key={priceKey} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          ${price.toFixed(2)} Tickets
                        </h3>
                        <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-300">
                          {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} scanned
                        </span>
                      </div>
                      <div className="space-y-2 pl-2">
                        {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                            className="border-l-2 border-gray-300 pl-3 py-1"
                >
                  <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{ticket.ticketNumber}</p>
                                <div className="text-xs text-gray-500 space-y-1 mt-1">
                                  <p className="text-gray-500">{format(new Date(ticket.scannedAt), 'h:mm a')}</p>
                                  {(ticket.gameNumber || ticket.gameBook || ticket.gameName) && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {ticket.gameNumber && (
                                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                                          Game #{ticket.gameNumber}
                                        </span>
                                      )}
                                      {ticket.gameBook && (
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                          Book: {ticket.gameBook}
                                        </span>
                                      )}
                                      {ticket.gameName && (
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                          {ticket.gameName}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteTicket(ticket)}
                                className="ml-2 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Delete ticket"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex-1 flex items-center justify-center relative">
            <div id="camera-container" ref={cameraContainerRef} className="w-full h-full"></div>
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-blue-500 rounded-lg" style={{ width: '250px', height: '250px' }}>
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
              </div>
            </div>
            <p className="absolute bottom-32 left-0 right-0 text-center text-white text-lg font-semibold">
              Position barcode within the frame
            </p>
          </div>
          <div className="bg-gray-900 p-4 flex justify-center">
            <button
              onClick={stopCamera}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              Close Camera
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {ticketToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Ticket?
            </h3>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete ticket <span className="font-semibold">{ticketToDelete.ticketNumber}</span>?
            </p>
            {ticketToDelete.gameName && (
              <p className="text-sm text-gray-500 mb-4">
                Game: {ticketToDelete.gameName}
              </p>
            )}
            
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                disabled={deleting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

