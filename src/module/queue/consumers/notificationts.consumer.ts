/* eslint-disable @typescript-eslint/no-unused-vars */

// src/modules/queue/consumers/notifications.consumer.ts
import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job } from "bullmq";
import { QUEUE_NAMES } from "../../../common/constants/queue.constants";
import { NotificationQueueItem } from "src/common/interfaces/queue-items.interface";
import { QueueService } from "../queue.service";
import { ComparacionResultado } from "@/common/types/expediente-queue.type";

interface NotificationJobResult {
  id: string;
  sent: boolean;
  sentAt: Date;
  processingTime: number;
}

@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATIONS, {
  concurrency: 3,
})
export class NotificationsConsumer extends WorkerHost {
  private readonly logger = new Logger(NotificationsConsumer.name);
  private readonly concurrency: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly queueService: QueueService,
  ) {
    super();
    this.concurrency = this.configService.get<number>(
      "queue.concurrency.notifications",
      3,
    );
    this.logger.log(
      `Configurando consumidor de notifications con concurrencia: ${this.concurrency}`,
    );
  }

  @OnWorkerEvent("active")
  onActive(job: Job<NotificationQueueItem>) {
    this.logger.debug(`Procesando notificación #${job.id} - ${job.data.id} `);
  }

  @OnWorkerEvent("completed")
  onComplete(job: Job<NotificationQueueItem>, result: NotificationJobResult) {
    this.logger.debug(`Notificación #${job.id} enviada correctamente`);
  }

  @OnWorkerEvent("failed")
  onError(job: Job<NotificationQueueItem>, error: Error) {
    this.logger.error(
      `Error enviando notificación #${job.id}: ${error.message}`,
      error.stack,
    );
  }

  async process(
    job: Job<NotificationQueueItem>,
  ): Promise<NotificationJobResult> {
    const { id, content } = job.data;
    this.logger.log(`Enviando notificación ${id}`);
    const telefono = content.data?.atributosUsuario.telefono ?? "";

    try {
      await job.updateProgress(20);

      await job.updateProgress(50);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const textoWhatsApp = this.formatMessage(content);

      await this.queueService.sendNotification("/api/sendText", {
        phone: telefono,
        text: textoWhatsApp,
      });

      await job.updateProgress(80);
      await job.updateData({
        ...job.data,
        status: "sent",
      });
      await job.updateProgress(100);

      const result = {
        id,
        sent: true,
        sentAt: new Date(),
        processingTime: 1000,
      };

      return result;
    } catch (error) {
      await job.updateData({
        ...job.data,
        status: "failed",
        retries: (job.data.retries || 0) + 1,
      });

      throw error;
    }
  }

  /*
   * Formatea un mensaje basado en los resultados de comparación de expedientes
   * @param data Objeto con los datos de comparación
   * @returns Un mensaje formateado
   */
  formatMessage(data: ComparacionResultado): string {
    // Inicializamos el mensaje
    let message = "";

    // Si es un nuevo registro
    if (data.nuevoRegistro) {
      message += "🆕 *¡Nuevo expediente detectado!*\n\n";
    }
    // Si hay cambios en un registro existente
    else if (data.haCambiado && data.data) {
      message += "📝 *Se han detectado cambios en un expediente existente*\n\n";
    }
    // Si no hay cambios ni es nuevo
    else {
      return "✅ No se han detectado cambios en los expedientes monitoreados.";
    }

    // Si tenemos datos para mostrar
    if (data.data) {
      const { expediente, cambiosRealizados, atributosUsuario, juzgado } =
        data.data;

      // Información del expediente
      message += `*Expediente:* ${expediente.exp}\n`;
      message += `*Año:* ${expediente.fecha}\n`;
      message += `*Juzgado:* ${juzgado.name}\n`;
      message += `*Lugar:* ${juzgado.extracto.extracto_name}\n`;

      // Información de contacto
      if (atributosUsuario && atributosUsuario.telefono) {
        message += `*Teléfono de contacto:* ${atributosUsuario.telefono}\n`;
      }

      // Detalles de cambios realizados
      if (cambiosRealizados && cambiosRealizados.length > 0) {
        message += "\n*Cambios realizados:*\n";

        cambiosRealizados.forEach((cambio, index) => {
          message += `\n📋 *Cambio ${index + 1}:*\n`;
          message += `• *Expediente:* ${cambio.EXP}\n`;
          message += `• *Juzgado:* ${cambio.CVE_JUZ}\n`;

          // Fechas importantes
          if (cambio.FCH_PRO)
            message += `• *Fecha de procedimiento:* ${this.formatDate(new Date(cambio.FCH_PRO).getTime())}\n`;

          if (cambio.FCH_ACU)
            message += `• *Fecha de acuerdo:* ${this.formatDate(new Date(cambio.FCH_ACU).getTime())}\n`;

          if (cambio.FCH_RES)
            message += `• *Fecha de resolución:* ${this.formatDate(new Date(cambio.FCH_RES).getTime())}\n`;

          // Información de boletín
          if (cambio.BOLETIN)
            message += `• *Boletín principal:* ${cambio.BOLETIN}\n`;
          if (cambio.BOLETIN2)
            message += `• *Boletín secundario:* ${cambio.BOLETIN2}\n`;
          if (cambio.BOLETIN3)
            message += `• *Boletín terciario:* ${cambio.BOLETIN3}\n`;
          // Descripción
          if (cambio.DESCRIP) {
            message += `• *Descripción:* "${cambio.DESCRIP}"\n`;
          }

          // Personas involucradas
          if (cambio.act_names) message += `• *Actores:* ${cambio.act_names}\n`;
          if (cambio.dem_names)
            message += `• *Demandados:* ${cambio.dem_names}\n`;
          if (cambio.aut_names)
            message += `• *Autoridades:* ${cambio.aut_names}\n`;
          if (cambio.pro_names)
            message += `• *Procedimiento:* ${cambio.pro_names}\n`;
        });
      }
    }

    return message;
  }

  /*
   * Convierte un timestamp a formato de fecha legible
   * @param timestamp Timestamp en milisegundos
   * @returns Fecha formateada (DD/MM/YYYY)
   */
  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
