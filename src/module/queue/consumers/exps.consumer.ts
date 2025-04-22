// src/modules/queue/consumers/exps.consumer.ts
import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";
import { ExpQueueItem } from "../../../common/interfaces/queue-items.interface";
import { QueueService } from "../queue.service";
import { QUEUE_NAMES } from "../../../common/constants/queue.constants";

export interface ExpJobResult {
  id: string;
  processed: boolean;
  processingTime: number;
  result: string;
}

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

  /**
   * Procesa los elementos de la cola 'exps'
   * BullMQ tiene más características para manejo de trabajos
   */
  async process(job: Job<ExpQueueItem>): Promise<ExpJobResult> {
    const { id, data } = job.data;
    this.logger.log(`Procesando exp: ${id}`);

    //const url = data.expediente.url;
    try {
      // Actualizar progreso del trabajo
      await job.updateProgress(10);

      // Con BullMQ podemos actualizar los datos del trabajo
      await job.updateData({
        ...job.data,
        status: "processing",
        processedAt: new Date(),
      });
      await job.updateProgress(30);
      //await this.queueService.fetchExpediente(url);

      // Simular procesamiento con un tiempo aleatorio (entre 1-3 segundos)
      const processingTime = Math.floor(Math.random() * 2000) + 1000;
      await new Promise((resolve) => setTimeout(resolve, processingTime));

      await job.updateProgress(70);

      // Procesamiento simulado del objeto
      const result: ExpJobResult = {
        id,
        processed: true,
        processingTime,
        result: `Datos procesados: ${JSON.stringify(data)}`,
      };

      // Verificamos si debemos enviar una notificación (simulamos con 50% de probabilidad)
      const shouldNotify = Math.random() > 0.5;

      if (shouldNotify) {
        // Crear una notificación y enviarla a la cola 'notifications'
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

      // Actualizar el trabajo como completado
      await job.updateData({
        ...job.data,
        status: "processing",
        processedAt: new Date(),
      });

      return result;
    } catch (error) {
      // En caso de error, actualizar el estado y reintentar si es necesario
      await job.updateData({
        ...job.data,
        status: "failed",
        retries: (job.data.retries || 0) + 1,
      });

      throw error;
    }
  }
}
