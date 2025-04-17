/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// src/modules/queue/consumers/notifications.consumer.ts
import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";
import { QUEUE_NAMES } from "../../../common/constants/queue.constants";

@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATIONS, {
  concurrency: 3,
})
export class NotificationsConsumer extends WorkerHost {
  private readonly logger = new Logger(NotificationsConsumer.name);
  private readonly concurrency: number;

  constructor(private readonly configService: ConfigService) {
    super();
    this.concurrency = this.configService.get<number>(
      "queue.concurrency.notifications",
      3,
    );
    this.logger.log(
      `Configurando consumidor de notifications con concurrencia: ${this.concurrency}`,
    );
  }

  @OnWorkerEvent("active")
  onActive(job: Job<any>) {
    this.logger.debug(
      `Procesando notificación #${job.id} - ${job.data.id} (tipo: ${job.data.type})`,
    );
  }

  @OnWorkerEvent("completed")
  onComplete(job: Job<any>, result: any) {
    this.logger.debug(`Notificación #${job.id} enviada correctamente`);
  }

  @OnWorkerEvent("failed")
  onError(job: Job<any>, error: Error) {
    this.logger.error(
      `Error enviando notificación #${job.id}: ${error.message}`,
      error.stack,
    );
  }

  async process(job: Job<any>): Promise<any> {
    const { id, type, recipient, content } = job.data;
    this.logger.log(
      `Enviando notificación ${id} de tipo ${type} a ${recipient}`,
    );

    try {
      await job.updateProgress(20);

      let processingTime: number;

      switch (type) {
        case "email":
          processingTime = Math.floor(Math.random() * 1000) + 1000;
          break;
        case "sms":
          processingTime = Math.floor(Math.random() * 500) + 500;
          break;
        case "push":
          processingTime = Math.floor(Math.random() * 300) + 200;
          break;
        default:
          processingTime = 1000;
      }

      await job.updateProgress(50);
      await new Promise((resolve) => setTimeout(resolve, processingTime));

      if (Math.random() < 0.1) {
        throw new Error(
          `Error simulado al enviar notificación de tipo ${type}`,
        );
      }

      await job.updateProgress(80);
      await job.updateData({
        ...job.data,
        status: "sent",
      });
      await job.updateProgress(100);

      const result = {
        id,
        recipient,
        type,
        sent: true,
        sentAt: new Date(),
        processingTime,
      };

      return result;
    } catch (error) {
      await job.updateData({
        ...job.data,
        status: "failed",
        retries: (job.data.retries || 0) + 1,
      });

      throw error;
    }
  }
}
