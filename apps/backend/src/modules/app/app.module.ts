import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import config from "../../@shared/database/mikro-orm.config.js";
import { GracefulShutdownService } from "./services/graceful-shutdown.service.js";
import { AppController } from "./app.controller.js";
import { GetHealthService } from "./services/get-health.service.js";

@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...config,
      autoLoadEntities: true,
    }),
  ],
  controllers: [AppController],
  providers: [GetHealthService, GracefulShutdownService],
})
export class AppModule {}
