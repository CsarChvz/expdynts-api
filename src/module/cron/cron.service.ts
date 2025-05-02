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
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10AM, {
    timeZone: "America/Mexico_City", // o la zona que necesites
  })
  async getExpsAndAddToQueue() {
    // Verificar si el servicio está habilitado antes de ejecutar

    await this.queueService.sendNotification("/api/sendText", {
      phone: "5213314825663",
      text: "Cron mandado a llamar",
    });
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

      const addPromises = itemsExpedientes.map((item) =>
        this.queueService.addToExpsQueue({
          id: `exp-${item.expedienteId}`,
          data: item,
          status: "pending",
        }),
      );

      this.logger.log("[QUEUE] - Se ingregan en la cola de expedientes");
      await Promise.all(addPromises);

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
    // También verificamos si está habilitado antes de la ejecución manual
    if (!this.isEnabled) {
      this.logger.log(
        "[MANUAL_EXECUTION] - Servicio deshabilitado, no se puede ejecutar.",
      );
      return { success: false, reason: "service_disabled" };
    }
    return this.getExpsAndAddToQueue();
  }
}
