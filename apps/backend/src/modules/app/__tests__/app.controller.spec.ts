import { beforeEach, describe, expect, it, spyOn } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "../app.controller.js";
import { GetHealthService } from "../services/get-health.service.js";

describe("AppController", () => {
  let appController: AppController;
  let getHealthService: GetHealthService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [GetHealthService],
    }).compile();

    appController = app.get<AppController>(AppController);
    getHealthService = app.get<GetHealthService>(GetHealthService);
  });

  describe("health", () => {
    it("should delegate to GetHealthService use case and return health response", () => {
      const executeSpy = spyOn(getHealthService, "execute");

      const response = appController.health();

      expect(executeSpy).toHaveBeenCalled();
      expect(response).toMatchObject({
        status: "ok",
      });
      expect(typeof response.timestamp).toBe("string");
      expect(typeof response.uptime).toBe("number");
      expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
    });
  });
});
