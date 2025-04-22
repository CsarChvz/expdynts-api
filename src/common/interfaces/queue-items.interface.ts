import type { UsuarioExpedienteConExpediente } from "../../database/schema";

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
  type: "email" | "sms" | "push";
  recipient: string;
  content: any;
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

interface ExpedienteObjeto {
  EXP: string;
  CVE_JUZ: string;
  FCH_PRO: string;
  FCH_ACU: string;
  BOLETIN: string | null | number;
  BOLETIN2?: string | null | number;
  BOLETIN3?: string | null | number;
  TIPO: string;
  NOTIFICACI: string;
  DI: string;
  FCH_RES: string | null;
  DESCRIP: string;
  act_names: string;
  dem_names: string;
  aut_names?: string;
  pro_names?: string;
}

export {
  ExpQueueItem,
  NotificationQueueItem,
  NotificationJobResult,
  ExpedienteObjeto,
};
