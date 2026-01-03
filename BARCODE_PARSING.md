# Barcode Parsing System

## Overview

The system now includes a barcode parser that can extract information from Data Matrix barcodes scanned on lottery tickets. The parser automatically detects and extracts:

- **Game Book** - The book identifier
- **Game Name** - The name of the lottery game
- **Cost per Ticket** - The price of the ticket
- **Ticket Number** - The unique ticket identifier

## How It Works

When a barcode is scanned on the scan page:

1. The raw barcode data is captured
2. The `parseBarcode()` function analyzes the data using multiple strategies
3. Extracted information is displayed in a blue info box before scanning
4. The parsed data is saved along with the ticket record

## Barcode Format Support

The parser supports multiple barcode formats:

### Format 1: Delimited Format
```
BOOK123|GAME456|COST5.00|TICKET789
```
Uses pipe (`|`), tilde (`~`), or caret (`^`) as delimiters.

### Format 2: Key-Value Format
```
BOOK=123;GAME=456;COST=5.00;TICKET=789
```
Uses semicolons and equals signs to separate fields.

### Format 3: Numeric Pattern Detection
Automatically detects decimal numbers (likely costs) and numeric sequences.

## Customizing the Parser

To customize the parser for your specific barcode format, edit `/lib/barcodeParser.ts`.

### Example: Adding a Custom Format

If your barcodes use a specific format like `BOOK-GAME-COST-TICKET`, you can add a new parsing strategy:

```typescript
// Strategy 4: Custom format with dashes
if (trimmed.includes('-') && trimmed.split('-').length === 4) {
  const parts = trimmed.split('-');
  result.gameBook = parts[0];
  result.gameName = parts[1];
  result.costPerTicket = parseFloat(parts[2]);
  result.ticketNumber = parts[3];
  result.isValid = true;
  return result;
}
```

## Testing the Parser

To test what information is extracted from a barcode:

1. Go to the Scan page
2. Scan or manually enter a barcode
3. The parsed information will appear in the blue info box above the scan button
4. Review the extracted fields to verify they match your barcode format

## Providing Barcode Samples

To help customize the parser for your specific barcode format, please provide:

1. **Sample barcode data** - The actual string that comes from scanning a barcode
2. **Barcode format description** - How the data is structured
3. **Field positions** - Which parts of the string represent which fields
4. **Any special characters** - Delimiters, prefixes, suffixes, etc.

Once you provide sample barcode data, the parser can be customized to match your exact format.

## Database Fields

The following fields are now stored with each ticket:

- `gameBook` - String identifier for the game book
- `gameName` - String name of the game
- `costPerTicket` - Number representing the ticket price
- `ticketNumber` - The ticket identifier (always stored)
- `amount` - Set to `costPerTicket` if available, otherwise 0

## Display

Parsed barcode information is displayed:

1. **Before scanning** - In a blue info box on the scan page
2. **In ticket list** - As colored badges showing book, game name, and cost
3. **In database** - All fields are stored for reporting and analysis

