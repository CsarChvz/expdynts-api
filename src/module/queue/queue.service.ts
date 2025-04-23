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
import {
  Acuerdo,
  ComparacionResultado,
  PropsAcuerdos,
} from "./types/expedientes.queue.t";

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
          priority: 1, // Priorizar según tipo
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

  async sendNotification(
    endPoint: string,
    contentMessage: {
      phone: string;
      text: string;
    },
  ) {
    const payload = {
      chatId: contentMessage.phone + "@c.us",
      reply_to: null,
      text: contentMessage.text,
      linkPreview: true,
      linkPreviewHighQuality: false,
      session: "default",
    };
    const result = await lastValueFrom(
      this.httpService.post(process.env.NOTIFICATION_URL + endPoint, payload, {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }),
    );
    return result.data;
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

  async comparacionAcuerdos({
    usuarioExpediente,
    hashNuevo,
    acuerdosActuales,
  }: PropsAcuerdos): Promise<ComparacionResultado> {
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
        acuerdos: acuerdosActuales,
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

    if (haCambiado) {
      const acuerdosAnteriores = ultimoAcuerdo.acuerdos as ExpedienteObjeto[];
      const cambiosRealizados = this.detectarCambiosEnAcuerdos(
        acuerdosAnteriores,
        acuerdosActuales,
      );

      // 3.1 Guardamos el nuevo hash si ha cambiado
      const acuerdoHistorialNuevo = await this.database
        .insert(schema.acuerdosHistorial)
        .values({
          acuerdos: acuerdosActuales,
          usuarioExpedienteId: usuarioExpediente,
          cambios_realizados: cambiosRealizados,
          hash: hashNuevo,
          createdAt: new Date(),
        })
        .returning({
          userExpedienteId: schema.acuerdosHistorial.usuarioExpedienteId,
        });

      // Consulta mejorada para obtener datos del usuario y sus atributos
      const userExpediente =
        await this.database.query.usuarioExpedientes.findFirst({
          where: eq(
            schema.usuarioExpedientes.usuarioExpedientesId,
            acuerdoHistorialNuevo[0].userExpedienteId,
          ),
          with: {
            usuario: {
              with: {
                attributes: {
                  columns: {
                    nombre_usuario: true,
                    apellido: true,
                    phoneNumber: true,
                    preferencias: true,
                  },
                },
              },
            },
            expediente: {
              columns: {
                exp: true,
                extracto: true,
                cve_juz: true,
                fecha: true,
              },
            },
          },
        });

      if (
        userExpediente?.expediente.exp !== undefined &&
        userExpediente?.expediente.fecha !== undefined &&
        userExpediente?.expediente.extracto !== undefined &&
        userExpediente?.expediente.cve_juz !== undefined
      ) {
        return {
          nuevoRegistro: false,
          haCambiado: true,
          mensaje: "Nuevo acuerdo",
          data: {
            cambiosRealizados,
            atributosUsuario: {
              telefono: userExpediente?.usuario.attributes.phoneNumber ?? "",
            },
            expediente: {
              exp: userExpediente.expediente.exp,
              fecha: userExpediente.expediente.fecha,
              cve_juz: userExpediente.expediente.cve_juz,
            },
          },
        };
      }
    }

    // 4. Si no ha cambiado, no hacemos nada
    return {
      nuevoRegistro: false,
      haCambiado: false,
      mensaje: "El acuerdo es el mismo. No se creó un nuevo registro.",
    };
  }

  detectarCambiosEnAcuerdos(
    acuerdosAnteriores: ExpedienteObjeto[] | undefined | null,
    acuerdosActuales: ExpedienteObjeto[] | undefined | null,
  ): ExpedienteObjeto[] {
    const cambios: ExpedienteObjeto[] = [];

    // Verificación defensiva: si alguno de los arreglos es null o undefined, los tratamos como vacíos
    const anteriores = acuerdosAnteriores || [];
    const actuales = acuerdosActuales || [];

    // Crear un mapa de los acuerdos anteriores usando una clave compuesta
    const mapaAcuerdosAnteriores = new Map<string, ExpedienteObjeto>();
    anteriores.forEach((acuerdo) => {
      const clave = `${acuerdo.EXP}-${acuerdo.FCH_ACU}`;
      mapaAcuerdosAnteriores.set(clave, acuerdo);
    });

    // Verificar cada acuerdo actual contra los anteriores
    actuales.forEach((acuerdoActual) => {
      const clave = `${acuerdoActual.EXP}-${acuerdoActual.FCH_ACU}`;
      const acuerdoAnterior = mapaAcuerdosAnteriores.get(clave);

      // Si no existe el acuerdo anterior con la misma clave, es nuevo
      if (!acuerdoAnterior) {
        cambios.push(acuerdoActual);
        return;
      }

      // Si existe, verificamos si algún campo relevante ha cambiado
      const camposRelevantes: (keyof ExpedienteObjeto)[] = [
        "DESCRIP",
        "NOTIFICACI",
        "BOLETIN",
        "BOLETIN2",
        "BOLETIN3",
        "TIPO",
        "DI",
        "FCH_RES",
        "act_names",
        "dem_names",
        "aut_names",
        "pro_names",
      ];

      const hayCambios = camposRelevantes.some(
        (campo) => acuerdoAnterior[campo] !== acuerdoActual[campo],
      );

      if (hayCambios) {
        cambios.push(acuerdoActual);
      }

      // Eliminar del mapa para rastrear después los que fueron eliminados
      mapaAcuerdosAnteriores.delete(clave);
    });

    // Los acuerdos eliminados también son cambios importantes
    mapaAcuerdosAnteriores.forEach((acuerdoEliminado) => {
      cambios.push(acuerdoEliminado);
    });

    return cambios;
  }
}
