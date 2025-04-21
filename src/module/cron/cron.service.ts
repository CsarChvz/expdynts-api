/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { QueueService } from "../queue/queue.service";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "../../database/schema";
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);
  private readonly dataFetchInterval: string;
  private isEnabled = true;

  constructor(
    private readonly queueService: QueueService,
    @Inject(DATABASE_CONNECTION)
    private readonly database: NeonHttpDatabase<typeof schema>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async fetchDataAndAddToQueue() {
    if (!this.isEnabled) {
      this.logger.debug("Cron deshabilitado. Saltando ejecución");
      return;
    }

    try {
      this.logger.log(
        "Ejecutando tarea programada: Obtener datos y agregarlos a la cola",
      );
      const itemsExpedientes =
        await this.database.query.usuarioExpedientes.findMany({
          with: {
            expediente: true,
          },
        });

      this.logger.log(
        `Obtenidos ${itemsExpedientes.length} elementos para procesar`,
      );

      // Para cada elemento, lo agregamos a la cola exps
      const addPromises = itemsExpedientes.map((item) =>
        this.queueService.addToExpsQueue({
          id: String(item.id),
          data: item,
          status: "pending",
        }),
      );

      await Promise.all(addPromises);
      this.logger.log(
        `${itemsExpedientes.length} elementos agregados a la cola exitosamente`,
      );

      // Obtenemos métricas actuales de las colas
      const queueMetrics = await this.queueService.getQueueMetrics();
      this.logger.debug(
        `Estado actual de las colas: ${JSON.stringify(queueMetrics)}`,
      );
    } catch (error) {
      this.logger.error(
        `Error en la tarea programada: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Habilita o deshabilita la ejecución de tareas programadas
   */
  setCronStatus(enabled: boolean) {
    this.isEnabled = enabled;
    this.logger.log(`Cron ${enabled ? "habilitado" : "deshabilitado"}`);
    return { enabled: this.isEnabled };
  }

  /**
   * Ejecuta la tarea de forma manual
   */
  async triggerManualExecution() {
    this.logger.log("Ejecución manual solicitada");
    return this.fetchDataAndAddToQueue();
  }
}
