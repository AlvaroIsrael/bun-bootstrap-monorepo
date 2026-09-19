import { ConfigService } from "@nestjs/config";
import { Transport, type RedisOptions } from "@nestjs/microservices";

const DEFAULT_REDIS_PORT = 6379;

export const getRedisOptions = (configService: ConfigService): RedisOptions => {
  const configuredPort = configService.get<string>("REDIS_PORT");
  const port = configuredPort ? Number(configuredPort) : DEFAULT_REDIS_PORT;
  const configuredDatabase = configService.get<string>("REDIS_DB");
  const db = configuredDatabase ? Number(configuredDatabase) : undefined;

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("REDIS_PORT must be an integer between 1 and 65535.");
  }

  if (db !== undefined && (!Number.isInteger(db) || db < 0)) {
    throw new Error("REDIS_DB must be a non-negative integer.");
  }

  return {
    transport: Transport.REDIS,
    options: {
      host: configService.get<string>("REDIS_HOST") ?? "localhost",
      port,
      username: configService.get<string>("REDIS_USERNAME"),
      password: configService.get<string>("REDIS_PASSWORD"),
      db,
    },
  };
};
