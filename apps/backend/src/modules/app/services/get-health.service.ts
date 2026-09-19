import { Injectable, Logger } from "@nestjs/common";

export interface HealthCheckResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
}

@Injectable()
export class GetHealthService {
  private readonly logger = new Logger(GetHealthService.name);

  execute(): HealthCheckResponse {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
