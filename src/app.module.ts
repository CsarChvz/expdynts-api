/* eslint-disable @typescript-eslint/require-await */
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CommonModule } from "./common/common.module";
import { QueueModule } from "./module/queue/queue.module";
import { CronModule } from "./module/cron/cron.module";
import { BullModule } from "@nestjs/bullmq";
import configuration from "./config/configuration";
import { DatabaseModule } from "./database/database.module";
import { ScheduleModule } from "@nestjs/schedule";
import { SeedModule } from "./config/seed/seed.module";
import { MemoryCleanupService } from "./memory-cleanup/memory-cleanup.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("redis.host", "localhost"),
          port: configService.get<number>("redis.port", 6379),
          password: configService.get<string>("redis.password", ""),
          enableReadyCheck: false,
          disconnectTimeout: 2000,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: true,
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    CommonModule,
    QueueModule,
    CronModule,
    SeedModule,
  ],
  providers: [MemoryCleanupService],
})
export class AppModule {}
