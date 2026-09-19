import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../src/modules/app/app.module.js";

describe("AppController (e2e)", () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it("/health (GET)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toMatchObject({
      status: "ok",
    });
    expect(typeof body.timestamp).toBe("string");
    expect(typeof body.uptime).toBe("number");
  });

  it("/ (GET)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toMatchObject({
      status: "ok",
    });
    expect(typeof body.timestamp).toBe("string");
    expect(typeof body.uptime).toBe("number");
  });

  afterEach(async () => {
    await app.close();
  });
});
