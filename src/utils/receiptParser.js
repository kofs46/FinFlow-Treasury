/**
 * Utility to extract Amount, Date, and Vendor from OCR text stream
 */

const KNOWN_PRESETS = [
  { match: /daraz/i, vendor: 'Daraz Online Shopping', category: 'Office Supplies', type: 'expense' },
  { match: /wasa/i, vendor: 'Dhaka WASA', category: 'Utilities', type: 'expense' },
  { match: /desco|dpdc/i, vendor: 'Electricity Utility (DESCO/DPDC)', category: 'Utilities', type: 'expense' },
  { match: /rent|landlord/i, vendor: 'Commercial Office Rent', category: 'Rent', type: 'expense' },
  { match: /uber|pathao/i, vendor: 'Rideshare / Transport', category: 'Travel & Transport', type: 'expense' },
  { match: /starlink|broadband|internet/i, vendor: 'Internet & Bandwidth', category: 'Utilities', type: 'expense' },
  { match: /chaldal|agora|meenabazar|shwapno/i, vendor: 'Grocery & Refreshment', category: 'Food & Pantry', type: 'expense' },
  { match: /salary|payroll/i, vendor: 'Staff Payroll', category: 'Salaries', type: 'expense' },
];

export function parseReceiptText(text = '') {
  if (!text) return { amount: '', date: '', vendor: '', category: '' };

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let detectedAmount = '';
  let detectedDate = '';
  let detectedVendor = '';
  let detectedCategory = '';

  // 1. Extract Amount (Looks for Total, BDT, Tk, ৳, Net, or largest currency-like number)
  const amountRegex = /(?:total|net|amount|tk|bdt|৳|sum)?[:\s]*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2})?)/gi;
  const numbersFound = [];

  for (const line of lines) {
    let match;
    while ((match = amountRegex.exec(line)) !== null) {
      const numStr = match[1].replace(/,/g, '');
      const val = parseFloat(numStr);
      if (!isNaN(val) && val > 0 && val < 10000000) {
        numbersFound.push({ val, line });
      }
    }
  }

  // Look for lines explicitly mentioning Total
  const totalLine = numbersFound.find((item) => /total|net|payable|grand/i.test(item.line));
  if (totalLine) {
    detectedAmount = String(totalLine.val);
  } else if (numbersFound.length > 0) {
    // Fallback: pick the largest number on the receipt
    const highest = numbersFound.reduce((prev, curr) => (curr.val > prev.val ? curr : prev));
    detectedAmount = String(highest.val);
  }

  // 2. Extract Date (Formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY)
  const dateRegex = /(?:(\d{4})[-/.](\d{1,2})[-/.](\d{1,2}))|(?:(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4}))/;
  for (const line of lines) {
    const match = line.match(dateRegex);
    if (match) {
      try {
        if (match[1]) {
          // YYYY-MM-DD
          const y = match[1];
          const m = match[2].padStart(2, '0');
          const d = match[3].padStart(2, '0');
          detectedDate = `${y}-${m}-${d}`;
          break;
        } else if (match[4]) {
          // DD/MM/YYYY
          const d = match[4].padStart(2, '0');
          const m = match[5].padStart(2, '0');
          let y = match[6];
          if (y.length === 2) y = `20${y}`;
          detectedDate = `${y}-${m}-${d}`;
          break;
        }
      } catch {
        // Continue scanning
      }
    }
  }

  if (!detectedDate) {
    detectedDate = new Date().toISOString().split('T')[0];
  }

  // 3. Extract Vendor / Preset Match
  for (const preset of KNOWN_PRESETS) {
    if (preset.match.test(text)) {
      detectedVendor = preset.vendor;
      detectedCategory = preset.category;
      break;
    }
  }

  if (!detectedVendor && lines.length > 0) {
    // First non-numeric, prominent header line usually represents the merchant
    const candidate = lines.find((l) => l.length > 3 && !/^[0-9\s:.-]+$/.test(l));
    if (candidate) {
      detectedVendor = candidate.slice(0, 40);
    }
  }

  return {
    amount: detectedAmount,
    date: detectedDate,
    vendor: detectedVendor,
    category: detectedCategory
  };
}

export function getSmartPreset(input = '') {
  if (!input) return null;
  const match = KNOWN_PRESETS.find((p) => p.match.test(input));
  return match || null;
}