import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../types';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

export const validateRequired = (value: any, fieldName: string): ValidationError | null => {
  if (value === undefined || value === null || value === '') {
    return {
      field: fieldName,
      message: `${fieldName} is required`
    };
  }
  return null;
};

export const validateLength = (
  value: string, 
  fieldName: string, 
  min?: number, 
  max?: number
): ValidationError | null => {
  if (min && value.length < min) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${min} characters long`
    };
  }
  
  if (max && value.length > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be no more than ${max} characters long`
    };
  }
  
  return null;
};

export const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password, firstName, lastName } = req.body;
  const errors: ValidationError[] = [];

  // Validate required fields
  const emailError = validateRequired(email, 'email');
  const passwordError = validateRequired(password, 'password');
  
  if (emailError) errors.push(emailError);
  if (passwordError) errors.push(passwordError);

  // Validate email format
  if (email && !validateEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Please provide a valid email address'
    });
  }

  // Validate password strength
  if (password) {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push({
        field: 'password',
        message: passwordValidation.errors.join(', ')
      });
    }
  }

  // Validate optional fields
  if (firstName) {
    const firstNameError = validateLength(firstName, 'firstName', 1, 50);
    if (firstNameError) errors.push(firstNameError);
  }

  if (lastName) {
    const lastNameError = validateLength(lastName, 'lastName', 1, 50);
    if (lastNameError) errors.push(lastNameError);
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input and try again',
      validationErrors: errors
    });
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;
  const errors: ValidationError[] = [];

  // Validate required fields
  const emailError = validateRequired(email, 'email');
  const passwordError = validateRequired(password, 'password');
  
  if (emailError) errors.push(emailError);
  if (passwordError) errors.push(passwordError);

  // Validate email format
  if (email && !validateEmail(email)) {
    errors.push({
      field: 'email',
      message: 'Please provide a valid email address'
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input and try again',
      validationErrors: errors
    });
    return;
  }

  next();
};

export const validateWebsiteAudit = (req: Request, res: Response, next: NextFunction): void => {
  const { url, auditType } = req.body;
  const errors: ValidationError[] = [];

  // Validate required fields
  const urlError = validateRequired(url, 'url');
  if (urlError) errors.push(urlError);

  // Validate URL format
  if (url && !validateUrl(url)) {
    errors.push({
      field: 'url',
      message: 'Please provide a valid URL (must start with http:// or https://)'
    });
  }

  // Validate audit type
  const validAuditTypes = ['QUICK_SCAN', 'FULL_AUDIT', 'SEO_FOCUS', 'PERFORMANCE_FOCUS', 'ACCESSIBILITY_FOCUS'];
  if (auditType && !validAuditTypes.includes(auditType)) {
    errors.push({
      field: 'auditType',
      message: `auditType must be one of: ${validAuditTypes.join(', ')}`
    });
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input and try again',
      validationErrors: errors
    });
    return;
  }

  next();
};

export const validateContentGeneration = (req: Request, res: Response, next: NextFunction): void => {
  const { businessType, businessName, contentType } = req.body;
  const errors: ValidationError[] = [];

  // Validate required fields
  const businessTypeError = validateRequired(businessType, 'businessType');
  const businessNameError = validateRequired(businessName, 'businessName');
  const contentTypeError = validateRequired(contentType, 'contentType');
  
  if (businessTypeError) errors.push(businessTypeError);
  if (businessNameError) errors.push(businessNameError);
  if (contentTypeError) errors.push(contentTypeError);

  // Validate content type
  const validContentTypes = ['BLOG_POST_IDEAS', 'BLOG_POST_FULL', 'SOCIAL_MEDIA_POST', 'PRODUCT_DESCRIPTION', 'LANDING_PAGE_COPY'];
  if (contentType && !validContentTypes.includes(contentType)) {
    errors.push({
      field: 'contentType',
      message: `contentType must be one of: ${validContentTypes.join(', ')}`
    });
  }

  // Validate field lengths
  if (businessType) {
    const businessTypeLength = validateLength(businessType, 'businessType', 1, 100);
    if (businessTypeLength) errors.push(businessTypeLength);
  }

  if (businessName) {
    const businessNameLength = validateLength(businessName, 'businessName', 1, 100);
    if (businessNameLength) errors.push(businessNameLength);
  }

  if (errors.length > 0) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input and try again',
      validationErrors: errors
    });
    return;
  }

  next();
};