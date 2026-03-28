import { useState, useCallback } from 'react';

/**
 * Custom hook for form validation
 * Manages form state and validation errors
 * 
 * @param {Object} initialData - Initial form data
 * @param {Function} onValidate - Validation function that returns { isValid, errors }
 * @returns {Object} Form methods and state
 * 
 * @example
 * const { formData, errors, handleChange, handleSubmit } = useFormValidation(
 *   { name: '', email: '' },
 *   validateBookingForm
 * );
 */
export function useFormValidation(initialData, onValidate) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  // Handle blur - mark field as touched
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  // Validate entire form
  const validate = useCallback(() => {
    const validation = onValidate(formData);
    setErrors(validation.errors || {});
    return validation.isValid;
  }, [formData, onValidate]);

  // Handle form submission
  const handleSubmit = useCallback(async (onSuccess) => {
    return async (e) => {
      e.preventDefault();
      
      const isValid = validate();
      if (!isValid) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSuccess(formData);
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [validate, formData]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  // Set form data
  const setFormField = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  // Set multiple fields
  const setFormFields = useCallback((updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validate,
    resetForm,
    setFormField,
    setFormFields,
    getFieldError: (fieldName) => touched[fieldName] ? errors[fieldName] : '',
    hasError: (fieldName) => touched[fieldName] && !!errors[fieldName]
  };
}
