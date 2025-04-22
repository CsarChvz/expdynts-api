/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpService } from "@nestjs/axios";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue, QueueEvents } from "bullmq";
import { HttpsProxyAgent } from "https-proxy-agent";
import { lastValueFrom } from "rxjs";
import { JOB_NAMES, QUEUE_NAMES } from "src/common/constants/queue.constants";
import {
  ExpQueueItem,
  NotificationQueueItem,
} from "src/common/interfaces/queue-items.interface";
import { v4 as uuid } from "uuid";
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private queueEvents: QueueEvents;

  constructor(
    @InjectQueue(QUEUE_NAMES.EXPS) private expsQueue: Queue<ExpQueueItem>,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
    private notificationsQueue: Queue<NotificationQueueItem>,
    private httpService: HttpService,
  ) {}

  /**
   * Agrega un nuevo elemento a la cola de exps
   * @param item Elemento a agregar a la cola
   */
  async addToExpsQueue(item: ExpQueueItem) {
    try {
      this.logger.log(`Agregando item a la cola exps: ${item.id}`);

      // En BullMQ, debemos especificar un nombre para el job
      const job = await this.expsQueue.add(JOB_NAMES.PROCESS_EXP, item, {
        priority: 1, // Mayor prioridad
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        jobId: uuid(),
      });

      return job;
    } catch (error) {
      this.logger.error(
        `Error al agregar item a la cola exps: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Agrega un nuevo elemento a la cola de notificaciones
   * @param item Elemento a agregar a la cola
   */
  async addToNotificationsQueue(item: NotificationQueueItem) {
    try {
      this.logger.log(
        `Agregando item a la cola notifications: ${item.id} para exp ${item.expId}`,
      );

      return await this.notificationsQueue.add(
        JOB_NAMES.SEND_NOTIFICATION,
        item,
        {
          priority: item.type === "email" ? 2 : 1, // Priorizar según tipo
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          jobId: String(item.id),
        },
      );
    } catch (error) {
      this.logger.error(
        `Error al agregar item a la cola notifications: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getQueueMetrics() {
    const [
      expsCount,
      expsActive,
      expsPending,
      expsFailed,
      expsCompleted,
      notificationsCount,
      notificationsActive,
      notificationsPending,
      notificationsFailed,
      notificationsCompleted,
    ] = await Promise.all([
      this.expsQueue.count(),
      this.expsQueue.getActiveCount(),
      this.expsQueue.getWaitingCount(),
      this.expsQueue.getFailedCount(),
      this.expsQueue.getCompletedCount(),
      this.notificationsQueue.count(),
      this.notificationsQueue.getActiveCount(),
      this.notificationsQueue.getWaitingCount(),
      this.notificationsQueue.getFailedCount(),
      this.notificationsQueue.getCompletedCount(),
    ]);
    return {
      exp: {
        total: expsCount,
        active: expsActive,
        pending: expsPending,
        failed: expsFailed,
        completed: expsCompleted,
      },
      notifications: {
        total: notificationsCount,
        active: notificationsActive,
        pending: notificationsPending,
        failed: notificationsFailed,
        completed: notificationsCompleted,
      },
    };
  }

  async fetchExpediente(url: string) {
    const login = "a698053eb4a3eeaabac6";
    const password = "9ce98dafba032b0f";
    const host = "gw.dataimpulse.com";
    const port = "823";

    const httpsAgent = new HttpsProxyAgent(
      `http://${login}:${password}@${host}:${port}/`,
    );

    const result = await lastValueFrom(
      this.httpService.get(url, {
        httpsAgent,
      }),
    );
    return result.data;
  }
}
