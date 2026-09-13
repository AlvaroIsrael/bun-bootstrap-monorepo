import { ConsoleLogger, Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AuditContextInterceptor } from "./@shared/interceptors/audit-context.interceptor.js";
import { AppModule } from "./app/app.module.js";

const startServer = async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
    }),
    {
      logger: new ConsoleLogger({
        colors: Boolean(process.env.COLORIZE_CONSOLE === "true"),
      }),
      rawBody: true,
      bodyParser: false,
    },
  );

  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.enableCors({
    origin: configService.get<string>("CORS_ORIGINS")
      ? String(configService.get<string>("CORS_ORIGINS")).trim().split(",")
      : [],
    credentials: true,
    preflightContinue: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  });

  const applicationName = String(configService.get<string>("APPLICATION_NAME")).toLowerCase();

  const documentBuilder = new DocumentBuilder()
    .setTitle(applicationName)
    .setDescription(`Open API documentation for ${applicationName} API.`)
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentBuilder);

  SwaggerModule.setup("docs", app, document);

  const httpAdapterHost = app.get(HttpAdapterHost);

  app.useGlobalInterceptors(new AuditContextInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));

  app.enableShutdownHooks();

  await app.listen(Number(configService.get("BACKEND_PORT")), "0.0.0.0");
};

try {
  void startServer();
  const logger = new Logger("Bootstrap");
  logger.log(`🔥 Server running on port ${String(process.env.BACKEND_PORT)} 🔥`);
} catch (error) {
  console.error(error);
  process.exit(1);
}