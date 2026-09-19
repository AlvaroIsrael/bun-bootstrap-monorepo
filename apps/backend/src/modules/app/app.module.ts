import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import config from "../../@shared/database/mikro-orm.config.js";
import { GracefulShutdownService } from "./services/graceful-shutdown.service.js";
import { AppController } from "./app.controller.js";
import { GetHealthService } from "./services/get-health.service.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
    }),
    MikroOrmModule.forRoot({
      ...config,
      autoLoadEntities: true,
    }),
  ],
  controllers: [AppController],
  providers: [GetHealthService, GracefulShutdownService],
})
export class AppModule {}
