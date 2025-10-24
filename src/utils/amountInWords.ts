// utils/amountInWords.ts
export function convertAmountToWords(amount: number): string {
  if (amount === 0) return 'Zero';
  if (amount > 999999999.99) return 'Amount too large';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertHundreds(num: number): string {
    let result = '';
    
    if (num > 99) {
      result += units[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    
    if (num > 19) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num > 9) {
      result += teens[num - 10] + ' ';
      return result;
    }
    
    if (num > 0) {
      result += units[num] + ' ';
    }
    
    return result;
  }

  let result = '';
  let num = Math.floor(amount);
  
  // Millions
  if (num >= 1000000) {
    result += convertHundreds(Math.floor(num / 1000000)) + 'Million ';
    num %= 1000000;
  }
  
  // Thousands
  if (num >= 1000) {
    result += convertHundreds(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }
  
  // Hundreds
  result += convertHundreds(num);
  
  // Cents
  const cents = Math.round((amount - Math.floor(amount)) * 100);
  if (cents > 0) {
    result += 'and ' + convertHundreds(cents) + 'Cents';
  }
  
  return result.trim() + ' Only';
}