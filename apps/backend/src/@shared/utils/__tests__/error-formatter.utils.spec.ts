import { afterEach, describe, expect, it } from "bun:test";
import { HttpException, HttpStatus } from "@nestjs/common";
import { DriverException } from "@mikro-orm/core";
import { formatException } from "../error-formatter.utils.js";

const originalNodeEnv = process.env.NODE_ENV;

class BetterAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BetterAuthError";
  }
}

function setNodeEnv(value: string | undefined): void {
  if (value === undefined) {
    delete process.env.NODE_ENV;
    return;
  }

  process.env.NODE_ENV = value;
}

afterEach(() => {
  setNodeEnv(originalNodeEnv);
});

describe("formatException", () => {
  it("should hide an unknown error message outside development and test environments", () => {
    setNodeEnv("production");

    const result = formatException(new Error("connection string leaked"), {
      logError: false,
    });

    expect(result).toEqual({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        name: "Error",
        message: "Internal server error",
        isOperational: false,
        stack: null,
      },
    });
  });

  it("should hide an upstream network error message outside development", () => {
    setNodeEnv("production");

    const result = formatException(new TypeError("fetch failed"), {
      logError: false,
    });

    expect(result).toEqual({
      statusCode: HttpStatus.BAD_GATEWAY,
      body: {
        name: "TypeError",
        message: "An upstream service error occurred",
        isOperational: true,
        stack: null,
      },
    });
  });

  it("should map invalid authentication credentials to an unauthorized response", () => {
    setNodeEnv("production");

    const result = formatException(new BetterAuthError("Invalid credentials"), {
      logError: false,
    });

    expect(result).toEqual({
      statusCode: HttpStatus.UNAUTHORIZED,
      body: {
        name: "AuthError",
        message: "Authentication error occurred",
        isOperational: true,
        stack: null,
      },
    });
  });

  it("should map duplicate authentication data to a conflict response", () => {
    setNodeEnv("production");

    const result = formatException(new BetterAuthError("User already exists"), {
      logError: false,
    });

    expect(result.statusCode).toBe(HttpStatus.CONFLICT);
  });

  it("should map missing authentication metadata to an internal server error", () => {
    setNodeEnv("production");

    const result = formatException(new BetterAuthError("No metadata found"), {
      logError: false,
    });

    expect(result.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it("should format an HTTP exception using its response message", () => {
    setNodeEnv("production");
    const exception = new HttpException(
      { message: ["email must be valid"], error: "Bad Request" },
      HttpStatus.BAD_REQUEST,
    );

    const result = formatException(exception, { logError: false });

    expect(result).toEqual({
      statusCode: HttpStatus.BAD_REQUEST,
      body: {
        name: "HttpException",
        message: ["email must be valid"],
        isOperational: true,
        stack: null,
      },
    });
  });

  it("should preserve a string HTTP response", () => {
    setNodeEnv("production");

    const result = formatException(
      new HttpException("Resource unavailable", HttpStatus.SERVICE_UNAVAILABLE),
      { logError: false },
    );

    expect(result.body.message).toBe("Resource unavailable");
    expect(result.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it("should recognize a network error by its cause code", () => {
    setNodeEnv("development");
    const exception = new TypeError("request failed", {
      cause: { code: "ECONNREFUSED" },
    });

    const result = formatException(exception, { logError: false });

    expect(result.statusCode).toBe(HttpStatus.BAD_GATEWAY);
    expect(result.body).toMatchObject({
      name: "TypeError",
      message: "request failed",
      isOperational: true,
      stack: exception.stack,
    });
  });

  it("should expose a database error only through its safe message", () => {
    setNodeEnv("test");
    const exception = new DriverException(new Error("database password exposed"));

    const result = formatException(exception, { logError: false });

    expect(result).toMatchObject({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        name: "DriverException",
        message: "Database communication failure. Check application logs!",
        isOperational: true,
      },
    });
    expect(result.body.stack).toBe(JSON.stringify(exception, null, 2));
  });

  it("should expose an unknown error message during tests", () => {
    setNodeEnv("test");

    const result = formatException(new Error("expected test detail"), {
      logError: false,
    });

    expect(result.body).toMatchObject({
      name: "Error",
      message: "expected test detail",
      isOperational: false,
    });
  });

  it("should use development details for generic authentication errors", () => {
    setNodeEnv("development");
    const exception = new BetterAuthError("Session is expired");

    const result = formatException(exception, { logError: false });

    expect(result).toMatchObject({
      statusCode: HttpStatus.BAD_REQUEST,
      body: {
        name: "AuthError",
        message: "Session is expired",
        isOperational: true,
        stack: exception.stack,
      },
    });
  });
});
