import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { formatException } from '../utils/error-formatter.utils.js';


/**
 * Global exception filter that catcher all unhandled exceptions in NestJS controllers.
 *
 * Note: This filter only works for requests that go trhough the NestJS controller pipeline.
 * For Express or Fastify middleware routes (like Better Auth), use the `formatException` utility directly.
 *
 * @see formatException - The shared error formatting utility used by this filter
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    // User the shared error formatting utility
    const { statusCode, body } = formatException(exception)
    httpAdapter.reply(ctx.getResponse(), body, statusCode)
  }
}
