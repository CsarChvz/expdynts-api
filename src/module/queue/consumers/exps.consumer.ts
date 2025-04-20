/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { QUEUE_NAMES } from "src/common/constants/queue.constants";
import { QueueService } from "../queue.service";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";

@Injectable()
@Processor(QUEUE_NAMES.EXPS, {
  concurrency: 5,
})
export class ExpsConsumer extends WorkerHost {
  private readonly logger = new Logger(ExpsConsumer.name);
  private readonly concurrency: number;

  constructor(
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.concurrency = this.configService.get<number>(
      "queue.concurrency.exps",
      5,
    );
    this.logger.log(
      `Configurando consumidor de exps con concurrencia: ${this.concurrency}`,
    );
  }

  // @OnWorkerEvent("drained")
  // onQueueDrained() {
  //   console.log("La cola exp está vacía, todas las tareas han sido procesadas");
  //   // Implementa aquí tu lógica de trigger
  // }
  @OnWorkerEvent("active")
  onActive(job: Job<any>) {
    this.logger.debug(`Procesando exp #${job.id} - ${job.data.id}`);
  }

  @OnWorkerEvent("completed")
  onComplete(job: Job<any>, result: any) {
    this.logger.debug(
      `Exp #${job.id} completado con resultado: ${JSON.stringify(result)}`,
    );
  }

  @OnWorkerEvent("failed")
  onError(job: Job<any>, error: Error) {
    this.logger.error(
      `Error procesando exp #${job.id}: ${error.message}`,
      error.stack,
    );
  }

  async process(job: Job<any>): Promise<any> {
    const { id, data } = job.data;
    this.logger.log(`Procesando exp: ${id}`);

    try {
      await job.updateProgress(10);

      await job.updateData({
        ...job.data,
        status: "processing",
        processedAt: new Date(),
      });
      await job.updateProgress(30);

      const processingTime = Math.floor(Math.random() * 2000) + 1000;
      await new Promise((resolve) => setTimeout(resolve, processingTime));

      await job.updateProgress(70);

      const result = {
        id,
        processed: true,
        processingTime,
        result: `Datos procesados: ${JSON.stringify(data)}`,
      };

      const shouldNotify = Math.random() > 0.5;

      if (shouldNotify) {
        await this.queueService.addToNotificationsQueue({
          id: `notif-${id}-${Date.now()}`,
          expId: id,
          type: Math.random() > 0.5 ? "email" : "push",
          recipient: "usuario@ejemplo.com",
          content: {
            message: `Se ha procesado el exp ${id}`,
            details: result,
          },
          status: "pending",
        });
      }

      await job.updateProgress(100);

      await job.updateData({
        ...job.data,
        status: "processing",
        processedAt: new Date(),
      });

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
