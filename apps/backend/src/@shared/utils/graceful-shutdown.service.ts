import { MikroORM } from "@mikro-orm/postgresql";
import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";

@Injectable()
export class GracefulShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(GracefulShutdownService.name);

  constructor(private readonly orm: MikroORM) {}

  async onApplicationShutdown(signal: string) {
    this.logger.log(`Received shutdown signal: ${signal}`);

    try {
      if (await this.orm.isConnected()) {
        await this.orm.close();
      }
      this.logger.log(`Database shutdown successfully`);
    } catch (error) {
      this.logger.error(`Error during database shutdown: ${error}`);
    }
  }
}