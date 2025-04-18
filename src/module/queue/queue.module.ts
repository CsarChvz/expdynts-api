import { Module } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { QueueController } from "./queue.controller";
import { BullModule } from "@nestjs/bullmq";
import { QUEUE_NAMES } from "src/common/constants/queue.constants";
import { ExpsConsumer } from "./consumers/exps.consumer";
import { NotificationsConsumer } from "./consumers/notificationts.consumer";
import { BullShutdownService } from './bull-shutdown/bull-shutdown.service';
@Module({
  controllers: [QueueController],
  providers: [QueueService, ExpsConsumer, NotificationsConsumer, BullShutdownService],
  exports: [QueueService],
  imports: [
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.EXPS,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      },
      {
        name: QUEUE_NAMES.NOTIFICATIONS,
        // Opciones específicas para esta cola
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      },
    ),
  ],
})
export class QueueModule {}
