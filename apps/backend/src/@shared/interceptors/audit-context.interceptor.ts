import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { AuditContext, AuditContextService } from "./services/audit-context.service.js";

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user) {
      const auditContext: AuditContext = {
        userId: user.id || user.sub,
        userEmail: user.email,
        ipAddress: request.ip || request.connection?.remoteAddress,
        userAgent: request.get("User-Agent") || undefined,
      };

      AuditContextService.setContext(auditContext);
    }
    return next.handle();
  }
}
