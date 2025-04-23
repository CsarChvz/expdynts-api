// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT || "3000", 10),
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || "",
  },
  queue: {
    concurrency: {
      exps: parseInt(process.env.EXPS_QUEUE_CONCURRENCY || "5", 10),
      notifications: parseInt(
        process.env.NOTIFICATIONS_QUEUE_CONCURRENCY || "3",
        10,
      ),
    },
    // BullMQ soporta varios tipos de trabajo:
    // - 'sandboxed': Mejor aislamiento y estabilidad, pero levemente más lento
    // - 'worker': Más rápido, pero corre en el hilo principal
    jobType: process.env.QUEUE_JOB_TYPE || "sandboxed",
    // Para el modo 'sandboxed', podemos especificar el número de workers
    workers: parseInt(process.env.QUEUE_WORKERS || "2", 10),
  },
  cron: {
    dataFetchInterval: process.env.DATA_FETCH_CRON || "*/10 * * * * *", // Por defecto cada 10 segundos
  },
  hash: {
    encryptionKey: process.env.ENCRYPTION_KEY || "tu-clave-privada",
  },
});
