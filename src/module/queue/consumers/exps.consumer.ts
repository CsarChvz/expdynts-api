/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/modules/queue/consumers/exps.consumer.ts
import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";
import { ExpQueueItem } from "../../../common/interfaces/queue-items.interface";
import { QueueService } from "../queue.service";
import { QUEUE_NAMES } from "../../../common/constants/queue.constants";
import { HashService } from "src/common/hash/hash.service";

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
    private readonly hashService: HashService,
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
    const startTime = Date.now();
    const { id, data } = job.data;
    this.logger.log(`Procesando exp: ${id}`);

    try {
      // Extraer datos necesarios
      const { expediente, usuarioExpedientesId, expedienteId } = data;
      // Actualizar progreso: 10%
      await job.updateProgress(10);
      this.logger.log(`Progreso exp ${id}: 10% - Iniciando proceso`);

      // Paso 1: Obtener el expediente de la fuente externa
      const expedienteResult = await this.queueService.fetchExpediente(
        expediente.url,
      );

      // Actualizar progreso: 40%
      await job.updateProgress(40);
      this.logger.log(
        `Progreso exp ${id}: 40% - Expediente obtenido de fuente externa`,
      );

      // Paso 2: Hashear los nuevos acuerdos
      const acuerdoHashed = await this.hashService.generarHash(
        JSON.stringify(expedienteResult),
      );

      // Actualizar progreso: 60%
      await job.updateProgress(60);
      this.logger.log(`Progreso exp ${id}: 60% - Hash generado`);

      // Paso 3: Comparar con acuerdos anteriores
      const resultadoComparacion = await this.queueService.comparacionAcuerdos({
        acuerdosActuales: expedienteResult,
        hashNuevo: acuerdoHashed,
        usuarioExpediente: usuarioExpedientesId,
      });

      // Actualizar progreso: 80%
      await job.updateProgress(80);
      this.logger.log(`Progreso exp ${id}: 80% - Comparación completada`);

      if (
        typeof resultadoComparacion === "object" &&
        resultadoComparacion !== null
      ) {
        if (resultadoComparacion.haCambiado === true) {
          // Agregar a la cola de notificaciones con todo el objeto
          await this.queueService.addToNotificationsQueue({
            id: `notif-${id}-${Date.now()}`,
            expId: id,
            content: resultadoComparacion,
            status: "pending",
          });

          this.logger.log(
            `Exp ${id}: Cambios detectados, agregado a cola de notificaciones`,
          );
        }
      }
      // Paso 4: Actualizar los acuerdos en la base de datos
      await this.queueService.updateAcuerdosExpediente(
        expedienteId,
        expedienteResult,
      );

      // Actualizar progreso: 100%
      await job.updateProgress(100);
      this.logger.log(`Progreso exp ${id}: 100% - Proceso completado`);

      // Generar resultado
      const processingTime = Date.now() - startTime;
      return {
        id,
        processed: true,
        processingTime,
        result: `Expediente ${id} procesado correctamente`,
      };
    } catch (error) {
      this.logger.error(`Error procesando exp ${id}: ${error.message}`);

      // Actualizar estado de error en el trabajo
      await job.updateData({
        ...job.data,
        status: "failed",
        retries: (job.data.retries || 0) + 1,
      });

      throw error;
    }
  }
}
