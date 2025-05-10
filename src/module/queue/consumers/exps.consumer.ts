/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/modules/queue/consumers/exps.consumer.ts
import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger, Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";
import { ExpQueueItem } from "../../../common/interfaces/queue-items.interface";
import { QueueService } from "../queue.service";
import { QUEUE_NAMES } from "../../../common/constants/queue.constants";
import { HashService } from "src/common/hash/hash.service";
import { ComparacionResultado } from "src/common/types/expediente-queue.type";
import { NotificationQueueItem } from "src/common/interfaces/queue-items.interface";
import { ExpedienteObjeto } from "@/common/types/expediente.type";

export interface ExpJobResult {
  id: string;
  processed: boolean;
  processingTime: number;
  result: string;
}

@Injectable()
@Processor(QUEUE_NAMES.EXPS, {
  concurrency: 5, // Se sobreescribirá con el valor configurado
})
export class ExpsConsumer extends WorkerHost implements OnModuleDestroy {
  private readonly logger = new Logger(ExpsConsumer.name);
  private readonly concurrency: number;

  private readonly jobMetadata = new WeakMap<Job, { startTime: number }>();

  constructor(
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
    private readonly hashService: HashService,
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

  onModuleDestroy() {
    this.cleanup();
  }

  private cleanup(): void {
    this.logger.log("Limpiando recursos del consumidor de exps");
  }

  @OnWorkerEvent("active")
  onActive(job: Job<ExpQueueItem>) {
    this.jobMetadata.set(job, { startTime: Date.now() });
    this.logger.debug(`Procesando exp #${job.id} - ${job.data.id}`);
  }

  @OnWorkerEvent("completed")
  onComplete(job: Job<ExpQueueItem>, result: ExpJobResult) {
    const jobId = job.id;
    const resultJson = JSON.stringify(result);
    this.logger.debug(`Exp #${jobId} completado con resultado: ${resultJson}`);
    this.jobMetadata.delete(job);
  }

  @OnWorkerEvent("failed")
  onError(job: Job<ExpQueueItem>, error: Error) {
    const jobId = job.id;
    const errorMessage = error.message;
    const errorStack = error.stack;
    this.logger.error(
      `Error procesando exp #${jobId}: ${errorMessage}`,
      errorStack,
    );
    this.jobMetadata.delete(job);
  }

  /**
   * Procesa los elementos de la cola 'exps'
   */
  async process(job: Job<ExpQueueItem>): Promise<ExpJobResult> {
    const startTime = Date.now();
    const { id, data } = job.data;
    this.logger.log(`Procesando exp: ${id}`);

    // Tipado explícito para evitar errores
    let expedienteResult: ExpedienteObjeto[] | null = null;
    let acuerdoHashed: string | null = null;
    let resultadoComparacion: ComparacionResultado | null = null;

    try {
      const { expediente, usuarioExpedientesId, expedienteId } = data;

      await job.updateProgress(10);
      this.logger.log(`Progreso exp ${id}: 10% - Iniciando proceso`);

      expedienteResult = await this.queueService.fetchExpediente(
        expediente.url,
      );

      await job.updateProgress(40);
      this.logger.log(
        `Progreso exp ${id}: 40% - Expediente obtenido de fuente externa`,
      );

      acuerdoHashed = await this.hashService.generarHash(
        JSON.stringify(expedienteResult),
      );

      await job.updateProgress(60);
      this.logger.log(`Progreso exp ${id}: 60% - Hash generado`);

      resultadoComparacion = await this.queueService.comparacionAcuerdos({
        acuerdosActuales: expedienteResult,
        hashNuevo: acuerdoHashed,
        usuarioExpediente: usuarioExpedientesId,
      });

      await job.updateProgress(80);
      this.logger.log(`Progreso exp ${id}: 80% - Comparación completada`);

      if (resultadoComparacion && resultadoComparacion.haCambiado === true) {
        const notificationData: NotificationQueueItem = {
          id: `notif-${id}-${Date.now()}`,
          expId: id,
          content: { ...resultadoComparacion },
          status: "pending",
        };

        await this.queueService.addToNotificationsQueue(notificationData);

        this.logger.log(
          `Exp ${id}: Cambios detectados, agregado a cola de notificaciones`,
        );
      }

      await this.queueService.updateAcuerdosExpediente(
        expedienteId,
        expedienteResult,
      );

      await job.updateProgress(100);
      this.logger.log(`Progreso exp ${id}: 100% - Proceso completado`);

      const processingTime = Date.now() - startTime;
      return {
        id,
        processed: true,
        processingTime,
        result: `Expediente ${id} procesado correctamente`,
      };
    } catch (error) {
      this.logger.error(`Error procesando exp ${id}: ${error.message}`);
      await job.updateData({
        ...job.data,
        status: "failed",
        retries: (job.data.retries || 0) + 1,
      });
      throw error;
    } finally {
      // Limpieza segura
      expedienteResult = null;
      resultadoComparacion = null;
      acuerdoHashed = null;
    }
  }
}
