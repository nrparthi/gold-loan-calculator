import { useState, useCallback } from 'react';

/**
 * Custom hook for form validation
 * Provides validation rules and error state management
 */
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback((fieldName = null) => {
    const newErrors = {};

    const fieldsToValidate = fieldName ? { [fieldName]: validationRules[fieldName] } : validationRules;

    Object.keys(fieldsToValidate).forEach((field) => {
      const rule = fieldsToValidate[field];
      const value = values[field];

      if (rule.required && (!value || value.toString().trim() === '')) {
        newErrors[field] = rule.requiredMessage || `${field} is required`;
      } else if (rule.minLength && value && value.toString().length < rule.minLength) {
        newErrors[field] = rule.minLengthMessage || `${field} must be at least ${rule.minLength} characters`;
      } else if (rule.maxLength && value && value.toString().length > rule.maxLength) {
        newErrors[field] = rule.maxLengthMessage || `${field} cannot exceed ${rule.maxLength} characters`;
      } else if (rule.pattern && value && !rule.pattern.test(value)) {
        newErrors[field] = rule.patternMessage || `${field} has invalid format`;
      } else if (rule.min && parseFloat(value) < rule.min) {
        newErrors[field] = rule.minMessage || `${field} must be at least ${rule.min}`;
      } else if (rule.max && parseFloat(value) > rule.max) {
        newErrors[field] = rule.maxMessage || `${field} cannot exceed ${rule.max}`;
      } else if (rule.custom) {
        const customError = rule.custom(value, values);
        if (customError) {
          newErrors[field] = customError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, validationRules]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues((prev) => ({ ...prev, [name]: newValue }));

    if (touched[name]) {
      validate(name);
    }
  }, [touched, validate]);

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validate(name);
  }, [validate]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validate(name);
    }
  }, [touched, validate]);

  return {
    values,
    errors,
    touched,
    setValues,
    setFieldValue,
    handleChange,
    handleBlur,
    validate,
    resetForm,
  };
};
