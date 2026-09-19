import { describe, expect, it } from "bun:test";
import type { ConfigService } from "@nestjs/config";
import { Transport } from "@nestjs/microservices";
import { getRedisOptions } from "../redis.options.js";

const createConfigService = (values: Record<string, string | undefined>) =>
  ({
    get: (key: string) => values[key],
  }) as unknown as ConfigService;

describe("getRedisOptions", () => {
  it("should configure the Redis transport with default connection settings", () => {
    expect(getRedisOptions(createConfigService({}))).toEqual({
      transport: Transport.REDIS,
      options: {
        host: "localhost",
        port: 6379,
        username: undefined,
        password: undefined,
        db: undefined,
      },
    });
  });

  it("should configure Redis from environment values", () => {
    expect(
      getRedisOptions(
        createConfigService({
          REDIS_HOST: "redis.internal",
          REDIS_PORT: "6380",
          REDIS_USERNAME: "app",
          REDIS_PASSWORD: "secret",
          REDIS_DB: "2",
        }),
      ),
    ).toMatchObject({
      options: {
        host: "redis.internal",
        port: 6380,
        username: "app",
        password: "secret",
        db: 2,
      },
    });
  });

  it("should reject an invalid Redis port", () => {
    expect(() => getRedisOptions(createConfigService({ REDIS_PORT: "0" }))).toThrow(
      "REDIS_PORT must be an integer between 1 and 65535.",
    );
  });
});
