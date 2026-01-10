/**
 * Calculate EMI (Equated Monthly Installment) for a car loan
 * @param carPrice - Total price of the car
 * @param loanPercentage - Percentage of car price to be financed (default: 80%)
 * @param annualInterestRate - Annual interest rate in percentage (default: 10%)
 * @param tenureYears - Loan tenure in years (default: 5)
 * @returns Monthly EMI amount (rounded)
 */
export function calculateEMI(
  carPrice: number,
  loanPercentage: number = 80,
  annualInterestRate: number = 10,
  tenureYears: number = 5
): number {
  const loanAmount = carPrice * (loanPercentage / 100);
  const monthlyRate = annualInterestRate / 12 / 100;
  const months = tenureYears * 12;
  
  // EMI formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
  const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
              (Math.pow(1 + monthlyRate, months) - 1);
  
  return Math.round(emi);
}
