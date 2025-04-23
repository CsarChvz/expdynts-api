/* eslint-disable @typescript-eslint/no-unused-vars */

// src/modules/queue/consumers/notifications.consumer.ts
import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";
import { QUEUE_NAMES } from "../../../common/constants/queue.constants";
import { NotificationQueueItem } from "src/common/interfaces/queue-items.interface";
import { QueueService } from "../queue.service";

interface NotificationJobResult {
  id: string;
  sent: boolean;
  sentAt: Date;
  processingTime: number;
}

@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATIONS, {
  concurrency: 3,
})
export class NotificationsConsumer extends WorkerHost {
  private readonly logger = new Logger(NotificationsConsumer.name);
  private readonly concurrency: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
  ) {
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
  onActive(job: Job<NotificationQueueItem>) {
    this.logger.debug(`Procesando notificación #${job.id} - ${job.data.id} `);
  }

  @OnWorkerEvent("completed")
  onComplete(job: Job<NotificationQueueItem>, result: NotificationJobResult) {
    this.logger.debug(`Notificación #${job.id} enviada correctamente`);
  }

  @OnWorkerEvent("failed")
  onError(job: Job<NotificationQueueItem>, error: Error) {
    this.logger.error(
      `Error enviando notificación #${job.id}: ${error.message}`,
      error.stack,
    );
  }

  async process(
    job: Job<NotificationQueueItem>,
  ): Promise<NotificationJobResult> {
    const { id, content } = job.data;
    this.logger.log(`Enviando notificación ${id}`);
    const telefono = content.data?.atributosUsuario.telefono ?? "";

    try {
      await job.updateProgress(20);

      await job.updateProgress(50);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { data } = content;
      const expediente = data?.expediente;
      const cambios = data?.cambiosRealizados ?? [];

      const textoWhatsApp = `📢 *Actualización de tu expediente judicial*
      *¡Gracias por usar nuestro servicio!* 🙌`;

      await this.queueService.sendNotification("api/sendText", {
        phone: "5213314825663",
        text: JSON.stringify(cambios),
      });

      await job.updateProgress(80);
      await job.updateData({
        ...job.data,
        status: "sent",
      });
      await job.updateProgress(100);

      const result = {
        id,
        sent: true,
        sentAt: new Date(),
        processingTime: 1000,
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
