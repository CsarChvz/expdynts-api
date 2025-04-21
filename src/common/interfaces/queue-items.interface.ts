export interface ExpQueueItem {
  id: number;
  data: any;
  processedAt?: Date;
  status: "pending" | "processing" | "completed" | "failed";
  retries?: number;
  shouldNotify?: boolean;
}

export interface ExpJobResult {
  id: number;
  processed: boolean;
  processingTime: number;
  result: string;
}

// Interfaz para los elementos de la cola 'notifications'
export interface NotificationQueueItem {
  id: number;
  expId: string;
  type: "email" | "sms" | "push";
  recipient: string;
  content: any;
  status: "pending" | "sent" | "failed";
  retries?: number;
}

export interface NotificationJobResult {
  id: number;
  recipient: string;
  type: string;
  sent: boolean;
  sentAt: Date;
  processingTime: number;
}
