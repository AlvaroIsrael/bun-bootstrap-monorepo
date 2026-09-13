import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./services/app.service.js";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
