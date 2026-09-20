import { describe, expect, it } from "bun:test";
import { HttpException, HttpStatus, type ArgumentsHost } from "@nestjs/common";
import type { HttpAdapterHost } from "@nestjs/core";

interface ReplyCall {
  response: object;
  body: object;
  statusCode: number;
}

import { GlobalExceptionFilter } from "../global-exception.filter.js";

function createArgumentsHost(response: object): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => undefined,
      getResponse: () => response,
      getNext: () => undefined,
    }),
  } as unknown as ArgumentsHost;
}

function createHttpAdapterHost(replyCalls: ReplyCall[]): HttpAdapterHost {
  return {
    httpAdapter: {
      reply: (response: object, body: object, statusCode: number) => {
        replyCalls.push({ response, body, statusCode });
      },
    },
  } as unknown as HttpAdapterHost;
}

describe("GlobalExceptionFilter", () => {
  it("should reply with a formatted server-error response", () => {
    const replyCalls: ReplyCall[] = [];
    const response = {};
    const exception = new HttpException(
      "Internal server error",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );

    new GlobalExceptionFilter(createHttpAdapterHost(replyCalls)).catch(
      exception,
      createArgumentsHost(response),
    );

    expect(replyCalls).toEqual([
      {
        response,
        body: {
          name: "HttpException",
          message: "Internal server error",
          isOperational: true,
          stack: null,
        },
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    ]);
  });

  it("should reply with the formatted client-error status and body", () => {
    const replyCalls: ReplyCall[] = [];
    const response = {};
    const exception = new HttpException(
      "email must be valid",
      HttpStatus.BAD_REQUEST,
    );

    new GlobalExceptionFilter(createHttpAdapterHost(replyCalls)).catch(
      exception,
      createArgumentsHost(response),
    );

    expect(replyCalls).toEqual([
      {
        response,
        body: {
          name: "HttpException",
          message: "email must be valid",
          isOperational: true,
          stack: null,
        },
        statusCode: HttpStatus.BAD_REQUEST,
      },
    ]);
  });
});
