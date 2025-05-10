// memory-cleanup.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class MemoryCleanupService {
  private readonly logger = new Logger(MemoryCleanupService.name);

  @Cron("*/10 * * * *") // Cada 10 minutos
  async handleMemoryCleanup() {
    // Capturar métricas antes de GC
    const memoryBefore = process.memoryUsage();
    this.logger.log(
      `Antes de GC: ${Math.round(memoryBefore.heapUsed / 1024 / 1024)} MB en uso`,
    );

    // Forzar recolección de basura si está disponible
    if (global.gc) {
      console.log("GC disponible - ejecutando limpieza forzada");
      global.gc();

      // Esperar un momento para que se complete el GC
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Capturar métricas después de GC
      const memoryAfter = process.memoryUsage();
      const memorySaved = memoryBefore.heapUsed - memoryAfter.heapUsed;

      this.logger.log(
        `Después de GC: ${Math.round(memoryAfter.heapUsed / 1024 / 1024)} MB en uso ` +
          `(Liberados: ${Math.round(memorySaved / 1024 / 1024)} MB)`,
      );

      if (memorySaved > 0) {
        this.logger.log("✅ Recolección de basura exitosa");
      } else {
        this.logger.warn(
          "⚠️ La recolección de basura no liberó memoria significativa",
        );
      }
    } else {
      this.logger.warn(
        "⚠️ global.gc no está disponible. Ejecuta con --expose-gc",
      );

      const memoryUsage = process.memoryUsage();
      this.logger.log(
        `Limpieza de memoria no ejecutada: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB en uso`,
      );
    }
  }
}
