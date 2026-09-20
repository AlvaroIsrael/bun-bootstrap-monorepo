import { afterAll, describe, expect, it, mock, spyOn } from "bun:test";
import { ConsoleLogger, Logger } from "@nestjs/common";

interface RollbarConfiguration {
  accessToken?: string;
  scrubFields: string[];
  environment?: string;
  enabled: boolean;
  captureUncaught: boolean;
  captureUnhandledRejections: boolean;
  captureIp: boolean;
  nodeSourceMaps: boolean;
}

interface RollbarReport {
  message: Error | string;
  payload?: { context: string };
}

const rollbarConfigurations: RollbarConfiguration[] = [];
const rollbarReports: RollbarReport[] = [];
const originalNodeEnv = process.env.NODE_ENV;
const originalRollbarAccessToken = process.env.ROLLBAR_ACCESS_TOKEN;

class RollbarMock {
  constructor(configuration: RollbarConfiguration) {
    rollbarConfigurations.push(configuration);
  }

  error(message: Error | string, payload?: { context: string }): void {
    rollbarReports.push({ message, payload });
  }
}

mock.module("rollbar", () => ({ default: RollbarMock }));

process.env.NODE_ENV = "production";
process.env.ROLLBAR_ACCESS_TOKEN = "rollbar-token";

const consoleErrorSpy = spyOn(ConsoleLogger.prototype, "error").mockImplementation(
  () => undefined,
);

await import("../logger.utils.js");

afterAll(() => {
  consoleErrorSpy.mockRestore();

  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }

  if (originalRollbarAccessToken === undefined) {
    delete process.env.ROLLBAR_ACCESS_TOKEN;
  } else {
    process.env.ROLLBAR_ACCESS_TOKEN = originalRollbarAccessToken;
  }
});

describe("Logger Rollbar integration", () => {
  it("should create a production Rollbar client with sensitive fields scrubbed", () => {
    new Logger("Payments").error("payment failed");

    expect(rollbarConfigurations).toEqual([
      {
        accessToken: "rollbar-token",
        scrubFields: ["password", "secret", "creditCard", "authorization"],
        environment: "production",
        enabled: true,
        captureUncaught: true,
        captureUnhandledRejections: true,
        captureIp: true,
        nodeSourceMaps: true,
      },
    ]);
  });

  it("should report Error instances without losing their details", () => {
    const error = new Error("gateway timeout");

    new Logger("Payments").error(error);

    expect(rollbarReports.at(-1)).toEqual({
      message: error,
      payload: { context: "Payments" },
    });
  });

  it("should serialize object messages before reporting them", () => {
    new Logger("Orders").error({ orderId: "order-123", reason: "declined" });

    expect(rollbarReports.at(-1)).toEqual({
      message: '{"orderId":"order-123","reason":"declined"}',
      payload: { context: "Orders" },
    });
  });

  it("should fall back to the string representation of circular messages", () => {
    const message: { self?: unknown } = {};
    message.self = message;

    new Logger("Orders").error(message);

    expect(rollbarReports.at(-1)).toEqual({
      message: "[object Object]",
      payload: { context: "Orders" },
    });
  });

  it("should use an explicit context when one is supplied", () => {
    new Logger("Orders").error("payment failed", undefined, "Checkout");

    expect(rollbarReports.at(-1)).toEqual({
      message: "payment failed",
      payload: { context: "Checkout" },
    });
  });

  it("should report audit logs through the same Rollbar integration", () => {
    new Logger("Security").audit("role changed");

    expect(rollbarReports.at(-1)).toEqual({
      message: "role changed",
      payload: { context: "Security" },
    });
  });
});
