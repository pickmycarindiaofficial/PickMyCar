/**
 * Utility functions to convert numbers to words (Indian number system)
 */

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

function convertLessThanThousand(num: number): string {
  if (num === 0) return '';
  
  if (num < 10) {
    return ones[num];
  } else if (num < 20) {
    return teens[num - 10];
  } else if (num < 100) {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
  } else {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    return ones[hundred] + ' Hundred' + (remainder > 0 ? ' ' + convertLessThanThousand(remainder) : '');
  }
}

/**
 * Convert number to words using Indian number system
 * @param num - The number to convert
 * @returns Words representation of the number
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWords(Math.abs(num));
  
  let result = '';
  
  // Crores (10,000,000)
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    result += convertLessThanThousand(crores) + ' Crore ';
    num %= 10000000;
  }
  
  // Lakhs (100,000)
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    result += convertLessThanThousand(lakhs) + ' Lakh ';
    num %= 100000;
  }
  
  // Thousands (1,000)
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    result += convertLessThanThousand(thousands) + ' Thousand ';
    num %= 1000;
  }
  
  // Remaining hundreds, tens, ones
  if (num > 0) {
    result += convertLessThanThousand(num);
  }
  
  return result.trim();
}

/**
 * Format price in Indian Lakhs/Crores notation
 * @param num - The price amount
 * @returns Formatted price string (e.g., "5.00 Lakhs", "1.50 Crores")
 */
export function numberToLakhsCrores(num: number): string {
  if (num === 0) return '0';
  
  // Crores (10,000,000)
  if (num >= 10000000) {
    const crores = num / 10000000;
    return crores.toFixed(2) + ' Crores';
  }
  
  // Lakhs (100,000)
  if (num >= 100000) {
    const lakhs = num / 100000;
    return lakhs.toFixed(2) + ' Lakhs';
  }
  
  // Less than 1 lakh - show as is with commas
  return num.toLocaleString('en-IN');
}

/**
 * Format price with both numeric notation and words
 * @param num - The price amount
 * @returns Combined format (e.g., "₹ 5.00 Lakhs (Five Lakh Rupees)")
 */
export function formatPriceWithWords(num: number): string {
  const numeric = numberToLakhsCrores(num);
  const words = numberToWords(num);
  
  if (num >= 100000) {
    return `${numeric} (${words} Rupees)`;
  }
  
  return `₹ ${numeric}`;
}
