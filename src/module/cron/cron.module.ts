import { Module } from "@nestjs/common";
import { QueueModule } from "../queue/queue.module";
import { CronService } from "./cron.service";
import { DatabaseModule } from "src/database/database.module";
import { CronController } from "./cron.controller";

@Module({
  imports: [QueueModule, DatabaseModule],
  providers: [CronService],
  exports: [CronService],
  controllers: [CronController],
})
export class CronModule {}
