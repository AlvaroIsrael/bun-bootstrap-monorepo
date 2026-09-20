import { Logger } from '@nestjs/common';

declare module '@nestjs/common' {
  export interface Logger {
    audit(message: unknown, stack?: string, context?: string): void;
    audit(message: unknown, ...optionalParams: [unknown?, string?, string?]): void;
  }
}
