/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpService } from "@nestjs/axios";
import { InjectQueue } from "@nestjs/bullmq";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Queue, QueueEvents } from "bullmq";
import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { HttpsProxyAgent } from "https-proxy-agent";
import { lastValueFrom } from "rxjs";
import { JOB_NAMES, QUEUE_NAMES } from "src/common/constants/queue.constants";
import {
  ExpedienteObjeto,
  ExpQueueItem,
  NotificationQueueItem,
} from "src/common/interfaces/queue-items.interface";
import { DATABASE_CONNECTION } from "src/database/database-connection";
import * as schema from "../../database/schema";
import { v4 as uuid } from "uuid";
import { desc, eq } from "drizzle-orm";

type Acuerdo = Record<string, any>; // flexible tipo JSON
interface propsAcuerdos {
  usuarioExpediente: number;
  hashNuevo: string;
  acuerdo: ExpedienteObjeto[];
}
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private queueEvents: QueueEvents;

  constructor(
    @InjectQueue(QUEUE_NAMES.EXPS) private expsQueue: Queue<ExpQueueItem>,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
    private notificationsQueue: Queue<NotificationQueueItem>,
    private httpService: HttpService,
    @Inject(DATABASE_CONNECTION)
    private readonly database: NeonHttpDatabase<typeof schema>,
  ) {}

  /**
   * Agrega un nuevo elemento a la cola de exps
   * @param item Elemento a agregar a la cola
   */
  async addToExpsQueue(item: ExpQueueItem) {
    try {
      this.logger.log(`Agregando item a la cola exps: ${item.id}`);

      // En BullMQ, debemos especificar un nombre para el job
      const job = await this.expsQueue.add(JOB_NAMES.PROCESS_EXP, item, {
        priority: 1, // Mayor prioridad
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        jobId: uuid(),
      });

      return job;
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
          jobId: String(item.id),
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
      this.expsQueue.getWaitingCount(),
      this.expsQueue.getFailedCount(),
      this.expsQueue.getCompletedCount(),
      this.notificationsQueue.count(),
      this.notificationsQueue.getActiveCount(),
      this.notificationsQueue.getWaitingCount(),
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

  async fetchExpediente(url: string): Promise<ExpedienteObjeto[]> {
    const login = "a698053eb4a3eeaabac6";
    const password = "9ce98dafba032b0f";
    const host = "gw.dataimpulse.com";
    const port = "823";

    const httpsAgent = new HttpsProxyAgent(
      `http://${login}:${password}@${host}:${port}/`,
    );

    const result = await lastValueFrom(
      this.httpService.get(url, {
        httpsAgent,
      }),
    );
    return result.data.data;
  }

  // Actualización del campo acuerdos_json
  async updateAcuerdosExpediente(
    expedienteId: number,
    acuerdos: Acuerdo,
  ): Promise<void> {
    await this.database
      .update(schema.expedientes)
      .set({ acuerdos_json: acuerdos })
      .where(eq(schema.expedientes.expedienteId, expedienteId));
  }

  // 2 . Se obtiene el hashAnterior
  // 2.1. Buscamos el hashAnterior en la tabla historial
  // 2.2 Si no hay ningun registro. Se crea con el expedienteId y el acuerdo hasheado y su valo

  // 3.  Se guarda el acuerdoNuevo
  async comparacionAcuerdos({
    usuarioExpediente,
    hashNuevo,
    acuerdo,
  }: propsAcuerdos) {
    // 1. Buscar el último hash guardado para ese expediente
    const ultimoAcuerdo = await this.database.query.acuerdosHistorial.findFirst(
      {
        where: eq(
          schema.acuerdosHistorial.usuarioExpedienteId,
          usuarioExpediente,
        ),
        orderBy: [desc(schema.acuerdosHistorial.createdAt)],
      },
    );

    const hashAnterior = ultimoAcuerdo?.hash;

    // 2. Si no hay acuerdo anterior, se guarda directamente
    if (!ultimoAcuerdo) {
      await this.database.insert(schema.acuerdosHistorial).values({
        acuerdos: acuerdo,
        usuarioExpedienteId: usuarioExpediente,
        hash: hashNuevo,
        createdAt: new Date(),
      });

      return {
        nuevoRegistro: true,
        haCambiado: false,
        mensaje: "No existía historial previo, se creó uno nuevo.",
      };
    }

    // 3. Si ya hay un hash, se compara con el nuevo
    const haCambiado = hashAnterior !== hashNuevo;
    console.log(String(hashAnterior).slice(0, 10));
    console.log("-----------------------------------------");
    console.log(String(hashNuevo).slice(0, 10));

    if (haCambiado) {
      // 3.1 Guardamos el nuevo hash si ha cambiado
      await this.database.insert(schema.acuerdosHistorial).values({
        acuerdos: acuerdo,
        usuarioExpedienteId: usuarioExpediente,
        hash: hashNuevo,
        createdAt: new Date(),
      });

      return {
        nuevoRegistro: false,
        haCambiado: true,
        mensaje: "El acuerdo ha cambiado. Se registró un nuevo hash.",
      };
    }

    // 4. Si no ha cambiado, no hacemos nada
    return {
      nuevoRegistro: false,
      haCambiado: false,
      mensaje: "El acuerdo es el mismo. No se creó un nuevo registro.",
    };
  }
}
