// src/test/lib/errorHandler.test.ts
import { describe, it, expect } from 'vitest';
import { parseApiError, getErrorMessage, isErrorRetryable, AppError } from '../../lib/errorHandler';

describe('errorHandler', () => {
  describe('parseApiError', () => {
    it('should handle network errors (no response)', () => {
      const error = { message: 'Network Error' };
      const result = parseApiError(error);
      
      expect(result.status).toBe(0);
      expect(result.message).toBe('Network Error');
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('should handle network errors without message', () => {
      const error = {};
      const result = parseApiError(error);
      
      expect(result.status).toBe(0);
      expect(result.message).toBe('Network error. Please check your connection.');
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('should parse standardized error format (ErrorResponse)', () => {
      const error = {
        response: {
          status: 404,
          data: {
            code: 'not_found',
            message: 'Document not found',
            details: { documentId: 123 }
          }
        }
      };
      
      const result = parseApiError(error);
      
      expect(result.status).toBe(404);
      expect(result.message).toBe('Document not found');
      expect(result.code).toBe('not_found');
      expect(result.details).toEqual({ documentId: 123 });
    });

    it('should parse legacy FastAPI string detail', () => {
      const error = {
        response: {
          status: 400,
          data: {
            detail: 'Bad request',
            code: 'bad_request'
          }
        }
      };
      
      const result = parseApiError(error);
      
      expect(result.status).toBe(400);
      expect(result.message).toBe('Bad request');
      expect(result.code).toBe('bad_request');
    });

    it('should parse legacy FastAPI object detail', () => {
      const error = {
        response: {
          status: 422,
          data: {
            detail: {
              message: 'Validation failed',
              code: 'validation_error',
              details: { field: 'email' }
            }
          }
        }
      };
      
      const result = parseApiError(error);
      
      expect(result.status).toBe(422);
      expect(result.message).toBe('Validation failed');
      expect(result.code).toBe('validation_error');
      expect(result.details).toEqual({ field: 'email' });
    });

    it('should handle other API errors', () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error'
          }
        }
      };
      
      const result = parseApiError(error);
      
      expect(result.status).toBe(500);
      expect(result.message).toBe('Internal server error');
      expect(result.code).toBe('HTTP_ERROR');
    });

    it('should handle errors without data', () => {
      const error = {
        response: {
          status: 500
        }
      };
      
      const result = parseApiError(error);
      
      expect(result.status).toBe(500);
      expect(result.message).toBe('Error 500');
      expect(result.code).toBe('HTTP_ERROR');
    });
  });

  describe('getErrorMessage', () => {
    it('should return AppError message directly', () => {
      const error = new AppError('Custom error', 400, 'custom_code');
      const message = getErrorMessage(error);
      
      expect(message).toBe('Custom error');
    });

    it('should use backend message if available (standardized format)', () => {
      const error = {
        response: {
          status: 404,
          data: {
            code: 'not_found',
            message: 'Document not found: 123'
          }
        }
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toBe('Document not found: 123');
    });

    it('should fallback to generic message for 400', () => {
      const error = {
        response: {
          status: 400,
          data: {}
        }
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toBe('Invalid request. Please check your input.');
    });

    it('should fallback to generic message for 401', () => {
      const error = {
        response: {
          status: 401,
          data: {}
        }
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toBe('Please log in to continue.');
    });

    it('should fallback to generic message for 403', () => {
      const error = {
        response: {
          status: 403,
          data: {}
        }
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toBe('You do not have permission to perform this action.');
    });

    it('should fallback to generic message for 404', () => {
      const error = {
        response: {
          status: 404,
          data: {}
        }
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toBe('The requested resource was not found.');
    });

    it('should fallback to generic message for 409', () => {
      const error = {
        response: {
          status: 409,
          data: {}
        }
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toBe('Conflict: This resource already exists.');
    });

    it('should fallback to generic message for 422', () => {
      const error = {
        response: {
          status: 422,
          data: {}
        }
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toBe('Invalid data provided. Please check your input.');
    });

    it('should fallback to generic message for 429', () => {
      const error = {
        response: {
          status: 429,
          data: {}
        }
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toBe('Too many requests. Please try again later.');
    });

    it('should fallback to generic message for 500', () => {
      const error = {
        response: {
          status: 500,
          data: {}
        }
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toBe('Server error. Please try again later.');
    });

    it('should fallback to generic message for 501', () => {
      const error = {
        response: {
          status: 501,
          data: {}
        }
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toBe('This feature is not yet implemented.');
    });

    it('should fallback to generic message for 503', () => {
      const error = {
        response: {
          status: 503,
          data: {}
        }
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toBe('Service temporarily unavailable. Please try again later.');
    });

    it('should handle unknown status codes', () => {
      const error = {
        response: {
          status: 418,
          data: { message: 'I am a teapot' }
        }
      };
      
      const message = getErrorMessage(error);
      
      expect(message).toBe('I am a teapot');
    });

    it('should handle errors without message', () => {
      const error = {
        response: {
          status: 500,
          data: {}
        }
      };
      const message = getErrorMessage(error);
      
      expect(message).toBe('Server error. Please try again later.');
    });
  });

  describe('isErrorRetryable', () => {
    it('should return true for network errors (status 0)', () => {
      const error = { message: 'Network Error' };
      expect(isErrorRetryable(error)).toBe(true);
    });

    it('should return true for 408 (Request timeout)', () => {
      const error = {
        response: { status: 408 }
      };
      expect(isErrorRetryable(error)).toBe(true);
    });

    it('should return true for 429 (Rate limit)', () => {
      const error = {
        response: { status: 429 }
      };
      expect(isErrorRetryable(error)).toBe(true);
    });

    it('should return true for 500 (Server error)', () => {
      const error = {
        response: { status: 500 }
      };
      expect(isErrorRetryable(error)).toBe(true);
    });

    it('should return true for 502 (Bad gateway)', () => {
      const error = {
        response: { status: 502 }
      };
      expect(isErrorRetryable(error)).toBe(true);
    });

    it('should return true for 503 (Service unavailable)', () => {
      const error = {
        response: { status: 503 }
      };
      expect(isErrorRetryable(error)).toBe(true);
    });

    it('should return true for 504 (Gateway timeout)', () => {
      const error = {
        response: { status: 504 }
      };
      expect(isErrorRetryable(error)).toBe(true);
    });

    it('should return false for 400 (Bad request)', () => {
      const error = {
        response: { status: 400 }
      };
      expect(isErrorRetryable(error)).toBe(false);
    });

    it('should return false for 401 (Unauthorized)', () => {
      const error = {
        response: { status: 401 }
      };
      expect(isErrorRetryable(error)).toBe(false);
    });

    it('should return false for 404 (Not found)', () => {
      const error = {
        response: { status: 404 }
      };
      expect(isErrorRetryable(error)).toBe(false);
    });

    it('should return false for 422 (Validation error)', () => {
      const error = {
        response: { status: 422 }
      };
      expect(isErrorRetryable(error)).toBe(false);
    });
  });
});
