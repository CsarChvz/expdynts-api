import { Injectable, OnApplicationShutdown } from "@nestjs/common";
import { Queue } from "bullmq";
import { InjectQueue } from "@nestjs/bullmq";
import { ExpsConsumer } from "../consumers/exps.consumer";
import { QUEUE_NAMES } from "src/common/constants/queue.constants";
import { NotificationsConsumer } from "../consumers/notificationts.consumer";

@Injectable()
export class BullShutdownService implements OnApplicationShutdown {
  constructor(
    @InjectQueue(QUEUE_NAMES.EXPS) private readonly expsQueue: Queue,
    // WorkerHost expone el worker que creó internamente
    private readonly expsConsumer: ExpsConsumer,

    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
    private readonly notificationQueue: Queue,
    private readonly notificationConsumer: NotificationsConsumer,
  ) {}

  async onApplicationShutdown() {
    // Cierra Worker (desde WorkerHost)
    await this.expsConsumer.worker.close(); // :contentReference[oaicite:9]{index=9}
    // Cierra Cola
    await this.expsQueue.close(); // :contentReference[oaicite:10]{index=10}

    await this.notificationConsumer.worker.close();

    await this.notificationQueue.close();
  }
}
