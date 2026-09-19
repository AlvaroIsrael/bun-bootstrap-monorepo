import { beforeEach, describe, expect, it } from "bun:test";
import { GetHealthService } from "../get-health.service.js";

describe("GetHealthService", () => {
  let service: GetHealthService;

  beforeEach(() => {
    service = new GetHealthService();
  });

  it("should return health status ok with current timestamp and process uptime", () => {
    const result = service.execute();

    expect(result).toMatchObject({
      status: "ok",
    });
    expect(typeof result.timestamp).toBe("string");
    expect(typeof result.uptime).toBe("number");
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
