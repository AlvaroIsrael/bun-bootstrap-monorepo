import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import config from "../@shared/database/mikro-orm.config.js";
import { GracefulShutdownService } from "../@shared/utils/graceful-shutdown.service.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./services/app.service.js";

@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...config,
      autoLoadEntities: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, GracefulShutdownService],
})
export class AppModule {}