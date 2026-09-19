import { Controller, Get, Version, VERSION_NEUTRAL } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GetHealthService, type HealthCheckResponse } from "./services/get-health.service.js";

@ApiTags("Health")
@Controller()
export class AppController {
  constructor(private readonly getHealthService: GetHealthService) {}

  @Version(VERSION_NEUTRAL)
  @Get(["health", ""])
  @ApiOperation({ summary: "AWS Health Check endpoint" })
  @ApiOkResponse({
    description: "Application is healthy and operational",
    schema: {
      type: "object",
      properties: {
        status: { type: "string", example: "ok" },
        timestamp: { type: "string", example: "2026-09-19T16:00:00.000Z" },
        uptime: { type: "number", example: 123.45 },
      },
    },
  })
  health(): HealthCheckResponse {
    return this.getHealthService.execute();
  }
}
