/**
 * Formatting utilities
 */

/**
 * Format currency to Indian Rupees
 * @param {number} amount - Amount to format
 * @param {boolean} showLakhs - Show in lakhs format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount = 0, showLakhs = false) => {
  if (showLakhs && amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }
  return `₹${parseFloat(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
};

/**
 * Format weight
 * @param {number} weight - Weight in grams
 * @returns {string} Formatted weight
 */
export const formatWeight = (weight = 0) => {
  return `${parseFloat(weight).toFixed(2)}g`;
};

/**
 * Format date to readable format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date (DD/MM/YYYY)
 */
export const formatDate = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format date to input format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date (YYYY-MM-DD)
 */
export const formatDateToInput = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString().split('T')[0];
};

/**
 * Format time from timestamp
 * @param {string} time - Time string (HH:MM:SS)
 * @returns {string} Formatted time (HH:MM)
 */
export const formatTime = (time) => {
  if (!time) return '';
  return time.slice(0, 5);
};

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value = 0, decimals = 2) => {
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Format loan status
 * @param {string} status - Loan status
 * @returns {string} Formatted status
 */
export const formatLoanStatus = (status) => {
  const statusMap = {
    active: 'Active',
    closed: 'Closed',
    overdue: 'Overdue',
    pending: 'Pending',
  };
  return statusMap[status?.toLowerCase()] || status;
};

/**
 * Format payment mode
 * @param {string} mode - Payment mode
 * @returns {string} Formatted payment mode
 */
export const formatPaymentMode = (mode) => {
  const modeMap = {
    CASH: 'Cash',
    CHEQUE: 'Cheque',
    BANK_TRANSFER: 'Bank Transfer',
    UPI: 'UPI',
    DIGITAL: 'Digital Payment',
  };
  return modeMap[mode?.toUpperCase()] || mode;
};

/**
 * Shorten long text with ellipsis
 * @param {string} text - Text to shorten
 * @param {number} maxLength - Maximum length
 * @returns {string} Shortened text
 */
export const shortenText = (text, maxLength = 30) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
