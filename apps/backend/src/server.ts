import { ConsoleLogger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app/app.module.js";

const startServer = async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: new ConsoleLogger({
        colors: Boolean(process.env.COLORIZE_CONSOLE === "true"),
      }),
    }),
  );

  app.enableCors({
    origin: ["http://localhost:3001"],
    credentials: true,
  });

  app.enableShutdownHooks();

  await app.listen(Number(process.env.PORT));
};

try {
  void startServer();
} catch (error) {
  console.error(error);
  process.exit(1);
}