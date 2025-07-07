/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { QueueService } from "../queue/queue.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "../../database/schema";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private readonly dataFetchInterval: string;
  private readonly isEnabled: boolean;

  // Usar WeakMap para almacenar datos temporales asociados a objetos
  // Las claves deben ser objetos, no valores primitivos
  private expedienteCache = new WeakMap<object, any>();

  // WeakSet para rastrear objetos procesados sin prevenir la recolección de basura
  private processedItems = new WeakSet<object>();

  /**
   * Obtiene el estado actual de habilitación del servicio
   */
  getIsEnabled(): boolean {
    return this.isEnabled;
  }

  constructor(
    private readonly queueService: QueueService,
    @Inject(DATABASE_CONNECTION)
    private readonly database: NeonHttpDatabase<typeof schema>,
    private readonly configService: ConfigService,
  ) {
    // Inicializar el estado del cron desde la variable de entorno
    this.isEnabled =
      this.configService.get<string>("CRON_ENABLED", "true").toLowerCase() ===
      "true";
    this.logger.log(
      `Servicio cron inicializado como: ${this.isEnabled ? "habilitado" : "deshabilitado"}`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM, {
    timeZone: "America/Mexico_City", // o la zona que necesites
  })
  async getExpsAndAddToQueue() {
    await this.queueService.sendNotification("/api/sendText", {
      phone: "5213314825663",
      text: "Cron mandado a llamar",
    });

    // Verificar si el servicio está habilitado antes de ejecutar
    if (!this.isEnabled) {
      this.logger.log(
        "[GET_AND_QUEUE] - Servicio deshabilitado, omitiendo ejecución.",
      );
      return { success: false, reason: "service_disabled" };
    }

    try {
      this.logger.log(
        "[GET_AND_QUEUE] - Obtener registros y agregarlos a la cola.",
      );
      this.logger.log("[GET_EXPEDIENTES] - Se obtienen los expedientes");

      const itemsExpedientes =
        await this.database.query.usuarioExpedientes.findMany({
          with: {
            expediente: true,
          },
        });

      this.logger.log(
        `Obtenidos ${itemsExpedientes.length} elementos para procesar`,
      );

      // Usamos un array temporal para procesar los elementos
      const processingPromises: Promise<void>[] = [];

      for (const item of itemsExpedientes) {
        // Creamos un objeto wrapper para poder usar WeakMap/WeakSet
        // (necesitamos un objeto, no un valor primitivo)
        const itemWrapper = { data: item };

        // Guardamos datos temporales en WeakMap para uso durante el procesamiento
        this.expedienteCache.set(itemWrapper, {
          processingStartTime: Date.now(),
          expedienteId: item.expedienteId,
        });

        const promise = this.queueService
          .addToExpsQueue({
            id: `exp-${item.expedienteId}`,
            data: item,
            status: "pending",
          })
          .then(() => {
            // Marcar como procesado usando WeakSet
            this.processedItems.add(itemWrapper);

            // Liberar memoria explícitamente eliminando del cache
            this.expedienteCache.delete(itemWrapper);
          });

        processingPromises.push(promise);
      }

      this.logger.log("[QUEUE] - Se agregan en la cola de expedientes");
      await Promise.all(processingPromises);

      // Forzar la limpieza de las referencias para ayudar al GC
      const tempItemsExpedientes = itemsExpedientes;

      // Este es un truco para ayudar al GC (vaciar el array antes de eliminarlo)
      while (tempItemsExpedientes.length > 0) {
        tempItemsExpedientes.pop();
      }

      const queueMetrics = await this.queueService.getQueueMetrics();
      this.logger.debug(
        `Estado actual de las colas: ${JSON.stringify(queueMetrics)}`,
      );

      return { success: true, processed: itemsExpedientes.length };
    } catch (error) {
      this.logger.error(
        `Error en la tarea programada: ${error.message}`,
        error.stack,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { success: false, error: error.message };
    }
  }

  /**
   * Ejecuta la tarea de forma manual
   */
  async triggerManualExecution() {
    this.logger.log("Ejecución manual solicitada");
    // También verificamos si está habilitado antes de la ejecución manual
    if (!this.isEnabled) {
      this.logger.log(
        "[MANUAL_EXECUTION] - Servicio deshabilitado, no se puede ejecutar.",
      );
      return { success: false, reason: "service_disabled" };
    }

    return this.getExpsAndAddToQueue();
  }

  /**
   * Helper para limpiar memoria explícitamente
   */
  cleanupMemory() {
    // WeakMap y WeakSet no necesitan limpieza manual
    // Sus elementos se limpiarán cuando no existan otras referencias

    // Forzar GC si está disponible
    if (global.gc) {
      global.gc();
    }
  }
}
