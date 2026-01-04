import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { format } from 'date-fns';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { parseBarcode, formatParsedBarcode, ParsedBarcode } from '@/lib/barcodeParser';
import { haptic } from 'ios-haptics';
import { useSharedDate } from '@/lib/useSharedDate';

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
  const [cameraScanSuccess, setCameraScanSuccess] = useState(false);
  const [cameraScanError, setCameraScanError] = useState(false);
  const [cameraScanMessage, setCameraScanMessage] = useState('');
  const [todayTickets, setTodayTickets] = useState<Ticket[]>([]);
  const [selectedDate, setSelectedDate] = useSharedDate();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraScanning, setCameraScanning] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [sessionScanCount, setSessionScanCount] = useState(0);
  const [lastScannedTicket, setLastScannedTicket] = useState<Ticket | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [showFocusIndicator, setShowFocusIndicator] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLInputElement>(null);
  const autoSubmitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const lastScannedRef = useRef<{ barcode: string; timestamp: number } | null>(null);
  const isProcessingScanRef = useRef<boolean>(false);

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
    // Parse date string manually to avoid timezone issues
    // Split "YYYY-MM-DD" and create date in local timezone
    const dateStr = e.target.value;
    if (dateStr) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const newDate = new Date(year, month - 1, day); // month is 0-indexed
      setSelectedDate(newDate);
      fetchTodayTickets(newDate);
    }
  };

  // Audio feedback fallback function
  const triggerAudioFeedback = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 400; // Slightly higher frequency for error sound
      gainNode.gain.value = 0.15; // Low volume
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1); // Short beep
    } catch (audioError) {
      // Audio feedback also failed, silently continue
      console.log('Audio feedback not available');
    }
  };

  // Haptic feedback helper function with Safari/iOS compatibility
  const triggerHapticFeedback = () => {
    // Try standard Vibration API first (works on Android and some browsers)
    if (navigator.vibrate) {
      try {
        navigator.vibrate(200);
        return;
      } catch (e) {
        // Vibration API failed, continue to fallback
      }
    }
    
    // Safari/iOS fallback: Try multiple methods for haptic feedback
    try {
      // Check if we're on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS) {
        // Use ios-haptics library for iOS Safari (works on iOS 17.4+)
        try {
          haptic.error(); // Error haptic (three rapid haptics) for duplicate detection
        } catch (hapticError) {
          // If ios-haptics fails, try audio feedback
          triggerAudioFeedback();
        }
      } else {
        // For non-iOS browsers, try audio feedback as fallback
        triggerAudioFeedback();
      }
    } catch (e) {
      // Fallback failed, silently continue
      console.log('Haptic feedback not available');
    }
  };

  const handleDateClick = () => {
    // Directly trigger the date input
    if (calendarRef.current) {
      calendarRef.current.focus();
      calendarRef.current.click();
      // Try showPicker for browsers that support it
      if (typeof calendarRef.current.showPicker === 'function') {
        try {
          calendarRef.current.showPicker();
        } catch (e) {
          // Fallback to click if showPicker fails
          calendarRef.current.click();
        }
      }
    }
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
          
          // Haptic feedback - vibrate phone for duplicate detection
          triggerHapticFeedback();
          
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
          // Show more detailed error message
          const errorMsg = data.error || 'Failed to scan ticket';
          console.error('Scan error:', { error: errorMsg, response: data, parsed: parsed });
          alert(`Error: ${errorMsg}\n\nParsed data: ${JSON.stringify(parsed, null, 2)}`);
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

  const handleScanFromCamera = async (decodedText: string, parsed: ParsedBarcode) => {
    setLoading(true);
    setCameraScanSuccess(false);
    setCameraScanError(false);
    setCameraScanMessage('');

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

    try {
      const response = await fetch('/api/tickets/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: parsed.ticketNumber || decodedText,
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
        setCameraScanSuccess(true);
        setCameraScanMessage('Ticket scanned successfully!');
        setTicketNumber('');
        setParsedBarcode(null);
        setSessionScanCount(prev => prev + 1);
        
        // Store the last scanned ticket for preview
        if (data.ticket) {
          setLastScannedTicket(data.ticket);
        }
        
        fetchTodayTickets();
        
        // Clear success message after 2 seconds
        setTimeout(() => {
          setCameraScanSuccess(false);
          setCameraScanMessage('');
        }, 2000);
      } else {
        // Handle duplicate tickets
        if (data.isDuplicate) {
          setCameraScanError(true);
          setCameraScanMessage('This ticket was already scanned');
          setTicketNumber('');
          setParsedBarcode(null);
          
          // Haptic feedback - vibrate phone for duplicate detection
          triggerHapticFeedback();
          
          // Clear error message after 3 seconds
          setTimeout(() => {
            setCameraScanError(false);
            setCameraScanMessage('');
          }, 3000);
        } else {
          setCameraScanError(true);
          setCameraScanMessage(data.error || 'Failed to scan ticket');
          
          // Clear error message after 3 seconds
          setTimeout(() => {
            setCameraScanError(false);
            setCameraScanMessage('');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error scanning ticket:', error);
      setCameraScanError(true);
      setCameraScanMessage('Failed to scan ticket');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setCameraScanError(false);
        setCameraScanMessage('');
      }, 3000);
    } finally {
      setLoading(false);
      // Reset processing flag
      isProcessingScanRef.current = false;
    }
  };

  const startCamera = async () => {
    if (!cameraContainerRef.current || html5QrCodeRef.current) return;

    try {
      setCameraScanning(true);
      // Reset scan tracking when starting camera
      lastScannedRef.current = null;
      isProcessingScanRef.current = false;
      setSessionScanCount(0);
      setLastScannedTicket(null); // Reset last scanned ticket preview
      
      const html5QrCode = new Html5Qrcode('camera-container');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: facingMode }, // Use selected camera (back or front)
        {
          fps: 10,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
          ],
          // Remove qrbox to use full viewport for scanning
        },
        async (decodedText) => {
          // Prevent duplicate scans - check if we're already processing or recently scanned this barcode
          const now = Date.now();
          const cooldownPeriod = 3000; // 3 seconds cooldown
          
          // Check if we're currently processing a scan
          if (isProcessingScanRef.current) {
            return; // Ignore if already processing
          }
          
          // Check if this is the same barcode scanned recently
          if (lastScannedRef.current) {
            const timeSinceLastScan = now - lastScannedRef.current.timestamp;
            if (
              lastScannedRef.current.barcode === decodedText &&
              timeSinceLastScan < cooldownPeriod
            ) {
              return; // Ignore duplicate scan within cooldown period
            }
          }
          
          // Mark as processing
          isProcessingScanRef.current = true;
          lastScannedRef.current = { barcode: decodedText, timestamp: now };
          
          // Barcode scanned - don't close camera, just process the scan
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
          
          // Process the scan and show notification in camera
          await handleScanFromCamera(decodedText, parsed);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent while scanning)
        }
      );

      // Get the video track for flash control after camera starts
      setTimeout(() => {
        const videoElement = document.querySelector('#camera-container video') as HTMLVideoElement;
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrackRef.current = videoTrack;
          }
        }
      }, 500);
    } catch (error: any) {
      console.error('Error starting camera:', error);
      setCameraScanning(false);
      setShowCamera(false);
      
      // Check if we're on HTTP (not HTTPS or localhost)
      const isHttp = window.location.protocol === 'http:' && !window.location.hostname.includes('localhost');
      
      if (isHttp) {
        alert('Camera access requires HTTPS or localhost. Safari on iOS blocks camera access on HTTP connections. Please use localhost or set up HTTPS for local development.');
      } else {
        // Check for specific permission errors
        const errorMessage = error?.message || error?.toString() || '';
        if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
          alert('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('not found')) {
          alert('No camera found. Please ensure your device has a camera.');
        } else {
          alert('Failed to start camera. Please check permissions and try again.');
        }
      }
    }
  };

  const stopCamera = async () => {
    // Stop the QR code scanner
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (error) {
        // Ignore errors when stopping
      }
      html5QrCodeRef.current = null;
    }
    
    // Turn off flash/torch when stopping
    if (videoTrackRef.current) {
      try {
        await videoTrackRef.current.applyConstraints({ 
          advanced: [{ torch: false }] as any 
        });
        videoTrackRef.current.stop(); // Stop the video track
      } catch (error) {
        // Ignore errors
      }
      videoTrackRef.current = null;
    }
    
    // Update state to close camera and reset flags
    setCameraScanning(false);
    setFlashEnabled(false);
    setShowCamera(false);
  };

  const stopCameraOnly = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (error) {
        // Ignore errors when stopping
      }
      html5QrCodeRef.current = null;
    }
    // Turn off flash when stopping
    if (videoTrackRef.current) {
      try {
        await videoTrackRef.current.applyConstraints({ 
          advanced: [{ torch: false }] as any 
        });
      } catch (error) {
        // Ignore errors
      }
      videoTrackRef.current = null;
    }
    setCameraScanning(false);
    setFlashEnabled(false);
  };

  const handleCameraTap = async (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't trigger focus if clicking on buttons or other interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // Percentage from left
    const y = ((e.clientY - rect.top) / rect.height) * 100; // Percentage from top

    // Show focus indicator
    setFocusPoint({ x, y });
    setShowFocusIndicator(true);

    // Hide indicator after animation
    setTimeout(() => {
      setShowFocusIndicator(false);
    }, 1000);

    // Apply focus to camera
    if (!videoTrackRef.current) {
      // Try to get the video track again
      const videoElement = document.querySelector('#camera-container video') as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrackRef.current = videoTrack;
        } else {
          return;
        }
      } else {
        return;
      }
    }

    try {
      // Convert percentage to normalized coordinates (0.0 to 1.0)
      const pointOfInterestX = x / 100;
      const pointOfInterestY = y / 100;

      // Try different focus methods based on browser support
      const capabilities = videoTrackRef.current.getCapabilities();
      
      // Method 1: Try pointsOfInterest (some mobile browsers)
      try {
        await videoTrackRef.current.applyConstraints({
          advanced: [
            {
              pointsOfInterest: [{ x: pointOfInterestX, y: pointOfInterestY }]
            } as any
          ]
        });
      } catch (poiError) {
        // Method 2: Try focusMode with manual focus
        try {
          await videoTrackRef.current.applyConstraints({
            advanced: [{ focusMode: 'manual' } as any]
          });
          // Then try to set the point of interest
          await videoTrackRef.current.applyConstraints({
            advanced: [
              {
                pointsOfInterest: [{ x: pointOfInterestX, y: pointOfInterestY }]
              } as any
            ]
          });
        } catch (manualError) {
          // Method 3: Just trigger auto-focus (fallback)
          try {
            await videoTrackRef.current.applyConstraints({
              advanced: [{ focusMode: 'auto' } as any]
            });
          } catch (autoError) {
            console.log('Focus not supported on this device');
          }
        }
      }
    } catch (error) {
      console.log('Focus not supported on this device');
    }
  };

  const toggleCamera = async () => {
    // Toggle between front and back camera
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    
    // Stop current camera
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (error) {
        console.error('Error stopping camera:', error);
      }
      html5QrCodeRef.current = null;
    }
    
    // Reset video track ref
    if (videoTrackRef.current) {
      try {
        await videoTrackRef.current.applyConstraints({ 
          advanced: [{ torch: false }] as any 
        });
      } catch (error) {
        // Ignore errors
      }
      videoTrackRef.current = null;
    }
    
    setFlashEnabled(false);
    setCameraScanning(false);
    
    // Restart camera with new facing mode
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      setLoading(true);
      
      // If camera is active, stop it first to avoid conflicts
      if (html5QrCodeRef.current && cameraScanning) {
        console.log('Stopping camera for image upload...');
        try {
          await html5QrCodeRef.current.stop();
          await html5QrCodeRef.current.clear();
          html5QrCodeRef.current = null;
          setCameraScanning(false);
          // Wait a moment for camera to fully stop
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (stopError) {
          console.error('Error stopping camera:', stopError);
        }
      }
      
      // Create a temporary properly-sized container for file scanning
      // Container must be in DOM and have proper dimensions for scanner to work
      const tempContainerId = 'temp-scanner-container-' + Date.now(); // Unique ID to avoid conflicts
      
      // Remove any existing container with similar ID pattern
      const existingContainers = document.querySelectorAll('[id^="temp-scanner-container-"]');
      existingContainers.forEach(el => el.remove());
      
      const tempContainer = document.createElement('div');
      tempContainer.id = tempContainerId;
      // Make it larger and slightly more visible for better scanning of complex images
      // Larger container helps when scanning images with surrounding content
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '-2000px';
      tempContainer.style.left = '-2000px';
      tempContainer.style.width = '800px'; // Larger for better image processing
      tempContainer.style.height = '800px';
      tempContainer.style.opacity = '0.01'; // Nearly invisible but technically visible
      tempContainer.style.pointerEvents = 'none';
      tempContainer.style.zIndex = '-9999';
      tempContainer.style.overflow = 'hidden';
      document.body.appendChild(tempContainer);
      
      // Wait for container to be in DOM
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Create a temporary Html5Qrcode instance for file scanning
      const tempScanner = new Html5Qrcode(tempContainerId);
      
      let decodedText: string | null = null;
      
      try {
        // For images with surrounding text/content, we need to try multiple scanning strategies
        console.log('Attempting to scan image file...', { 
          fileName: file.name, 
          fileType: file.type, 
          fileSize: file.size 
        });
        
        // Strategy: Try QR code specific scanning first since we know it works for simple images
        // Then try variations that might work better for complex images with surrounding text
        
        try {
          // First attempt: QR code format only - most reliable for QR codes
          // Works for images that are just QR codes
          decodedText = await tempScanner.scanFile(
            file, 
            false,
            {
              formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            }
          );
        } catch (qrError: any) {
          console.log('QR code only scan failed, trying with showScanRegion...', qrError);
          
          // Second attempt: QR code with showScanRegion enabled
          // This can help focus scanning in complex images with surrounding content
          try {
            decodedText = await tempScanner.scanFile(
              file, 
              true, // Enable showScanRegion
              {
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
              }
            );
          } catch (qrRegionError: any) {
            console.log('QR with region failed, trying all default formats...', qrRegionError);
            
            // Third attempt: All default formats (no format restriction)
            // Sometimes the library's default format detection works better
            try {
              decodedText = await tempScanner.scanFile(file, false);
            } catch (defaultError: any) {
              console.log('Default formats failed, trying all formats with region...', defaultError);
              
              // Fourth attempt: All formats with showScanRegion
              try {
                decodedText = await tempScanner.scanFile(file, true);
              } catch (regionAllError: any) {
                console.log('All formats with region failed, trying specific formats...', regionAllError);
                
                // Final attempt: Multiple specific formats
                decodedText = await tempScanner.scanFile(
                  file,
                  false,
                  {
                    formatsToSupport: [
                      Html5QrcodeSupportedFormats.QR_CODE,
                      Html5QrcodeSupportedFormats.CODE_128,
                      Html5QrcodeSupportedFormats.EAN_13,
                    ]
                  }
                );
              }
            }
          }
        }
          
        if (decodedText) {
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
          
          // Process the scan
          await handleScanFromCamera(decodedText, parsed);
        } else {
          alert('No barcode found in the image');
        }
      } catch (error: any) {
        console.error('Error scanning image:', error);
        const errorMessage = error?.message || error?.toString() || '';
        
        if (errorMessage.includes('No multiFormat Readers') || errorMessage.includes('No barcode') || errorMessage.includes('not found') || errorMessage.includes('NotFoundException')) {
          alert('Could not detect a barcode or QR code in the image.\n\nPlease try:\n\n1. Use the camera scanner instead (more reliable)\n2. Ensure the image is:\n   • Clear and in focus\n   • The QR code/barcode is fully visible\n   • Good lighting and contrast\n   • Not distorted or at an angle\n\n3. Try taking a new photo if the image quality is poor');
        } else if (errorMessage.includes('format') || errorMessage.includes('not supported')) {
          alert('Barcode format not supported. Please try scanning with the camera instead, or ensure your image contains a standard barcode or QR code.');
        } else if (errorMessage.includes('Cannot start file scan') || errorMessage.includes('ongoing camera scan')) {
          alert('Cannot scan image while camera is active. Please close the camera first, or scan the image without opening the camera.');
        } else {
          alert(`Failed to scan image: ${errorMessage || 'Please try again with a clearer image or use the camera scanner.'}`);
        }
      } finally {
        // Clean up temporary scanner
        try {
          await tempScanner.clear();
        } catch (clearError) {
          // Ignore cleanup errors - scanner might not have initialized
        }
        // Remove temporary container if it exists
        if (tempContainer && tempContainer.parentNode) {
          try {
            tempContainer.parentNode.removeChild(tempContainer);
          } catch (removeError) {
            // Ignore removal errors
          }
        }
        setLoading(false);
        // Reset file input
        e.target.value = '';
      }
    } catch (error: any) {
      console.error('Error handling image upload:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      alert(`Failed to process image: ${errorMessage}`);
      setLoading(false);
      e.target.value = '';
    }
  };

  const toggleFlash = async () => {
    if (!videoTrackRef.current) {
      // Try to get the video track again
      const videoElement = document.querySelector('#camera-container video') as HTMLVideoElement;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrackRef.current = videoTrack;
        } else {
          return;
        }
      } else {
        return;
      }
    }

    try {
      const newFlashState = !flashEnabled;
      await videoTrackRef.current.applyConstraints({
        advanced: [{ torch: newFlashState }] as any
      });
      setFlashEnabled(newFlashState);
    } catch (error) {
      console.error('Error toggling flash:', error);
      // Flash might not be supported on this device
      alert('Flash/torch is not supported on this device or camera.');
    }
  };

  useEffect(() => {
    if (showCamera) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (cameraContainerRef.current && showCamera) {
          startCamera();
        }
      }, 100);
      
      return () => {
        clearTimeout(timer);
        // Only stop camera hardware, don't change state in cleanup
        if (html5QrCodeRef.current) {
          stopCameraOnly();
        }
      };
    } else {
      // Only stop if camera is actually running
      if (html5QrCodeRef.current) {
        stopCameraOnly();
      }
    }
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
            <div className="relative inline-block mt-1">
              <button
                onClick={handleDateClick}
                className="cursor-pointer hover:opacity-80 transition-opacity"
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
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ width: '100%', height: '100%' }}
                aria-label="Select date"
              />
            </div>
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCamera(!showCamera);
                }}
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
        <div 
          className="fixed inset-0 bg-black z-50 flex flex-col"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the camera container
            if (e.target === e.currentTarget) {
              stopCamera();
            }
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
              #camera-container {
                width: 100% !important;
                height: 100% !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                overflow: hidden !important;
              }
              #camera-container video {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
              }
            `
          }} />
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <div 
              id="camera-container" 
              ref={cameraContainerRef} 
              className="absolute inset-0 w-full h-full cursor-pointer"
              onClick={handleCameraTap}
            />
            {/* Focus indicator */}
            {showFocusIndicator && focusPoint && (
              <div
                className="absolute z-30 pointer-events-none"
                style={{
                  left: `${focusPoint.x}%`,
                  top: `${focusPoint.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-20 h-20 border-2 border-white rounded-full animate-ping"></div>
                <div className="absolute inset-0 w-20 h-20 border-2 border-white rounded-full"></div>
              </div>
            )}
            {/* Close button (X) in top-right corner */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                stopCamera();
              }}
              className="absolute top-4 right-4 z-10 bg-black hover:bg-black/90 rounded-full p-2 transition-colors"
              aria-label="Close camera"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Flash/Torch button in top-left corner */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFlash();
              }}
              className="absolute top-4 left-4 z-10 bg-yellow-500 hover:bg-yellow-600 rounded-full p-3 transition-colors"
              aria-label={flashEnabled ? 'Turn off flash' : 'Turn on flash'}
            >
              {flashEnabled ? (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C9.2 2 6 5.2 6 9c0 2.9 1.4 5.4 3.5 7l-1.1 4.4c-.1.3.1.6.4.6h6.4c.3 0 .5-.3.4-.6L14.5 16c2.1-1.6 3.5-4.1 3.5-7 0-3.8-3.2-7-7-7z"/>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
            </button>
            {/* Camera flip button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCamera();
              }}
              className="absolute top-20 left-4 z-10 bg-gray-700 hover:bg-gray-600 rounded-full p-3 transition-colors"
              aria-label="Flip camera"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {/* Gallery/Photo picker */}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="gallery-input"
            />
            <label
              htmlFor="gallery-input"
              className="absolute top-36 left-4 z-10 bg-purple-500 hover:bg-purple-600 rounded-full p-3 transition-colors cursor-pointer"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </label>
            {/* Scan Counter */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-sm">Scanned: {sessionScanCount}</span>
            </div>
            {/* Last scanned ticket preview */}
            {lastScannedTicket && (
              <div className="absolute top-28 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 rounded-lg p-3 max-w-xs shadow-lg">
                <p className="text-xs text-gray-600 mb-1">Last scanned:</p>
                <p className="font-semibold text-gray-900">{lastScannedTicket.ticketNumber}</p>
                {lastScannedTicket.gameName && (
                  <p className="text-xs text-gray-500 mt-1">{lastScannedTicket.gameName}</p>
                )}
                {lastScannedTicket.costPerTicket && (
                  <p className="text-xs text-blue-600 font-medium mt-1">${lastScannedTicket.costPerTicket.toFixed(2)}</p>
                )}
              </div>
            )}
            {/* Scanning overlay - white corner lines only */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative" style={{ width: '250px', height: '250px' }}>
                {/* Top-left corner */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                {/* Top-right corner */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                {/* Bottom-left corner */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                {/* Bottom-right corner */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
              </div>
            </div>
            <p className="absolute bottom-32 left-0 right-0 text-center text-white text-lg font-semibold">
              Position barcode within the frame
            </p>
            {/* Camera scan notifications */}
            {cameraScanSuccess && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-white font-semibold text-sm whitespace-nowrap">{cameraScanMessage || 'Ticket scanned successfully!'}</p>
              </div>
            )}
            {/* Error/Duplicate bubble at top */}
            {cameraScanError && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-white font-semibold text-sm whitespace-nowrap">{cameraScanMessage || 'Error scanning ticket'}</p>
              </div>
            )}
          </div>
          <div className="bg-gray-900 p-4 flex justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                stopCamera();
              }}
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

