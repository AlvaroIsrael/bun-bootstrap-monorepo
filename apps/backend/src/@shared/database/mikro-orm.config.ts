import { EntityGenerator } from "@mikro-orm/entity-generator";
import { Migrator } from "@mikro-orm/migrations";
import { defineConfig, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { SeedManager } from "@mikro-orm/seeder";

export default defineConfig({
  entities: ["./dist/entities"],
  entitiesTs: ["./src/entities"],
  dbName: "app",
  driver: PostgreSqlDriver,
  extensions: [Migrator, EntityGenerator, SeedManager],
  debug: process.env.NODE_ENV !== "production",
  slowQueryThreshold: process.env.NODE_ENV !== "production" ? 200 : undefined,
});