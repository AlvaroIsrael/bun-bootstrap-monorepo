import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { Logger } from "@nestjs/common";
import type { MikroORM } from "@mikro-orm/postgresql";
import { GracefulShutdownService } from "../graceful-shutdown.service.js";

describe("GracefulShutdownService", () => {
  let service: GracefulShutdownService;
  let mockOrm: {
    isConnected: ReturnType<typeof mock>;
    close: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    mockOrm = {
      isConnected: mock(() => Promise.resolve(true)),
      close: mock(() => Promise.resolve()),
    };

    service = new GracefulShutdownService(mockOrm as unknown as MikroORM);
  });

  it("should close database connection when orm is connected", async () => {
    mockOrm.isConnected.mockResolvedValue(true);

    await service.onApplicationShutdown("SIGTERM");

    expect(mockOrm.isConnected).toHaveBeenCalledTimes(1);
    expect(mockOrm.close).toHaveBeenCalledTimes(1);
  });

  it("should not call orm.close when orm is not connected", async () => {
    mockOrm.isConnected.mockResolvedValue(false);

    await service.onApplicationShutdown("SIGINT");

    expect(mockOrm.isConnected).toHaveBeenCalledTimes(1);
    expect(mockOrm.close).not.toHaveBeenCalled();
  });

  it("should catch and log error if orm.close throws", async () => {
    const error = new Error("Database close failure");
    mockOrm.isConnected.mockResolvedValue(true);
    mockOrm.close.mockRejectedValue(error);

    const loggerErrorSpy = spyOn(Logger.prototype, "error").mockImplementation(() => {});

    await expect(service.onApplicationShutdown("SIGTERM")).resolves.toBeUndefined();

    expect(mockOrm.close).toHaveBeenCalledTimes(1);
    expect(loggerErrorSpy).toHaveBeenCalledWith(`Error during database shutdown: ${error}`);

    loggerErrorSpy.mockRestore();
  });
});
