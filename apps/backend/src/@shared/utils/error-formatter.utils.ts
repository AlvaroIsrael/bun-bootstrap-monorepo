import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DriverException } from '@mikro-orm/core';

export interface IErrorResponseJson {
  name: string;
  message: string | string[] | Record<string, unknown>;
  isOperational: boolean;
  stack?: unknown;
}

export interface FormattedError {
  statusCode: number;
  body: IErrorResponseJson;
}

const logger = new Logger('ErrorFormatter');

function isFetchNetworkError(exception: unknown): exception is TypeError {
  if (!(exception instanceof TypeError)) {
    return false;
  }

  const message = exception.message.toLowerCase();
  const cause = exception.cause;
  const causeCode =
    typeof cause === 'object' && cause !== null && 'code' in cause
      ? String(cause.code)
      : '';

  return (
    message.includes('fetch failed') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    /^(ECONNREFUSED|ECONNRESET|ENETUNREACH|ENOTFOUND|ETIMEDOUT)$/.test(causeCode)
  );
}

/**
* Formats any exception into a standardized error response.
* This utility can be used both by Nests exception filters and Express middleware.
*
* Oparam exception - The exception to format
* @param options - Optional configuration
* Creturns Formatted error with status code and response body
*/
export function formatException(
  exception: unknown,
  options: { logError?: boolean } = { logError: true },
): FormattedError {
  // Log the error
  if (options.logError) {
    logger.error({
      name: exception instanceof Error ? exception.name : 'Unknown Error',
      message: exception instanceof Error ? exception.message : 'Unknown Error',
      stack: exception instanceof Error ? exception.stack : undefined,
    })
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTesting = process.env.NODE_ENV === 'test';

  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let responseBody: IErrorResponseJson;

  // HttpException from NestJS
  if (exception instanceof HttpException) {
    statusCode = exception.getStatus();
    const response = exception.getResponse();

    let message: string | string[] | Record<string, unknown>;

    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object' && response !== null) {
      const responseobj = response as Record<string, unknown>;

      message =
        (responseobj.message as string | string[] | Record<string, unknown>) ||
        exception.message;
    } else {
      message = exception.message
    }

    responseBody = {
      name: exception.name,
      message,
      isOperational: true,
      stack: isDevelopment ? exception.stack : null,
    };
  }
  // Native fetch/Bun network error. HTTP error responses do not reject fetch.
  else if (isFetchNetworkError(exception)) {
    statusCode = HttpStatus.BAD_GATEWAY;

    responseBody = {
      name: exception.name,
      message: isDevelopment
        ? exception.message
        : 'An upstream service error occurred',
      isOperational: true,
      stack: isDevelopment ? exception.stack : null,
    };
  }

  // MikroORM database driver error
  else if (exception instanceof DriverException) {
    responseBody = {
      name: exception.name,
      message: 'Database communication failure. Check application logs!',
      isOperational: true,
      stack: isDevelopment || isTesting ? JSON.stringify(exception, null, 2) : null,
    };
  }

  // BetterAuthError or similar auth errors
  else if (
    exception instanceof Error &&
    (exception.name === 'BetterAuthError' ||
      exception.constructor.name === 'BetterAuthError')
  ) {
    // Extrace a user-friendly message from BetterAuthError
    const message = exception.message || 'Authentication error';

    if (message.includes('not found') || message.includes('No metadata')) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    } else if (
      message.includes('Invalid') ||
      message.includes('invalid') ||
      message.includes('credentials')
    ) {
      statusCode = HttpStatus.UNAUTHORIZED
    } else if (
      message.includes('already exists') ||
      message.includes('duplicate')
    ) {
      statusCode = HttpStatus.CONFLICT
    } else {
      statusCode = HttpStatus.BAD_REQUEST
    }

    responseBody = {
      name: 'AuthError',
      message: isDevelopment ? message : 'Authentication error occurred',
      isOperational: true,
      stack: isDevelopment ? exception.stack : null
    };
  }
  // Other errors
  else {
    const error =
      exception instanceof Error ? exception : new Error('Unknown Error')

    responseBody = {
      name: error.name,
      message: isDevelopment || isTesting ? error.message : 'Internal server error',
      isOperational: false,
      stack: isDevelopment ? error.stack : null
    };
  }

  return { statusCode, body: responseBody };
}
