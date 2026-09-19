import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "node:async_hooks";

export type AuditContext = {
  userId: string;
  userEmail: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
};

@Injectable()
export class AuditContextService {
  private static storage = new AsyncLocalStorage<AuditContext>();

  static setContext(context: AuditContext): void {
    this.storage.enterWith(context);
  }
}
