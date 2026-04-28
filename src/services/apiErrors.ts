export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class ApiError extends Error {
  type: ApiErrorType;
  status?: number;
  data?: any;

  constructor(message: string, type: ApiErrorType, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.data = data;
  }
}

export const getErrorMessage = (error: any): string => {
  if (error instanceof ApiError) {
    switch (error.type) {
      case ApiErrorType.NETWORK_ERROR:
        return 'No internet connection. Please check your network settings.';
      case ApiErrorType.UNAUTHORIZED:
        return 'Your session has expired. Please log in again.';
      case ApiErrorType.FORBIDDEN:
        return 'You do not have permission to perform this action.';
      case ApiErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      case ApiErrorType.VALIDATION_ERROR:
        return error.message || 'Invalid input provided. Please check your data.';
      case ApiErrorType.SERVER_ERROR:
        return 'Something went wrong on our server. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred.';
};
