/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { JOB_NAMES, QUEUE_NAMES } from "src/common/constants/queue.constants";
import {
  ExpQueueItem,
  NotificationQueueItem,
} from "src/common/interfaces/queue-items.interface";

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EXPS) private expsQueue: Queue<ExpQueueItem>,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
    private notificationsQueue: Queue<NotificationQueueItem>,
  ) {}

  /**
   * Agrega un nuevo elemento a la cola de exps
   * @param item Elemento a agregar a la cola
   */
  async addToExpsQueue(item: ExpQueueItem) {
    try {
      this.logger.log(`Agregando item a la cola exps: ${item.id}`);

      // En BullMQ, debemos especificar un nombre para el job
      return await this.expsQueue.add(JOB_NAMES.PROCESS_EXP, item, {
        priority: 1, // Mayor prioridad
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        jobId: item.id, // Usar ID como jobId para evitar duplicados
      });
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
          jobId: item.id,
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
      this.expsQueue.getDelayedCount(),
      this.expsQueue.getFailedCount(),
      this.expsQueue.getCompletedCount(),
      this.notificationsQueue.count(),
      this.notificationsQueue.getActiveCount(),
      this.notificationsQueue.getDelayedCount(),
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

  async addExperimentJob(data: any, opts?: any) {
    this.logger.log(`Adding experiment job with data: ${JSON.stringify(data)}`);
    const job = await this.expsQueue.add("process-experiment", data, opts);
    return { id: job.id, name: job.name };
  }

  async addNotificationJob(data: any, opts?: any) {
    this.logger.log(
      `Adding notification job with data: ${JSON.stringify(data)}`,
    );
    const job = await this.notificationsQueue.add(
      "send-notification",
      data,
      opts,
    );
    return { id: job.id, name: job.name };
  }

  async getExpsQueueStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.expsQueue.getWaitingCount(),
      this.expsQueue.getActiveCount(),
      this.expsQueue.getCompletedCount(),
      this.expsQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }

  async getNotificationsQueueStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.notificationsQueue.getWaitingCount(),
      this.notificationsQueue.getActiveCount(),
      this.notificationsQueue.getCompletedCount(),
      this.notificationsQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }
}
