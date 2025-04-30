import type { UsuarioExpedienteConExpediente } from "../../database/schema";
import { ComparacionResultado } from "../types/expediente-queue.type";

interface ExpQueueItem {
  id: string;
  data: UsuarioExpedienteConExpediente;
  processedAt?: Date;
  status: "pending" | "processing" | "completed" | "failed";
  retries?: number;
  shouldNotify?: boolean;
}

// Interfaz para los elementos de la cola 'notifications'
interface NotificationQueueItem {
  id: string;
  expId: string;
  content: ComparacionResultado;
  status: "pending" | "sent" | "failed";
  retries?: number;
}

interface NotificationJobResult {
  id: string;
  recipient: string;
  type: string;
  sent: boolean;
  sentAt: Date;
  processingTime: number;
}

export { ExpQueueItem, NotificationQueueItem, NotificationJobResult };
