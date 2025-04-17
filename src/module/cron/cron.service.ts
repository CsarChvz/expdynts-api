/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { QueueService } from "../queue/queue.service";
import { DataService } from "../data/data.service";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { v4 as uuidv4 } from "uuid";
@Injectable()
export class CronService implements OnModuleInit {
  private readonly logger = new Logger(CronService.name);
  private readonly dataFetchInterval: string;
  private isEnabled = true;

  constructor(
    private readonly queueService: QueueService,
    private readonly dataService: DataService,
    private readonly configService: ConfigService,
  ) {
    // Obtener la configuración del cron
    this.dataFetchInterval = this.configService.get<string>(
      "cron.dataFetchInterval",
      CronExpression.EVERY_10_SECONDS,
    );
  }

  async onModuleInit() {
    // Iniciar con una carga inicial de datos
    this.logger.log("Inicializando carga inicial de datos");
    await this.fetchDataAndAddToQueue();
  }

  @Cron("cronTime")
  async fetchDataAndAddToQueue() {
    if (!this.isEnabled) {
      this.logger.debug("Cron deshabilitado. Saltando ejecución");
      return;
    }

    try {
      this.logger.log(
        "Ejecutando tarea programada: Obtener datos y agregarlos a la cola",
      );

      // Obtenemos datos desde el servicio de datos
      const items = await this.dataService.fetchPendingItems();
      this.logger.log(`Obtenidos ${items.length} elementos para procesar`);

      // Para cada elemento, lo agregamos a la cola exps
      const addPromises = items.map((item) =>
        this.queueService.addToExpsQueue({
          id: item.id || uuidv4(),
          data: item,
          status: "pending",
        }),
      );

      await Promise.all(addPromises);
      this.logger.log(
        `${items.length} elementos agregados a la cola exitosamente`,
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
