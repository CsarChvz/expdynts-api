// src/modules/queue/consumers/notifications.consumer.ts
import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger, Injectable, OnModuleDestroy } from "@nestjs/common";
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
export class NotificationsConsumer
  extends WorkerHost
  implements OnModuleDestroy
{
  private readonly logger = new Logger(NotificationsConsumer.name);
  private readonly concurrency: number;

  private readonly jobMetadata = new WeakMap<
    Job<NotificationQueueItem>,
    {
      startTime: number;
      formattedMessage?: string;
    }
  >();

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

  onModuleDestroy() {
    this.cleanup();
  }

  private cleanup(): void {
    this.logger.log("Limpiando recursos del consumidor de notificaciones");
  }

  @OnWorkerEvent("active")
  onActive(job: Job<NotificationQueueItem>) {
    this.jobMetadata.set(job, { startTime: Date.now() });
    this.logger.debug(`Procesando notificación #${job.id} - ${job.data.id}`);
  }

  @OnWorkerEvent("completed")
  onComplete(job: Job<NotificationQueueItem>) {
    this.logger.debug(`Notificación #${job.id} enviada correctamente`);
    this.jobMetadata.delete(job);
  }

  @OnWorkerEvent("failed")
  onError(job: Job<NotificationQueueItem>, error: Error) {
    this.logger.error(
      `Error enviando notificación #${job.id}: ${error.message}`,
      error.stack,
    );
    this.jobMetadata.delete(job);
  }

  async process(
    job: Job<NotificationQueueItem>,
  ): Promise<NotificationJobResult> {
    const startTime = Date.now();
    const { id, content } = job.data;
    this.logger.log(`Enviando notificación ${id}`);

    const telefono = content.data?.atributosUsuario?.telefono ?? "";
    let textoWhatsApp: string | null = null;

    try {
      await job.updateProgress(20);
      await job.updateProgress(50);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      textoWhatsApp = this.formatMessage(content);

      const metadata = this.jobMetadata.get(job);
      if (metadata) {
        metadata.formattedMessage = textoWhatsApp ?? "";
      }

      await this.queueService.sendNotification("/api/sendText", {
        phone: telefono,
        text: textoWhatsApp ?? "",
      });

      await job.updateProgress(80);
      await job.updateData({
        ...job.data,
        status: "sent",
      });
      await job.updateProgress(100);

      return {
        id,
        sent: true,
        sentAt: new Date(),
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      await job.updateData({
        ...job.data,
        status: "failed",
        retries: (job.data.retries || 0) + 1,
      });
      throw error;
    } finally {
      textoWhatsApp = null;
    }
  }

  formatMessage(data: ComparacionResultado): string {
    let message = "";

    try {
      if (data.nuevoRegistro) {
        message += "🆕 *¡Nuevo expediente detectado!*\n\n";
      } else if (data.haCambiado && data.data) {
        message +=
          "📝 *Se han detectado cambios en un expediente existente*\n\n";
      } else {
        return "✅ No se han detectado cambios en los expedientes monitoreados.";
      }

      if (data.data) {
        const expedienteExp = data.data.expediente?.exp || "";
        const expedienteFecha = data.data.expediente?.fecha || "";
        const juzgadoName = data.data.juzgado?.name || "";
        const juzgadoExtracto =
          data.data.juzgado?.extracto?.extracto_name || "";
        const telefono = data.data.atributosUsuario?.telefono || "";

        message += `*Expediente:* ${expedienteExp}\n`;
        message += `*Año:* ${expedienteFecha}\n`;
        message += `*Juzgado:* ${juzgadoName}\n`;
        message += `*Lugar:* ${juzgadoExtracto}\n`;

        if (telefono) {
          message += `*Teléfono de contacto:* ${telefono}\n`;
        }

        const cambiosRealizados = data.data.cambiosRealizados || [];
        if (cambiosRealizados.length > 0) {
          message += "\n*Cambios realizados:*\n";

          for (let i = 0; i < cambiosRealizados.length; i++) {
            const cambio = cambiosRealizados[i];
            if (!cambio) continue;

            message += `\n📋 *Cambio ${i + 1}:*\n`;

            const exp = cambio.EXP || "";
            const cveJuz = cambio.CVE_JUZ || "";
            const fchPro = cambio.FCH_PRO
              ? new Date(cambio.FCH_PRO).getTime()
              : null;
            const fchAcu = cambio.FCH_ACU
              ? new Date(cambio.FCH_ACU).getTime()
              : null;
            const fchRes = cambio.FCH_RES
              ? new Date(cambio.FCH_RES).getTime()
              : null;
            const boletin = cambio.BOLETIN || "";
            const boletin2 = cambio.BOLETIN2 || "";
            const boletin3 = cambio.BOLETIN3 || "";
            const descrip = cambio.DESCRIP || "";
            const actNames = cambio.act_names || "";
            const demNames = cambio.dem_names || "";
            const autNames = cambio.aut_names || "";
            const proNames = cambio.pro_names || "";

            message += `• *Expediente:* ${exp}\n`;
            message += `• *Juzgado:* ${cveJuz}\n`;
            if (fchPro) {
              message += `• *Fecha de procedimiento:* ${this.formatDate(fchPro)}\n`;
            }
            if (fchAcu) {
              message += `• *Fecha de acuerdo:* ${this.formatDate(fchAcu)}\n`;
            }
            if (fchRes) {
              message += `• *Fecha de resolución:* ${this.formatDate(fchRes)}\n`;
            }
            if (boletin) message += `• *Boletín principal:* ${boletin}\n`;
            if (boletin2) message += `• *Boletín secundario:* ${boletin2}\n`;
            if (boletin3) message += `• *Boletín terciario:* ${boletin3}\n`;
            if (descrip) message += `• *Descripción:* "${descrip}"\n`;
            if (actNames) message += `• *Actores:* ${actNames}\n`;
            if (demNames) message += `• *Demandados:* ${demNames}\n`;
            if (autNames) message += `• *Autoridades:* ${autNames}\n`;
            if (proNames) message += `• *Procedimiento:* ${proNames}\n`;
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Error formateando mensaje: ${(error as Error).message}`,
      );
      message =
        "⚠️ Error al procesar la notificación. Por favor, consulte el sistema para más detalles.";
    }

    return message;
  }

  formatDate(timestamp: number): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha no disponible";
    }
  }
}
