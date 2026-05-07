/**
 * Validation utilities for forms and data
 */

/**
 * Validate phone number (10 digits)
 * @param {string} phone - Phone number
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone?.toString().replace(/\D/g, '') || '');
};

/**
 * Validate email
 * @param {string} email - Email address
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email || '');
};

/**
 * Validate loan form data
 * @param {Object} formData - Form data object
 * @returns {Object} Errors object
 */
export const validateLoanForm = (formData) => {
  const errors = {};

  // Customer name validation
  if (!formData.customerName?.trim()) {
    errors.customerName = 'Customer name is required';
  } else if (formData.customerName.length < 3) {
    errors.customerName = 'Customer name must be at least 3 characters';
  }

  // Phone validation
  if (!formData.customerPhone) {
    errors.customerPhone = 'Phone number is required';
  } else if (!isValidPhone(formData.customerPhone)) {
    errors.customerPhone = 'Phone number must be 10 digits';
  }

  // Address validation
  if (!formData.address?.trim()) {
    errors.address = 'Address is required';
  } else if (formData.address.length < 5) {
    errors.address = 'Address must be at least 5 characters';
  }

  // Interest rate validation
  if (formData.interestRate === undefined || formData.interestRate === null) {
    errors.interestRate = 'Interest rate is required';
  } else if (parseFloat(formData.interestRate) < 0) {
    errors.interestRate = 'Interest rate cannot be negative';
  }

  // Processing fee validation
  if (formData.processingFee && parseFloat(formData.processingFee) < 0) {
    errors.processingFee = 'Processing fee cannot be negative';
  }

  return errors;
};

/**
 * Validate ornament data
 * @param {Object} ornament - Ornament object
 * @returns {Object} Errors object
 */
export const validateOrnament = (ornament) => {
  const errors = {};

  if (!ornament.type?.trim()) {
    errors.type = 'Ornament type is required';
  }

  if (ornament.grossWt === undefined || parseFloat(ornament.grossWt) < 0) {
    errors.grossWt = 'Gross weight must be a positive number';
  }

  if (ornament.netWt === undefined || parseFloat(ornament.netWt) < 0) {
    errors.netWt = 'Net weight must be a positive number';
  }

  if (ornament.netWt > ornament.grossWt) {
    errors.netWt = 'Net weight cannot be greater than gross weight';
  }

  if (ornament.ratePerGram === undefined || parseFloat(ornament.ratePerGram) < 0) {
    errors.ratePerGram = 'Rate per gram must be a positive number';
  }

  return errors;
};

/**
 * Validate ornaments array
 * @param {Array} ornaments - Array of ornament objects
 * @returns {Object} Errors object with ornament indices
 */
export const validateOrnaments = (ornaments = []) => {
  const errors = {};

  if (!ornaments || ornaments.length === 0) {
    errors.ornaments = 'At least one ornament is required';
    return errors;
  }

  ornaments.forEach((ornament, index) => {
    const ornamentErrors = validateOrnament(ornament);
    if (Object.keys(ornamentErrors).length > 0) {
      errors[`ornament_${index}`] = ornamentErrors;
    }
  });

  return errors;
};

/**
 * Validate settings form
 * @param {Object} settings - Settings object
 * @returns {Object} Errors object
 */
export const validateSettings = (settings) => {
  const errors = {};

  if (settings.goldRate === undefined || parseFloat(settings.goldRate) <= 0) {
    errors.goldRate = 'Gold rate must be a positive number';
  }

  if (settings.silverRate === undefined || parseFloat(settings.silverRate) <= 0) {
    errors.silverRate = 'Silver rate must be a positive number';
  }

  if (settings.defaultInterestRate === undefined || parseFloat(settings.defaultInterestRate) < 0) {
    errors.defaultInterestRate = 'Interest rate cannot be negative';
  }

  return errors;
};

/**
 * Get error message for a field
 * @param {Object} errors - Errors object
 * @param {string} field - Field name
 * @returns {string} Error message or empty string
 */
export const getErrorMessage = (errors, field) => {
  return errors?.[field] || '';
};

/**
 * Check if form has any errors
 * @param {Object} errors - Errors object
 * @returns {boolean}
 */
export const hasErrors = (errors) => {
  return Object.keys(errors || {}).length > 0;
};
