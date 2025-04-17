/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { QUEUE_NAMES } from "src/common/constants/queue.constants";
import { QueueService } from "../queue.service";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";
import {
  ExpJobResult,
  ExpQueueItem,
} from "src/common/interfaces/queue-items.interface";

@Injectable()
@Processor(QUEUE_NAMES.EXPS, {
  // Con BullMQ podemos definir la concurrencia en el decorador @Processor
  concurrency: 5, // Se sobreescribirá con el valor configurado
})
export class ExpsConsumer extends WorkerHost {
  private readonly logger = new Logger(ExpsConsumer.name);
  private readonly concurrency: number;

  constructor(
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
  ) {
    super();
    // Obtener la configuración de concurrencia
    this.concurrency = this.configService.get<number>(
      "queue.concurrency.exps",
      5,
    );
    this.logger.log(
      `Configurando consumidor de exps con concurrencia: ${this.concurrency}`,
    );
  }

  @OnWorkerEvent("active")
  onActive(job: Job<ExpQueueItem>) {
    this.logger.debug(`Procesando exp #${job.id} - ${job.data.id}`);
  }

  @OnWorkerEvent("completed")
  onComplete(job: Job<ExpQueueItem>, result: ExpJobResult) {
    this.logger.debug(
      `Exp #${job.id} completado con resultado: ${JSON.stringify(result)}`,
    );
  }

  @OnWorkerEvent("failed")
  onError(job: Job<ExpQueueItem>, error: Error) {
    this.logger.error(
      `Error procesando exp #${job.id}: ${error.message}`,
      error.stack,
    );
  }

  async process(job: Job<any, any, string>): Promise<any> {
    let progress = 0;
    for (let i = 0; i < 100; i++) {
      progress += 1;
      await job.updateProgress(progress);
    }
    return {};
  }
}
