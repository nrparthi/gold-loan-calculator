/**
 * Loan calculation utilities
 */

/**
 * Derive the next interest due date from loan data.
 * Returns a YYYY-MM-DD string or null.
 */
export const getNextDueDate = (loan) => {
  if (loan.nextDueDate) return loan.nextDueDate;
  if (!loan.loanDate || loan.status === 'closed') return null;
  const monthly = parseFloat(loan.monthlyInterest) || 0;
  const paid = parseFloat(loan.totalInterestPaid) || 0;
  const monthsPaid = monthly > 0 ? Math.round(paid / monthly) : 0;
  const d = new Date(loan.loanDate);
  d.setMonth(d.getMonth() + monthsPaid);
  return d.toISOString().split('T')[0];
};

/**
 * Calculate total ornament value
 * @param {Array} ornaments - Array of ornament objects
 * @returns {number} Total value
 */
export const calculateTotalOrnamentValue = (ornaments = []) => {
  return ornaments.reduce((sum, ornament) => sum + (ornament.value || 0), 0);
};

/**
 * Calculate monthly interest
 * @param {number} loanAmount - Base loan amount
 * @param {number} interestRate - Interest rate percentage
 * @returns {number} Monthly interest amount
 */
export const calculateMonthlyInterest = (loanAmount = 0, interestRate = 0) => {
  return (loanAmount * interestRate) / 100;
};

/**
 * Calculate amount to give customer
 * @param {number} totalValue - Total ornament value
 * @param {number} processingFee - Processing fee
 * @returns {number} Amount to give
 */
export const calculateAmountToGive = (totalValue = 0, processingFee = 0) => {
  return totalValue - processingFee;
};

/**
 * Calculate ornament value based on weight and rate
 * @param {number} netWeight - Net weight in grams
 * @param {number} ratePerGram - Rate per gram
 * @returns {number} Ornament value
 */
export const calculateOrnamentValue = (netWeight = 0, ratePerGram = 0) => {
  return netWeight * ratePerGram;
};

/**
 * Calculate total interest paid
 * @param {Array} interests - Array of interest records
 * @returns {number} Total paid interest
 */
export const calculateTotalInterestPaid = (interests = []) => {
  return interests
    .filter((interest) => interest.paid)
    .reduce((sum, interest) => sum + (interest.amount || 0), 0);
};

/**
 * Calculate total interest due
 * @param {Array} interests - Array of interest records
 * @returns {number} Total due interest
 */
export const calculateTotalInterestDue = (interests = []) => {
  return interests.reduce((sum, interest) => sum + (interest.amount || 0), 0);
};

/**
 * Calculate pending interest
 * @param {Array} interests - Array of interest records
 * @returns {number} Total pending interest
 */
export const calculatePendingInterest = (interests = []) => {
  return interests
    .filter((interest) => !interest.paid)
    .reduce((sum, interest) => sum + (interest.amount || 0), 0);
};

/**
 * Calculate profit (interest earned - operational costs)
 * @param {Array} loans - Array of loan objects
 * @returns {number} Total profit
 */
export const calculateTotalProfit = (loans = []) => {
  return loans.reduce((sum, loan) => sum + (loan.totalInterestPaid || 0), 0);
};
