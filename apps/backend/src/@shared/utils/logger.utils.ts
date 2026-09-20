import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Rollbar from 'rollbar';

// Module augumentation to extend Logger with audit method
declare module '@nestjs/common' {
  interface Logger {
    audit(message: unknown, stack?: string, context?: string): void;
    audit(message: unknown, ...optionalParams: [unknown?, string?, string?]): void;
  }
}

const originalError = Logger.prototype.error;

let rollbarInstance: Rollbar | null = null;

function getRollbar(): Rollbar {
  if (!rollbarInstance) {
    const configService = new ConfigService();
    rollbarInstance = new Rollbar({
      accessToken: configService.get<string>('ROLLBAR_ACCESS_TOKEN'),
      scrubFields: ["password", 'secret', 'creditCard', 'authorization'],
      environment: configService.get<string>('NODE_ENV'),
      enabled: configService.get<string>('NODE_ENV') === 'production',
      captureUncaught: true,
      captureUnhandledRejections: true,
      captureIp: true,
      nodeSourceMaps: true
    })
  }
  return rollbarInstance;
}

function normalizeLogMessage(message: unknown): Error | string {
  if (message instanceof Error) {
    return message
  }

  if (typeof message === 'string') {
    return message
  }

  try {
    return JSON.stringify(message)
  } catch {
    return String(message)
  }
}

function reportToRollbar(message: unknown, context?: string): void {
  const rollbar = getRollbar();
  const normalizedMessage = normalizeLogMessage(message);

  if (context) {
    rollbar.error(normalizedMessage, { context })
  } else {
    rollbar.error(normalizedMessage)
  }
}

Logger.prototype.audit = function audit(
  message: unknown,
  stack?: string,
  context?: string
) {
  originalError.call(this, message, stack, context);
  reportToRollbar(message, context ?? this.context)
}

Logger.prototype.error = function error(
  message: unknown,
  stack?: string,
  context?: string
) {
  originalError.call(this, message, stack, context);
  reportToRollbar(message, context ?? this.context)
}
