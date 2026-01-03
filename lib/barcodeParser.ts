/**
 * Barcode Parser Utility
 * Parses Data Matrix barcode data to extract ticket information
 */

export interface ParsedBarcode {
  rawData: string;
  ticketNumber?: string;
  gameBook?: string;
  gameNumber?: string;
  gameName?: string;
  costPerTicket?: number;
  ticketType?: string;
  isValid: boolean;
  error?: string;
}

/**
 * Parse a Data Matrix barcode string
 * This function attempts to extract structured data from the barcode
 * 
 * Common formats might include:
 * - Delimited format: "BOOK123|GAME456|COST5.00|TICKET789"
 * - Fixed position format: positions 0-6 = book, 7-12 = game, etc.
 * - JSON-like format
 * 
 * @param barcodeData - The raw string data from the barcode scanner
 * @returns Parsed barcode information
 */
export function parseBarcode(barcodeData: string): ParsedBarcode {
  const result: ParsedBarcode = {
    rawData: barcodeData,
    isValid: false,
  };

  if (!barcodeData || barcodeData.trim().length === 0) {
    result.error = 'Empty barcode data';
    return result;
  }

  const trimmed = barcodeData.trim();
  
  // Remove all spaces for fixed-position parsing
  const digitsOnly = trimmed.replace(/\s+/g, '');

  // Strategy 1: Fixed-position format (30 digits)
  // Format: GGG P BBBBBB TTT SSSSSSSSSSSSSSSSS
  // GGG = Game # (3 digits, positions 0-2)
  // P = Prefix (1 digit, position 3, usually 0)
  // BBBBBB = Book # (6 digits, positions 4-9)
  // TTT = Ticket # (3 digits, positions 10-12)
  // S... = 17-digit tail (positions 13-29, not needed)
  if (digitsOnly.length >= 13 && /^\d+$/.test(digitsOnly)) {
    // Extract by fixed positions
    const gameNumber = digitsOnly.substring(0, 3);
    const prefix = digitsOnly.substring(3, 4);
    const bookNumber = digitsOnly.substring(4, 10);
    const ticketNumber = digitsOnly.substring(10, 13);
    
    result.gameNumber = gameNumber;
    result.gameBook = bookNumber;
    result.ticketNumber = ticketNumber;
    result.gameName = `Game ${gameNumber}`;
    result.isValid = true;
    result.ticketType = 'lottery';
    return result;
  }

  // Try different parsing strategies
  // Strategy 2: Check for common delimiters (|, ~, ^, GS, etc.)
  if (trimmed.includes('|') || trimmed.includes('~') || trimmed.includes('^')) {
    const delimiter = trimmed.includes('|') ? '|' : trimmed.includes('~') ? '~' : '^';
    const parts = trimmed.split(delimiter);
    
    // Try to identify parts by position or content
    result.ticketNumber = parts[0] || trimmed;
    if (parts.length > 1) result.gameBook = parts[1];
    if (parts.length > 2) {
      const costStr = parts[2].replace(/[^0-9.]/g, '');
      result.costPerTicket = parseFloat(costStr) || undefined;
    }
    if (parts.length > 3) result.gameName = parts[3];
    result.isValid = true;
    return result;
  }

  // Strategy 3: Check for structured format with field identifiers
  // Format like: "BOOK=123;GAME=456;COST=5.00;TICKET=789"
  if (trimmed.includes('=') && trimmed.includes(';')) {
    const pairs = trimmed.split(';');
    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      const upperKey = key.toUpperCase().trim();
      const cleanValue = value?.trim();
      
      if (upperKey.includes('BOOK')) result.gameBook = cleanValue;
      if (upperKey.includes('GAME')) result.gameName = cleanValue;
      if (upperKey.includes('COST') || upperKey.includes('PRICE')) {
        const costStr = cleanValue?.replace(/[^0-9.]/g, '') || '';
        result.costPerTicket = parseFloat(costStr) || undefined;
      }
      if (upperKey.includes('TICKET') || upperKey.includes('NUM')) {
        result.ticketNumber = cleanValue;
      }
    });
    
    if (result.ticketNumber || result.gameBook) {
      result.isValid = true;
    }
    return result;
  }

  // Strategy 4: Try to extract numeric patterns
  // Look for patterns like: numbers that might be book ID, cost, ticket number
  const numbers = trimmed.match(/\d+\.?\d*/g) || [];
  
  if (numbers.length > 0) {
    // Assume first number is ticket/book identifier
    result.ticketNumber = trimmed;
    
    // Look for decimal number (likely cost)
    const decimalMatch = trimmed.match(/\d+\.\d{2}/);
    if (decimalMatch) {
      result.costPerTicket = parseFloat(decimalMatch[0]);
    }
    
    result.isValid = true;
  } else {
    // If no numbers found, treat entire string as ticket number
    result.ticketNumber = trimmed;
    result.isValid = true;
  }

  // Set default ticket type if not found
  if (!result.ticketType) {
    result.ticketType = 'lottery';
  }

  return result;
}

/**
 * Format parsed barcode for display
 */
export function formatParsedBarcode(parsed: ParsedBarcode): string {
  const parts: string[] = [];
  
  if (parsed.gameNumber) parts.push(`Game #: ${parsed.gameNumber}`);
  if (parsed.gameBook) parts.push(`Book #: ${parsed.gameBook}`);
  if (parsed.gameName) parts.push(`Game: ${parsed.gameName}`);
  if (parsed.costPerTicket) parts.push(`Cost: $${parsed.costPerTicket.toFixed(2)}`);
  if (parsed.ticketNumber) parts.push(`Ticket #: ${parsed.ticketNumber}`);
  
  return parts.length > 0 ? parts.join(' | ') : parsed.rawData;
}

