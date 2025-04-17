import { Module } from "@nestjs/common";
import { QueueModule } from "../queue/queue.module";
import { CronService } from "./cron.service";
import { DataModule } from "../data/data.module";

@Module({
  imports: [QueueModule, DataModule],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
