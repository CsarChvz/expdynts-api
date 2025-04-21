export interface ExpQueueItem {
  id: string;
  data: any;
  processedAt?: Date;
  status: "pending" | "processing" | "completed" | "failed";
  retries?: number;
  shouldNotify?: boolean;
}

export interface ExpJobResult {
  id: string;
  processed: boolean;
  processingTime: number;
  result: string;
}

// Interfaz para los elementos de la cola 'notifications'
export interface NotificationQueueItem {
  id: string;
  expId: string;
  type: "email" | "sms" | "push";
  recipient: string;
  content: any;
  status: "pending" | "sent" | "failed";
  retries?: number;
}

export interface NotificationJobResult {
  id: string;
  recipient: string;
  type: string;
  sent: boolean;
  sentAt: Date;
  processingTime: number;
}
